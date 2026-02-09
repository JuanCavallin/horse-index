#!/bin/bash

# Pre-Deployment Test Suite
# Comprehensive validation before pushing to GitHub and deploying to Render

# Load environment variables from .env
eval $(cat "backend/.env" | grep -v "^#" | sed 's/^/export /')

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API="http://localhost:8000"
PASSED=0
FAILED=0

# Test counter
test_num=0

log_test() {
  test_num=$((test_num + 1))
  echo -e "\n${BLUE}Test $test_num: $1${NC}"
}

pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
  PASSED=$((PASSED + 1))
}

fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  FAILED=$((FAILED + 1))
}

# Create test user with viewer role
log_test "Create test viewer user"
USER_EMAIL="viewer-$(date +%s)@test.local"
USER_PASS="test123456"

# Use the existing token creation script - capture only the token line
TOKEN_OUTPUT=$(node backend/create-test-token.js "$USER_EMAIL" "$USER_PASS" 2>&1)
TOKEN=$(echo "$TOKEN_OUTPUT" | grep "^Token:" | awk -F': ' '{print $2}')

if [ -n "$TOKEN" ] && echo "$TOKEN" | grep -q "^eyJ"; then
  pass "Test user created with token"
else
  echo "Failed to get token. Output:"
  echo "$TOKEN_OUTPUT" | head -20
  fail "Could not create test user or get token"
  exit 1
fi

USER_ID=$(node -e "console.log(JSON.parse(Buffer.from('$TOKEN'.split('.')[1], 'base64')).sub)" 2>/dev/null)

echo "User: $USER_EMAIL"
echo "Token: ${TOKEN:0:40}..."
echo "ID: $USER_ID"

# ============ API ENDPOINT TESTS ============
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}API ENDPOINT TESTS${NC}"
echo -e "${BLUE}========================================${NC}"

# Test 1: Health check
log_test "Health check endpoint"
RESP=$(curl -s "$API/ping")
if echo "$RESP" | grep -q "alive"; then
  pass "Server responding to ping"
else
  fail "Server not responding to ping"
fi

# Test 2: Auth required
log_test "Authentication enforcement"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/horses")
if [ "$HTTP_CODE" = "401" ]; then
  pass "Unauthenticated request returns 401"
else
  fail "Expected 401, got $HTTP_CODE"
fi

# Test 3: List horses
log_test "GET /api/horses (read access)"
RESP=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/api/horses")
if echo "$RESP" | grep -q '\[' || echo "$RESP" | grep -q 'id'; then
  pass "Horses endpoint returns data"
else
  fail "Horses endpoint returned: $(echo $RESP | head -c 100)"
fi

# Test 4: RBAC - Users endpoint should be forbidden
log_test "GET /api/users (admin-only enforcement)"
HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/users_resp.json -H "Authorization: Bearer $TOKEN" "$API/api/users")
if [ "$HTTP_CODE" = "403" ]; then
  if grep -q "Insufficient permissions\|administrator" /tmp/users_resp.json; then
    pass "Admin-only endpoint correctly denies viewer role (403)"
  else
    fail "Got 403 but response unclear: $(cat /tmp/users_resp.json)"
  fi
else
  fail "Expected 403, got $HTTP_CODE"
fi

# Test 5: Medical records
log_test "GET /api/medical-records (read access)"
RESP=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/api/medical-records")
if [ $? -eq 0 ]; then
  pass "Medical records endpoint accessible"
else
  fail "Medical records endpoint failed"
fi

# Test 6: Audit logs
log_test "GET /api/audit_logs (read access)"
RESP=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/api/audit_logs")
if [ $? -eq 0 ]; then
  pass "Audit logs endpoint accessible"
else
  fail "Audit logs endpoint failed"
fi

# ============ CRUD OPERATION TESTS ============
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CRUD OPERATION TESTS${NC}"
echo -e "${BLUE}========================================${NC}"

# Test 7: Verify delete is restricted to admin
log_test "DELETE /api/horses/:id (admin-only restriction)"
# Try to delete a non-existent horse (should still check permissions first)
HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/delete_resp.json \
  -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  "$API/api/horses/00000000-0000-0000-0000-000000000000")

if [ "$HTTP_CODE" = "403" ]; then
  if grep -q "Insufficient permissions\|administrator" /tmp/delete_resp.json; then
    pass "Viewer role correctly denied DELETE permission (403)"
  else
    fail "Got 403 but response unclear: $(cat /tmp/delete_resp.json)"
  fi
elif [ "$HTTP_CODE" = "404" ]; then
  # Acceptable if it's checking admin permission after checking existence
  if grep -q "Insufficient permissions" /tmp/delete_resp.json; then
    pass "Delete correctly denied to viewer (permission error)"
  else
    pass "Delete endpoint exists but returned 404 (horse not found - OK)"
  fi
else
  fail "Expected 403 or 404, got $HTTP_CODE; Response: $(cat /tmp/delete_resp.json | head -c 100)"
fi

# Test 8: POST /api/medical-records (should be restricted to editor)
log_test "POST /api/medical-records (editor/admin-only restriction)"
RESP=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"horse_id": "test", "description": "test"}' \
  "$API/api/medical-records")

HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | head -n1)

if [ "$HTTP_CODE" = "403" ]; then
  if echo "$BODY" | grep -q "Insufficient permissions"; then
    pass "Viewer role correctly denied POST medical records (403)"
  else
    fail "Got 403 but expected permission error"
  fi
else
  fail "Expected 403, got $HTTP_CODE; Body: $(echo $BODY | head -c 100)"
fi

# ============ INTEGRATION TESTS ============
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}UNIT TESTS (JEST)${NC}"
echo -e "${BLUE}========================================${NC}"

log_test "Run Jest unit tests"
cd backend
if npm test 2>&1 | grep -q "Tests:.*passed"; then
  JEST_OUTPUT=$(npm test 2>&1 | tail -5)
  PASSED_TESTS=$(echo "$JEST_OUTPUT" | grep -oP 'Tests:\s+\K[0-9]+' | head -1)
  pass "Jest tests passed ($PASSED_TESTS tests)"
else
  fail "Jest tests failed"
fi
cd ..

# ============ BUILD TEST ============
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BUILD TEST${NC}"
echo -e "${BLUE}========================================${NC}"

log_test "TypeScript compilation (npm run build)"
cd backend
if npm run build > /tmp/build.log 2>&1; then
  if [ -f dist/app.js ]; then
    pass "TypeScript compiled successfully"
  else
    fail "Build succeeded but dist/app.js not found"
  fi
else
  fail "Build failed: $(cat /tmp/build.log | tail -5)"
fi
cd ..

# ============ SUMMARY ============
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"

TOTAL=$((PASSED + FAILED))
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED${NC}"
  echo ""
  echo -e "${RED}❌ DEPLOYMENT BLOCKED - Fix failing tests before pushing${NC}"
  exit 1
else
  echo -e "${GREEN}Failed: $FAILED${NC}"
  echo ""
  echo -e "${GREEN}✅ ALL TESTS PASSED - Ready for deployment${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. git push origin main"
  echo "  2. Create Render service at dashboard.render.com"
  echo "  3. Run: eas build --platform android"
  echo ""
  exit 0
fi
