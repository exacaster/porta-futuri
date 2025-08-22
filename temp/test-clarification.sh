#!/bin/bash

# Test clarification behavior - AI should not provide recommendations when asking clarifying questions

API_URL="http://localhost:54321/functions/v1/recommendations"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Sample product data
PRODUCTS='[
  {"product_id": "1", "name": "Samsung TV 55\"", "price": 999, "category": "TV"},
  {"product_id": "2", "name": "iPhone 15", "price": 1299, "category": "Phone"},
  {"product_id": "3", "name": "iPad Pro", "price": 899, "category": "Tablet"}
]'

echo "Testing clarification behavior..."
echo "================================"
echo ""

# Test 1: Vague query that should trigger clarification
echo "Test 1: Vague query - 'Can you recommend a device?'"
echo "Expected: Clarifying question with empty recommendations array"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"Can you recommend a device?\",
    \"products\": $PRODUCTS,
    \"conversation_history\": []
  }")

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool
echo ""

# Check if recommendations array is empty
RECOMMENDATIONS=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('recommendations', [])))")
IS_CLARIFYING=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('is_clarifying', False))")

if [ "$RECOMMENDATIONS" = "0" ]; then
  echo "✅ Test 1 PASSED: No recommendations provided during clarification"
else
  echo "❌ Test 1 FAILED: Found $RECOMMENDATIONS recommendations when expecting 0"
fi

if [ "$IS_CLARIFYING" = "True" ]; then
  echo "✅ Test 1 PASSED: is_clarifying flag is True"
else
  echo "⚠️  Test 1 WARNING: is_clarifying flag is not True"
fi

echo ""
echo "================================"
echo ""

# Test 2: Specific query that should provide recommendations
echo "Test 2: Specific query - 'I need a new TV for my living room'"
echo "Expected: Direct recommendations with populated array"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"I need a new TV for my living room\",
    \"products\": $PRODUCTS,
    \"conversation_history\": []
  }")

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool
echo ""

RECOMMENDATIONS=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('recommendations', [])))")
IS_CLARIFYING=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('is_clarifying', False))")

if [ "$RECOMMENDATIONS" -gt "0" ]; then
  echo "✅ Test 2 PASSED: Recommendations provided for specific query"
else
  echo "❌ Test 2 FAILED: No recommendations when expecting some"
fi

if [ "$IS_CLARIFYING" = "False" ]; then
  echo "✅ Test 2 PASSED: is_clarifying flag is False"
else
  echo "⚠️  Test 2 WARNING: is_clarifying flag is not False"
fi

echo ""
echo "================================"
echo "Testing complete!"