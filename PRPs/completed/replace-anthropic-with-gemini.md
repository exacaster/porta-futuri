# PRP: Replace Anthropic API with Google Gemini 2.5 Flash

**Generated**: 2025-08-22  
**Status**: Active  
**Confidence Score**: 9/10

## 1. Goal
Replace the Anthropic Claude API with Google Gemini 2.5 Flash model in the Porta Futuri AI recommendation system while maintaining identical functionality and prompt structures.

## 2. Why
- Explore alternative LLM providers for potentially better performance or pricing
- Reduce dependency on a single AI provider
- Leverage Google's Gemini 2.5 Flash model capabilities

## 3. Context

### Current Implementation
- **Current Model**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- **SDK**: `@anthropic-ai/sdk@0.27.0` via esm.sh
- **Location**: Supabase Edge Functions (Deno runtime)
- **Main Files**:
  - `/supabase/functions/_shared/ai-service.ts` - AI service wrapper
  - `/supabase/functions/recommendations/index.ts` - Recommendation endpoint
- **Environment Variable**: `ANTHROPIC_API_KEY`

### Target Implementation
- **Target Model**: Gemini 2.0 Flash (`gemini-2.0-flash-001`)
- **SDK**: `@google/genai` (latest v1.15.0)
- **Import Method**: esm.sh or npm: specifier for Deno
- **Environment Variable**: `GEMINI_API_KEY`

### Documentation References
- Google GenAI SDK: https://www.npmjs.com/package/@google/genai
- Gemini API Documentation: https://ai.google.dev/gemini-api/docs
- Migration Guide: https://ai.google.dev/gemini-api/docs/migrate
- Model Information: https://ai.google.dev/gemini-api/docs/models/gemini-v2

## 4. Implementation Blueprint

### Phase 1: Update Dependencies and Imports

#### 1.1 Update ai-service.ts imports
```typescript
// OLD:
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

// NEW:
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.15.0';
// Alternative if esm.sh has issues:
// import { GoogleGenAI } from 'npm:@google/genai@1.15.0';
```

#### 1.2 Update class structure
```typescript
// OLD:
export class AIRecommendationService {
  private anthropic: Anthropic;
  
  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

// NEW:
export class AIRecommendationService {
  private gemini: GoogleGenAI;
  
  constructor(apiKey: string) {
    this.gemini = new GoogleGenAI({ apiKey });
  }
```

### Phase 2: Update API Call Method

#### 2.1 Update generateRecommendations method
```typescript
// OLD Claude API call:
const completion = await this.anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 100000,
  temperature: 0.7,
  system: this.getSystemPrompt(),
  messages: [{ role: 'user', content: prompt }]
});

// NEW Gemini API call:
const model = this.gemini.getGenerativeModel({ 
  model: 'gemini-2.0-flash-001',
  generationConfig: {
    maxOutputTokens: 100000,
    temperature: 0.7,
  },
  systemInstruction: this.getSystemPrompt()
});

const result = await model.generateContent(prompt);
const response = await result.response;
```

#### 2.2 Update response parsing
```typescript
// OLD:
const responseText = completion.content[0].type === 'text' 
  ? completion.content[0].text 
  : '';

// NEW:
const responseText = response.text();
```

### Phase 3: Update Environment Variables

#### 3.1 Update recommendations/index.ts
```typescript
// OLD:
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
console.log('Anthropic API key exists:', !!anthropicApiKey);
// ...
const aiService = new AIRecommendationService(anthropicApiKey);

// NEW:
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
console.log('Gemini API key exists:', !!geminiApiKey);
// ...
const aiService = new AIRecommendationService(geminiApiKey);
```

#### 3.2 Update .env file
```bash
# OLD:
ANTHROPIC_API_KEY=sk-ant-api03-...

# NEW (add, don't remove old one yet):
GEMINI_API_KEY=your-gemini-api-key-here
```

### Phase 4: Test and Deploy

#### 4.1 Update Supabase Edge Function secrets
```bash
# Add Gemini API key to Supabase
supabase secrets set GEMINI_API_KEY=your-gemini-api-key-here
```

#### 4.2 Deploy updated function
```bash
supabase functions deploy recommendations --no-verify-jwt
```

## 5. File-by-File Changes

### File 1: `/supabase/functions/_shared/ai-service.ts`

**Changes Required**:
1. Line 1: Replace Anthropic import with GoogleGenAI import
2. Line 71: Replace `private anthropic: Anthropic;` with `private gemini: GoogleGenAI;`
3. Line 75: Update constructor to initialize GoogleGenAI
4. Lines 105-111: Replace Anthropic API call with Gemini API call
5. Lines 116-118: Update response text extraction

