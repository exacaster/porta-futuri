#!/bin/bash

echo "========================================="
echo "CDP Integration Verification Test"
echo "========================================="
echo ""

# Test with the saved bearer token
echo "Testing with saved bearer token (5bd1759ca2a542e786cf47084450af99)..."
echo ""

curl -s -X POST "https://rvlbbgdkgneobvlyawix.supabase.co/functions/v1/cdp-proxy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTM1MTIsImV4cCI6MjA3MDQ2OTUxMn0.hz5d5bKI5kxLVAz9SohS4wz-Qufc8em_aQPTVJF7GhA" \
  -d '{
    "action": "test",
    "config": {
      "workspace_id": "765",
      "resource_id": "customer_metrics",
      "api_url": "https://customer360.exacaster.com/courier/api/v1",
      "bearer_token": "5bd1759ca2a542e786cf47084450af99"
    }
  }' | jq .

echo ""
echo "========================================="
echo "Result Analysis:"
echo "========================================="
echo ""
echo "✅ If you see 'Connection successful', the integration is working!"
echo "❌ If you see 'Invalid credentials', the token might have expired."
echo ""
echo "To use in Admin Panel:"
echo "1. Go to http://localhost:5174/"
echo "2. Navigate to Integrations tab"
echo "3. Click on 'Exacaster CVM Platform'"
echo "4. Leave the Bearer Token field EMPTY (it will use the saved token)"
echo "5. Click 'Test Connection'"
echo "6. You should see 'Connection test successful!'"
echo ""
echo "If you need to update the token:"
echo "1. Enter the new token in the Bearer Token field"
echo "2. Click 'Save Configuration' first"
echo "3. Then click 'Test Connection'"