# Intent Analysis Authorization Fix Summary

## Issue
The intent-analysis API was returning 401 Unauthorized errors because:
1. The widget was sending the API key using `Authorization: Bearer ${apiKey}` header
2. The intent-analysis function wasn't checking for any authentication at all
3. Supabase was intercepting the Bearer token and rejecting it as invalid

## Root Cause
The intent-analysis function was missing API key validation logic that exists in other functions like cdp-proxy. The widget was also using the wrong header format.

## Fix Applied

### 1. Widget Side (eventTracking.ts)
Changed from:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`,  // WRONG - Supabase intercepts this
}
```

To:
```javascript
headers: {
  'Content-Type': 'application/json',
  'X-API-Key': apiKey,  // CORRECT - Custom header for widget API key
}
```

### 2. Function Side (intent-analysis/index.ts)
Added API key validation:
```typescript
// Validate API key
const apiKey = req.headers.get('X-API-Key');
if (!apiKey) {
  return new Response(
    JSON.stringify({ error: 'Missing API key' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
  );
}

// Check if API key is valid in database
const { data: validKey } = await supabase
  .from('api_keys')
  .select('id, rate_limit')
  .eq('key', apiKey)
  .eq('is_active', true)
  .single();

if (!validKey) {
  return new Response(
    JSON.stringify({ error: 'Invalid or inactive API key' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
  );
}
```

## Why X-API-Key Instead of Authorization Bearer?
- `Authorization: Bearer` headers are intercepted by Supabase for its own authentication
- Custom headers like `X-API-Key` pass through to the function without interference
- This matches the pattern used by cdp-proxy and other widget API functions

## Testing
Created test script at `/temp/test-intent-auth.js` that verifies:
1. ✅ Requests with X-API-Key header succeed
2. ✅ Requests with Bearer Authorization fail with 401
3. ✅ Requests without authentication fail with 401

## Deployment
- Function deployed to Supabase successfully
- Widget changes applied via HMR in development

## Impact
- Intent analysis now properly authenticates using widget API keys
- Consistent authentication pattern across all widget API endpoints
- Better security by validating all requests