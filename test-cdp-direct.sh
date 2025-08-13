#!/bin/bash

# Direct CDP Test Script
# This script tests the CDP connection step by step

echo "======================================"
echo "CDP Integration Direct Test"
echo "======================================"
echo ""

# Configuration (update these with your actual values)
WORKSPACE_ID="765"
RESOURCE_ID="customer_metrics"
API_URL="https://customer360.exacaster.com/courier/api/v1"
BEARER_TOKEN="YOUR_ACTUAL_BEARER_TOKEN"  # Replace this with your actual token

echo "Configuration:"
echo "  Workspace ID: $WORKSPACE_ID"
echo "  Resource ID: $RESOURCE_ID"
echo "  API URL: $API_URL"
echo "  Bearer Token: ${BEARER_TOKEN:0:20}..."
echo ""

# Test 1: Direct Exacaster API
echo "1. Testing Direct Exacaster API..."
echo "   URL: $API_URL/workspaces/$WORKSPACE_ID/resources/$RESOURCE_ID?userId=TEST_USER&page=0&size=1"
echo ""

curl -X GET "$API_URL/workspaces/$WORKSPACE_ID/resources/$RESOURCE_ID?userId=TEST_USER&page=0&size=1" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Accept: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -o response1.json

echo "Response saved to response1.json"
cat response1.json | jq . 2>/dev/null || cat response1.json
echo ""

# Test 2: Via Supabase Edge Function
echo "2. Testing via Supabase Edge Function..."
echo ""

SUPABASE_URL="https://rvlbbgdkgneobvlyawix.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTM1MTIsImV4cCI6MjA3MDQ2OTUxMn0.hz5d5bKI5kxLVAz9SohS4wz-Qufc8em_aQPTVJF7GhA"

curl -X POST "$SUPABASE_URL/functions/v1/cdp-proxy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d "{
    \"action\": \"test\",
    \"config\": {
      \"workspace_id\": \"$WORKSPACE_ID\",
      \"resource_id\": \"$RESOURCE_ID\",
      \"api_url\": \"$API_URL\",
      \"bearer_token\": \"$BEARER_TOKEN\"
    }
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -o response2.json

echo "Response saved to response2.json"
cat response2.json | jq . 2>/dev/null || cat response2.json
echo ""

echo "======================================"
echo "Test Complete"
echo "======================================"
echo ""
echo "Check the responses above to see:"
echo "1. If direct Exacaster API works (should return data or proper error)"
echo "2. If Edge Function properly forwards the request"
echo ""
echo "If Test 1 works but Test 2 doesn't, there's an issue with the Edge Function"
echo "If both fail with 401, the bearer token might be invalid"