### File 2: `/supabase/functions/recommendations/index.ts`

**Changes Required**:
1. Line 317: Change `ANTHROPIC_API_KEY` to `GEMINI_API_KEY`
2. Lines 319-321: Update logging messages from "Anthropic" to "Gemini"
3. Line 325: Update condition variable name
4. Line 328-329: Update logging messages

### File 3: `/.env`

**Changes Required**:
1. Add new line: `GEMINI_API_KEY=your-api-key-here`
2. Keep ANTHROPIC_API_KEY for rollback capability

## 6. Implementation Steps

1. **Obtain Gemini API Key**
   - Visit: https://aistudio.google.com/app/apikey
   - Create new API key
   - Store securely

2. **Update Local Environment**
   - Add GEMINI_API_KEY to .env file
   - Test locally with `supabase functions serve`

3. **Modify AI Service**
   - Update imports in ai-service.ts
   - Replace Anthropic class with GoogleGenAI
   - Update API call structure
   - Maintain same prompt format

4. **Update Recommendation Endpoint**
   - Change environment variable references
   - Update logging messages

5. **Deploy to Production**
   - Set Gemini API key in Supabase secrets
   - Deploy updated functions
   - Monitor logs for errors

## 7. Validation Gates

```bash
# 1. Check TypeScript compilation
cd /Users/egidijus/Documents/Porta\ futuri
npx tsc --noEmit supabase/functions/_shared/ai-service.ts

# 2. Test locally with Supabase CLI
supabase functions serve recommendations --env-file .env

# 3. Test API call locally
curl -X POST http://localhost:54321/functions/v1/recommendations \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test","query":"Show me some products"}'

# 4. Deploy to production
supabase functions deploy recommendations --no-verify-jwt

# 5. Test production endpoint
curl -X POST https://rvlbbgdkgneobvlyawix.supabase.co/functions/v1/recommendations \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test","query":"Show me some products"}'

# 6. Check logs for errors
supabase functions logs recommendations --tail
```

## 8. Rollback Plan

If issues occur:
1. Revert code changes in git
2. Keep ANTHROPIC_API_KEY in environment
3. Redeploy original function: `supabase functions deploy recommendations`
4. Verify rollback successful

## 9. Known Considerations

### Import Stability
- esm.sh hash can change over time causing issues
- Alternative: Use `npm:` specifier if esm.sh is unstable
- Fallback: Pin specific version with integrity hash

### API Response Format
- Gemini returns response differently than Claude
- Response parsing logic is simplified for Gemini
- JSON extraction pattern remains the same

### Rate Limits
- Gemini has different rate limits than Anthropic
- Default: 15 RPM for free tier
- Paid tier: 1000+ RPM available

### Model Capabilities
- Gemini 2.0 Flash has similar capabilities to Claude 3.5 Sonnet
- Both support large context windows (100k+ tokens)
- Response quality should be comparable

## 10. Testing Checklist

- [ ] Local development environment works
- [ ] API key is properly configured
- [ ] Function compiles without errors
- [ ] Local function serves successfully
- [ ] Test API call returns valid recommendations
- [ ] Response format matches expected structure
- [ ] Production deployment successful
- [ ] Production endpoint responds correctly
- [ ] Logs show no errors
- [ ] Widget integration works properly

## 11. Success Criteria

- Gemini API successfully replaces Anthropic
- No changes to prompt structure required
- Response format remains compatible
- Performance is comparable or better
- No breaking changes to widget interface

## 12. Error Patterns and Fixes

### Common Errors:

1. **Import Error**: "Module not found"
   - Fix: Try alternative import method (npm: vs esm.sh)

2. **API Key Error**: "Invalid API key"
   - Fix: Verify key in Google AI Studio
   - Fix: Check environment variable name

3. **Model Error**: "Model not found"
   - Fix: Use correct model name: `gemini-2.0-flash-001`

4. **Response Parsing Error**: "Cannot read property 'text'"
   - Fix: Check response structure with console.log
   - Fix: Update parsing logic if needed

5. **Rate Limit Error**: "Quota exceeded"
   - Fix: Implement retry logic with exponential backoff
   - Fix: Upgrade to paid tier if needed

## Implementation Order

1. First update `/supabase/functions/_shared/ai-service.ts`
2. Then update `/supabase/functions/recommendations/index.ts`
3. Add GEMINI_API_KEY to local .env
4. Test locally
5. Deploy to Supabase
6. Set production secrets
7. Test production

---

**Confidence Score: 9/10**

The implementation is straightforward as it's a clean API replacement. The only potential complexity is ensuring Deno/esm.sh compatibility, but multiple import options are available as fallbacks.