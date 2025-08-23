# PRP: AI-Based Intent Detection with Google Gemini

**Created**: 2025-01-22
**Status**: Active
**Confidence Score**: 8/10

## Goal
Replace the current rule-based intent detection system with an AI-powered solution using Google Gemini that analyzes user browsing patterns every 3-5 interactions and provides transparent, customer-friendly intent insights.

## Why
The current intent detection is limited to 6 hardcoded patterns with simple string matching. An AI-based approach will:
- Provide unlimited intent patterns based on actual user behavior
- Deliver more accurate and nuanced understanding of customer needs
- Generate natural, conversational intent messages
- Adapt to any product catalog without hardcoding categories
- Learn from complex behavioral patterns across time

## Context

### Current Implementation Analysis
1. **Rule-based detection** in `/src/widget/services/eventTracking.ts:151-257`
   - Only 6 hardcoded intent types
   - Simple category/keyword matching
   - No temporal analysis
   - No personalization

2. **Event tracking** in `/src/widget/hooks/useBrowsingHistory.ts`
   - Collects page views, product views, searches, cart actions
   - Stores up to 50 events in sessionStorage
   - Runs detection every 10 seconds OR after each event

3. **Existing Gemini integration** in `/supabase/functions/_shared/ai-service.ts`
   - Already configured with Google Gemini API
   - Uses `gemini-2.5-pro` model
   - Has proper error handling and fallback

### Requirements Reference
- Analyze intent every 3-5 user interactions (clicks/actions)
- Send full customer profile and browsing context to Gemini
- Return transparent, customer-friendly messages
- Example: "Based on the products you've viewed, I see that you are interested in..."
- Include confidence scores and behavioral signals

### External Resources
- Google Gemini API Documentation: https://ai.google.dev/gemini-api/docs
- Gemini Prompting Guide: https://ai.google.dev/gemini-api/docs/prompting-strategies
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

## Implementation Blueprint

### Phase 1: Create Intent Analysis Edge Function

1. **Create new Supabase Edge Function** `/supabase/functions/intent-analysis/index.ts`
```typescript
// Pattern to follow: /supabase/functions/recommendations/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.15.0';

interface IntentAnalysisRequest {
  session_id: string;
  browsing_history: ContextEvent[];
  customer_profile?: CustomerProfile;
  interaction_count: number;
}

interface IntentAnalysisResponse {
  intent: {
    primary_interest: string;
    confidence: number;
    behavioral_signals: string[];
    customer_message: string;
    raw_analysis: string;
  };
  timestamp: string;
  session_id: string;
}
```

2. **Create AI Intent Service** `/supabase/functions/_shared/intent-service.ts`
```typescript
export class AIIntentService {
  private gemini: GoogleGenAI;
  
  async analyzeIntent(params: {
    browsingHistory: ContextEvent[];
    customerProfile?: CustomerProfile;
  }): Promise<IntentAnalysisResponse> {
    const prompt = this.buildIntentPrompt(params);
    // Call Gemini with specific intent analysis prompt
    const result = await this.gemini.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        }
      }
    });
    return this.parseIntentResponse(result.text);
  }
}
```

### Phase 2: Update Frontend Intent Detection

