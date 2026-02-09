#!/bin/bash
# Manual API Test Script
# Usage: bash backend/tests/manual_test.sh <base_url> <token>
# Example: bash backend/tests/manual_test.sh http://localhost:8000 "Bearer eyJhbGc..."

BASE_URL=${1:-http://localhost:8000}
TOKEN=${2:-"Bearer your_token_here"}

echo "🧪 Running Manual Backend Tests"
echo "Base URL: $BASE_URL"
echo "=================================================="

# Test 1: Ping endpoint (no auth needed)
echo "✓ Test 1: Ping (no auth)"
curl -s "$BASE_URL/ping" | jq .
echo ""

# Test 2: Get horses (requires auth)
echo "✓ Test 2: Get Horses (requires auth)"
curl -s -H "Authorization: $TOKEN" "$BASE_URL/api/horses" | jq .
echo ""

# Test 3: Get single horse with medical records
echo "✓ Test 3: Get Horse #1 with Medical Records"
curl -s -H "Authorization: $TOKEN" "$BASE_URL/api/horses/1" | jq .
echo ""

# Test 4: Create medical record (editor+ only)
echo "✓ Test 4: Create Medical Record (editor+ only)"
curl -s -X POST \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "horse_id": 1,
    "description": "Test checkup",
    "record_type": "checkup",
    "vet_name": "Dr. Test",
    "date": "2026-02-09",
    "notes": "All clear"
  }' \
  "$BASE_URL/api/medical-records" | jq .
echo ""

# Test 5: Update medical record
echo "✓ Test 5: Update Medical Record"
curl -s -X PUT \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated checkup",
    "notes": "Follow-up needed"
  }' \
  "$BASE_URL/api/medical-records/1" | jq .
echo ""

# Test 6: Try to delete medical record (admin only)
echo "✓ Test 6: Delete Medical Record (admin only)"
curl -s -X DELETE \
  -H "Authorization: $TOKEN" \
  "$BASE_URL/api/medical-records/1" -w "\nStatus: %{http_code}\n"
echo ""

# Test 7: Get audit logs (all authenticated users)
echo "✓ Test 7: Get Audit Logs"
curl -s -H "Authorization: $TOKEN" "$BASE_URL/api/audit_logs" | jq .[0:3]
echo ""

# Test 8: Get current user profile
echo "✓ Test 8: Get Current User Profile"
curl -s -H "Authorization: $TOKEN" "$BASE_URL/api/users/me" | jq .
echo ""

# Test 9: Try to list users (admin only)
echo "✓ Test 9: List Users (admin only)"
curl -s -H "Authorization: $TOKEN" "$BASE_URL/api/users" | jq .[0:3]
echo ""

# Test 10: Create horse with treatment
echo "✓ Test 10: Create Horse with Treatment"
curl -s -X POST \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Horse",
    "breed": "Thoroughbred",
    "gender": "Mare",
    "color": "Bay",
    "health_status": "healthy",
    "new_treatments": [
      {
        "type": "Daily medication",
        "frequency": "Twice daily",
        "notes": "For test purposes"
      }
    ]
  }' \
  "$BASE_URL/api/horses" | jq .
echo ""

echo "=================================================="
echo "✅ Manual tests complete!"
echo ""
echo "Notes:"
echo "- Admin-only endpoints should return 403 if token is non-admin"
echo "- Editor endpoints should return 201/200 on success"
echo "- Medical records should use 'medical_records' table (not 'documents')"
echo "- All changes should be logged in audit_trail"
