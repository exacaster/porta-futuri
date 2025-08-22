# Supabase Functions Deployment Summary

## Date: 2025-08-22
## Status: ✅ DEPLOYED

## Functions Deployed

### 1. recommendations (v25)
- **Status**: ACTIVE
- **Updated**: 2025-08-22 11:09:36 UTC
- **Size**: 121.1kB
- **Changes Included**:
  - Prevent recommendations during clarifying questions
  - Cross-validate recommendations with product catalog
  - Clean markdown formatting from AI responses
  - Preserve UUID `id` field for navigation
  - Support `is_clarifying` flag in responses
  - Using Gemini 2.5 Flash model

### 2. cdp-proxy (v8)
- **Status**: ACTIVE
- **Updated**: 2025-08-22 11:09:49 UTC
- **Size**: 76.47kB
- **Purpose**: Proxy for CDP integration

## Deployment Commands Used
```bash
npx supabase functions deploy recommendations --no-verify-jwt
npx supabase functions deploy cdp-proxy --no-verify-jwt
```

## Dashboard Links
- Functions Dashboard: https://supabase.com/dashboard/project/rvlbbgdkgneobvlyawix/functions
- Recommendations Function: https://supabase.com/dashboard/project/rvlbbgdkgneobvlyawix/functions/recommendations
- CDP Proxy Function: https://supabase.com/dashboard/project/rvlbbgdkgneobvlyawix/functions/cdp-proxy

## API Endpoints
- Recommendations: `https://rvlbbgdkgneobvlyawix.supabase.co/functions/v1/recommendations`
- CDP Proxy: `https://rvlbbgdkgneobvlyawix.supabase.co/functions/v1/cdp-proxy`

## Important Notes
1. Functions require API key authentication (`x-api-key` header)
2. Both functions deployed with `--no-verify-jwt` flag
3. All recent improvements are now live in production
4. Gemini 2.5 Flash is being used for AI recommendations

## Version History
- recommendations: v24 → v25 (latest deployment includes all AI improvements)
- cdp-proxy: v7 → v8 (latest deployment)

## Next Steps
- Monitor function performance in dashboard
- Check logs for any errors
- Test with production widget