1. **Modify EventTrackingService** `/src/widget/services/eventTracking.ts`
```typescript
// Add new method for AI-based intent analysis
async analyzeIntentWithAI(
  apiKey: string,
  customerProfile?: CustomerProfile
): Promise<BrowsingIntent | null> {
  // Only analyze after 3-5 interactions
  const interactionCount = this.getInteractionCount();
  if (interactionCount < 3 || interactionCount % 3 !== 0) {
    return this.currentIntent; // Return cached intent
  }
  
  // Call new intent-analysis endpoint
  const response = await fetch(`${API_URL}/functions/v1/intent-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      session_id: this.sessionId,
      browsing_history: this.events,
      customer_profile: customerProfile,
      interaction_count: interactionCount,
    }),
  });
  
  const data = await response.json();
  return this.formatIntentForUI(data.intent);
}
```

2. **Update useBrowsingHistory hook** `/src/widget/hooks/useBrowsingHistory.ts`
```typescript
// Replace simple analyzeIntent with AI version
const detectIntent = useCallback(async () => {
  if (!trackingServiceRef.current) return;
  
  const intent = await trackingServiceRef.current.analyzeIntentWithAI(
    apiKey,
    customerProfile
  );
  setDetectedIntent(intent);
}, [apiKey, customerProfile]);
```

### Phase 3: Gemini Prompt Engineering

Create sophisticated intent analysis prompt in `/supabase/functions/_shared/intent-service.ts`:

```typescript
private buildIntentPrompt(params: {
  browsingHistory: ContextEvent[];
  customerProfile?: CustomerProfile;
}): string {
  return `You are an expert e-commerce behavior analyst. Analyze the following customer browsing session and provide insights about their shopping intent.

CUSTOMER PROFILE:
${this.formatCustomerProfile(params.customerProfile)}

BROWSING HISTORY (Most Recent First):
${this.formatBrowsingHistory(params.browsingHistory)}

ANALYSIS INSTRUCTIONS:
1. Identify the PRIMARY shopping intent based on the browsing pattern
2. Calculate confidence level (0.0-1.0) based on pattern clarity
3. List 3-5 specific behavioral signals that indicate this intent
4. Create a customer-friendly message that:
   - Starts with "Based on..." to be transparent about the analysis
   - Shows understanding of their specific interests
   - Is helpful without being pushy
   - Uses natural, conversational language
   - Is 1-2 sentences maximum

IMPORTANT GUIDELINES:
- Focus on ACTUAL products/categories viewed, not assumptions
- Consider the TIME between actions (rapid clicks vs. deliberate browsing)
- Look for patterns: repeated category visits, price comparisons, feature focus
- Identify shopping stage: exploring, comparing, or ready to purchase
- Be specific about products/brands when confidence is high
- Be general about categories when pattern is unclear

RESPONSE FORMAT (JSON):
{
  "primary_interest": "Clear, specific description of what they're looking for",
  "confidence": 0.0-1.0,
  "behavioral_signals": [
    "Specific signal 1",
    "Specific signal 2",
    "Specific signal 3"
  ],
  "customer_message": "Based on [specific observation], I see you're interested in [specific intent]. [Helpful follow-up]",
  "raw_analysis": "Detailed analysis for internal use"
}

Examples of good customer messages:
- "Based on your multiple views of iPhone 15 models, I see you're comparing Apple's latest phones. Would you like to see a side-by-side comparison?"
- "Based on your searches for 'gaming laptop' and views of high-performance models, I can help you find the perfect gaming machine within your budget."
- "Based on your browsing in the smartphone category, you seem to be exploring upgrade options. What features matter most to you?"`;
}
```

### Phase 4: Integration and UI Updates

1. **Update BrowsingHistory component** to show AI-generated insights
2. **Add loading states** while waiting for Gemini response
3. **Implement caching** to avoid redundant API calls
4. **Add fallback** to rule-based detection if AI fails

## Detailed Implementation Steps

### Step 1: Create Intent Analysis Edge Function
```bash
# Create new function directory
mkdir -p supabase/functions/intent-analysis

# Create index.ts following pattern from recommendations/index.ts
# Include rate limiting, API key validation, CORS handling
```

### Step 2: Implement Intent Service Class
- Extract intent analysis logic into reusable service
- Add comprehensive error handling
- Implement response caching (5-minute TTL)
- Add telemetry for monitoring

### Step 3: Frontend Integration
- Update EventTrackingService with AI analysis method
- Modify useBrowsingHistory hook to use new service
- Add API key and customer profile to analysis calls
- Implement interaction counting logic

### Step 4: Testing & Validation
- Test with various browsing patterns
- Verify customer message quality
- Check performance impact
- Validate fallback behavior

## Validation Gates

### 1. Syntax and Type Checking
```bash
# Frontend
npm run typecheck
npm run lint

# Edge Functions
cd supabase/functions
deno fmt --check
deno lint
```

### 2. Unit Tests
```bash
# Test intent service
deno test supabase/functions/_shared/intent-service.test.ts

# Test frontend integration
npm run test:unit -- eventTracking.test.ts
```

### 3. Integration Tests
```bash
# Test full flow
npm run test:e2e -- intent-detection.spec.ts

