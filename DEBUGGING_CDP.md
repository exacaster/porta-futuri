# CDP Integration Debugging Guide

## Current Status
The CDP integration is set up and the Edge Function is deployed. The test is returning "Invalid credentials" which is the expected behavior when testing with dummy credentials.

## How to Debug

### 1. Open Browser Console
Open your browser's Developer Tools (F12) and go to the Console tab while on the admin panel.

### 2. Try Testing Connection
When you click "Test Connection", you should see these logs in the console:
```
Testing CDP integration with config: {...}
CDP test response: {data: {...}, error: null}
```

### 3. Expected Responses

#### Successful Connection (with valid Exacaster credentials):
```json
{
  "success": true,
  "message": "Connection successful"
}
```

#### Invalid Credentials (current response with test token):
```json
{
  "success": false,
  "message": "Invalid credentials - please check your bearer token"
}
```

#### Invalid Workspace/Resource:
```json
{
  "success": false,
  "message": "Invalid workspace or resource ID"
}
```

## Test Endpoints

### Direct Edge Function Test:
```bash
curl -X POST "https://rvlbbgdkgneobvlyawix.supabase.co/functions/v1/cdp-proxy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "action": "test",
    "config": {
      "workspace_id": "YOUR_WORKSPACE_ID",
      "resource_id": "YOUR_RESOURCE_ID",
      "api_url": "https://customer360.exacaster.com/courier/api/v1",
      "bearer_token": "YOUR_BEARER_TOKEN"
    }
  }'
```

### Direct Exacaster API Test:
```bash
curl -X GET "https://customer360.exacaster.com/courier/api/v1/workspaces/YOUR_WORKSPACE_ID/resources/YOUR_RESOURCE_ID?userId=TEST_USER&page=0&size=1" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
  -H "Accept: application/json"
```

## Common Issues and Solutions

### Issue: "Edge Function returned a non-2xx status code"
**Solution**: This usually means the function is working but returning an error response. Check the console logs for the actual response.

### Issue: "Invalid credentials - please check your bearer token"
**Solution**: This is expected if you're using a test token. You need a valid Exacaster bearer token.

### Issue: No response or timeout
**Solution**: 
1. Check if the Edge Function is deployed: `npx supabase functions list --project-ref rvlbbgdkgneobvlyawix`
2. Check if Docker is running (for local deployment)
3. Verify the Supabase URL and keys in your .env file

## Configuration Values

Your current configuration:
- **API URL**: https://customer360.exacaster.com/courier/api/v1
- **Workspace ID**: 765
- **Resource ID**: customer_metrics
- **Bearer Token**: (hidden - needs valid token from Exacaster)

## Next Steps

1. **Get Valid Credentials from Exacaster**:
   - Contact your Exacaster account manager
   - Request API access to Customer 360 platform
   - Get your workspace ID, resource ID, and bearer token

2. **Test with Valid Credentials**:
   - Enter the real credentials in the admin panel
   - Click "Test Connection"
   - If successful, you'll see "Connection test successful!"
   - Then click "Activate" to enable the integration

3. **Verify Data Flow**:
   - Once activated, the widget will automatically fetch customer profiles
   - Check the `cdp_request_logs` table in Supabase for request history
   - Monitor response times and success rates

## Support

If you continue to have issues:
1. Check the Edge Function logs in Supabase Dashboard
2. Verify your Exacaster API access is active
3. Ensure your bearer token has the correct permissions
4. Check if there are any IP restrictions on your Exacaster account