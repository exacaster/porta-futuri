#!/bin/bash

# Test product validation - AI should only return products that exist in the catalog

API_URL="http://localhost:54321/functions/v1/recommendations"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Sample product data with specific IDs
PRODUCTS='[
  {"product_id": "tv-001", "name": "Samsung OLED TV 55\"", "price": 1299, "category": "TV", "description": "Premium OLED display"},
  {"product_id": "phone-002", "name": "iPhone 15 Pro", "price": 1199, "category": "Phone", "description": "Latest iPhone"},
  {"product_id": "tablet-003", "name": "iPad Pro 12.9\"", "price": 1099, "category": "Tablet", "description": "Professional tablet"}
]'

echo "Testing product validation..."
echo "================================"
echo ""

echo "Available products in catalog:"
echo "$PRODUCTS" | python3 -m json.tool | grep product_id
echo ""

# Test: Request recommendations and verify all returned products exist in catalog
echo "Test: Requesting TV recommendations"
echo "Expected: All recommended products should exist in the catalog with correct details"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"query\": \"Show me your best TVs with great picture quality\",
    \"products\": $PRODUCTS,
    \"conversation_history\": []
  }")

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool
echo ""

# Extract and validate each recommendation
echo "Validating recommendations..."
echo ""

# Save response to file for easier processing
echo "$RESPONSE" > /tmp/test_response.json

# Check each recommendation
python3 << EOF
import json

# Load response
with open('/tmp/test_response.json') as f:
    response = json.load(f)

# Load product catalog
products = $PRODUCTS
product_map = {p['product_id']: p for p in products}

recommendations = response.get('recommendations', [])
print(f"Found {len(recommendations)} recommendations")
print("")

all_valid = True
for i, rec in enumerate(recommendations, 1):
    product_id = rec.get('product_id')
    if product_id in product_map:
        catalog_product = product_map[product_id]
        
        # Verify key fields match
        price_match = rec.get('price') == catalog_product['price']
        name_match = rec.get('name') == catalog_product['name']
        category_match = rec.get('category') == catalog_product['category']
        
        if price_match and name_match and category_match:
            print(f"✅ Recommendation {i}: Valid product {product_id}")
            print(f"   - Name: {rec.get('name')}")
            print(f"   - Price: \${rec.get('price')}")
            print(f"   - Category: {rec.get('category')}")
        else:
            print(f"❌ Recommendation {i}: Product {product_id} data mismatch!")
            print(f"   - Name: {rec.get('name')} vs {catalog_product['name']}")
            print(f"   - Price: {rec.get('price')} vs {catalog_product['price']}")
            print(f"   - Category: {rec.get('category')} vs {catalog_product['category']}")
            all_valid = False
    else:
        print(f"❌ Recommendation {i}: Invalid product ID {product_id} not in catalog!")
        all_valid = False
    
    # Check for AI-specific fields
    if 'reasoning' in rec:
        print(f"   - Reasoning: {rec['reasoning']}")
    if 'match_score' in rec:
        print(f"   - Match Score: {rec['match_score']}")
    print("")

if all_valid and len(recommendations) > 0:
    print("✅ All recommendations are valid and match catalog data!")
elif len(recommendations) == 0:
    print("⚠️  No recommendations returned")
else:
    print("❌ Some recommendations have invalid or mismatched data")
EOF

echo ""
echo "================================"
echo "Product validation test complete!"

# Clean up
rm -f /tmp/test_response.json