# Manual testing checklist:
# 1. Browse 3 products → Check intent message
# 2. Search for item → Verify intent updates
# 3. Add to cart → Confirm purchase intent detected
# 4. Clear history → Verify intent resets
```

### 4. Performance Benchmarks
- Intent analysis < 2 seconds (P95)
- No UI blocking during analysis
- Caching reduces API calls by >70%

## Error Handling

### API Failures
```typescript
try {
  const intent = await analyzeIntentWithAI();
} catch (error) {
  console.warn('AI intent analysis failed, using rule-based fallback');
  return this.analyzeIntent(); // Existing rule-based method
}
```

### Rate Limiting
- Implement exponential backoff
- Cache results for 5 minutes
- Limit to 100 requests/minute per domain

### Invalid Responses
- Validate JSON structure
- Sanitize customer messages
- Default to generic messages if parsing fails

## Security Considerations

1. **Data Privacy**
   - No PII in intent analysis logs
   - Customer profile data stays in session
   - Browsing history auto-expires after 24 hours

2. **API Security**
   - Validate API keys on every request
   - Rate limit by domain
   - Sanitize all user inputs

3. **Prompt Injection Prevention**
   - Escape special characters in browsing data
   - Validate response format
   - Limit prompt size to prevent abuse

## Success Criteria

1. ✅ Intent detection triggers every 3-5 interactions
2. ✅ Customer messages are natural and helpful
3. ✅ Confidence scores accurately reflect pattern clarity
4. ✅ Performance remains under 2 seconds
5. ✅ Fallback to rule-based detection works seamlessly
6. ✅ All existing functionality preserved
7. ✅ No increase in error rates

## Migration Strategy

1. **Phase 1**: Deploy Edge Function (no frontend changes)
2. **Phase 2**: Add feature flag for AI intent detection
3. **Phase 3**: A/B test with 10% of users
4. **Phase 4**: Monitor metrics and iterate
5. **Phase 5**: Full rollout with rule-based fallback

## Documentation Updates

Update the following files:
- `CLAUDE.md` - Add intent detection section
- `README.md` - Document new environment variables
- API documentation - Add intent-analysis endpoint

## Rollback Plan

If issues arise:
1. Feature flag to disable AI intent detection
2. Revert to rule-based `analyzeIntent()` method
3. Clear cached intents from sessionStorage
4. Monitor error rates for 24 hours

## Dependencies and External Resources

### NPM Packages (Already Installed)
- No new frontend dependencies required

### Deno Dependencies (Edge Functions)
```typescript
import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.15.0';
// Already used in ai-service.ts
```

### Environment Variables
```bash
# Add to .env.local and Supabase secrets
GOOGLE_GEMINI_API_KEY=your_api_key_here
INTENT_ANALYSIS_ENABLED=true
INTENT_CACHE_TTL=300  # 5 minutes in seconds
```

### API Documentation
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Gemini Content Generation](https://ai.google.dev/gemini-api/docs/text-generation)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Testing Scenarios

### Scenario 1: New Visitor Exploring
- Visit homepage → Browse smartphones → View 2 products
- Expected: "Based on your interest in smartphones, I can help you find the perfect device for your needs."

### Scenario 2: Comparison Shopping
- View iPhone 15 → View Samsung S24 → View iPhone 15 again
- Expected: "Based on your comparison of iPhone 15 and Samsung S24, you seem to be weighing iOS vs Android options."

### Scenario 3: Purchase Intent
- Search "laptop" → View product → Add to cart
- Expected: "Based on adding a laptop to your cart, you're close to making a decision. Need any final questions answered?"

### Scenario 4: Window Shopping
- Random browsing across categories → No clear pattern
- Expected: "Based on your browsing, you're exploring our catalog. What specific type of product can I help you find?"

## Monitoring and Analytics

Track the following metrics:
- Intent detection accuracy (user feedback)
- API response times
- Cache hit rate
- Fallback usage frequency
- Customer engagement with intent messages

## Quality Score: 8/10

**Confidence Level**: High confidence in implementation success

**Strengths**:
- Leverages existing Gemini integration
- Clear migration path with fallback
- Comprehensive error handling
- Well-defined validation criteria

**Risk Factors** (-2 points):
- Gemini API response time variability
- Prompt engineering may need iteration for optimal results
- Rate limits might require adjustment based on usage

## Implementation Checklist

- [ ] Create intent-analysis Edge Function
- [ ] Implement AIIntentService class
- [ ] Update EventTrackingService with AI method
- [ ] Modify useBrowsingHistory hook
- [ ] Add interaction counting logic
- [ ] Implement response caching
- [ ] Update BrowsingHistory UI component
- [ ] Add loading states and error handling
- [ ] Configure environment variables
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test with various browsing patterns
- [ ] Deploy with feature flag
- [ ] Monitor performance metrics
- [ ] Document API changes

---

*PRP Version: 1.0*
*Last Updated: 2025-01-22*