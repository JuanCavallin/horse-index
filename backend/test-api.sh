#!/bin/bash

# Get a token
TOKEN=$(node create-test-token.js testuser-$(date +%s)@local.test password123 2>&1 | grep "^Token:" | awk '{print $2}')

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

API="http://localhost:8000"

echo ""
echo "=========================================="
echo "Testing Backend API Locally"
echo "=========================================="
echo ""
echo "Token: ${TOKEN:0:50}..."
echo ""

# Test 1: GET /api/horses (no auth required - should fail)
echo "1. GET /api/horses (without auth)"
curl -s "$API/api/horses" | head -c 100
echo ""
echo ""

# Test 2: GET /api/horses (with auth)
echo "2. GET /api/horses (with auth)"
curl -s -H "Authorization: Bearer $TOKEN" "$API/api/horses" | head -c 200
echo ""
echo ""

# Test 3: GET /api/users (requires admin)
echo "3. GET /api/users (requires admin - may be denied)"
curl -s -w "\nStatus: %{http_code}\n" -H "Authorization: Bearer $TOKEN" "$API/api/users" | head -c 300
echo ""
echo ""

# Test 4: Health check
echo "4. GET /ping"
curl -s "$API/ping"
echo ""
echo ""

echo "=========================================="
echo "Local API Tests Complete!"
echo "=========================================="
