# PRP: Add Detected Intent to Gemini Recommendation Prompt

**Created**: 2025-08-23
**Status**: Ready for Implementation
**Confidence Score**: 9/10

## Goal
Enhance the AI recommendation service to include detected shopping intent data in the Gemini prompt, enabling more contextually aware and personalized product recommendations based on real-time behavioral analysis.

## Why
- **Better Personalization**: AI can tailor recommendations based on detected shopping intent (e.g., "Category Exploration" with 70% confidence)
- **Improved Relevance**: Understanding user's current browsing behavior helps filter and prioritize products
- **Proactive Engagement**: AI can acknowledge the detected intent and provide more targeted assistance
- **Higher Conversion**: Intent-aware recommendations are more likely to match user needs

## Context & Requirements

### Current State
1. **Intent Detection**: Already implemented via `/supabase/functions/intent-analysis/` endpoint
2. **Intent Data Structure**: Defined in `BrowsingIntent` interface with:
   - `intent`: Primary interest (e.g., "Category Exploration")
   - `confidence`: 0-1 confidence score
   - `signals`: Behavioral signals array
   - `suggestedMessage`: AI-generated engagement message
3. **Data Flow**: Intent is passed from widget → ChatInterface → recommendations API call in `context.detected_intent`
4. **Gemini Service**: Located at `/supabase/functions/_shared/ai-service.ts`

### Research Findings

#### Intent Data Structure (from intent-service.ts)
```typescript
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

#### Current API Request Payload (ChatInterface.tsx lines 271-276)
```typescript
detected_intent: detectedIntent ? {
  primary_interest: detectedIntent.intent,
  confidence: detectedIntent.confidence,
  behavioral_signals: detectedIntent.signals,
  suggested_context: detectedIntent.suggestedMessage
} : null
```

#### Gemini Prompt Construction (ai-service.ts lines 256-310)
Currently builds prompt with:
1. Customer Query
2. Customer Profile
3. Conversation History
4. Complete Product Catalog
5. Additional Context
6. Response Format Instructions

**Missing**: Intent data is passed in context but NOT included in the actual prompt sent to Gemini.

## Implementation Blueprint

### Phase 1: Update AI Service Interface

#### 1.1 Add Intent Type Definition
**File**: `/supabase/functions/_shared/ai-service.ts`
**Location**: After line 54 (CustomerProfile interface)

```typescript
interface DetectedIntent {
  primary_interest: string;
  confidence: number;
  behavioral_signals: string[];
  suggested_context?: string;
}
```

#### 1.2 Update generateRecommendations Parameters
**File**: `/supabase/functions/_shared/ai-service.ts`
**Location**: Line 93-99 (generateRecommendations params)

```typescript
async generateRecommendations(params: {
  query: string;
  products: Product[];
  customerProfile?: CustomerProfile;
  conversationHistory?: Message[];
  context?: any;
  detectedIntent?: DetectedIntent;  // ADD THIS LINE
}): Promise<RecommendationResponse>
```

### Phase 2: Include Intent in Prompt Building

#### 2.1 Update buildPrompt Method
**File**: `/supabase/functions/_shared/ai-service.ts`
**Location**: Line 256-310 (buildPrompt method)

Add after customer profile section (after line 272):

```typescript
// Add detected intent if available
if (params.detectedIntent) {
  const intentInfo = this.formatDetectedIntent(params.detectedIntent);
  parts.push(`\nDetected Shopping Intent:\n${intentInfo}`);
}
```

#### 2.2 Create Intent Formatting Method
**File**: `/supabase/functions/_shared/ai-service.ts`
**Location**: After formatCustomerProfile method (after line 373)

```typescript
private formatDetectedIntent(intent: DetectedIntent): string {
  const lines: string[] = [];
  
  lines.push(`- Primary Interest: ${intent.primary_interest}`);
  lines.push(`- Confidence Level: ${(intent.confidence * 100).toFixed(0)}%`);
  
  if (intent.behavioral_signals && intent.behavioral_signals.length > 0) {
    lines.push(`- Behavioral Signals:`);
    intent.behavioral_signals.forEach(signal => {
      lines.push(`  • ${signal}`);
    });
  }
  
  if (intent.suggested_context) {
    lines.push(`- AI Suggested Context: "${intent.suggested_context}"`);
  }
  
  return lines.join('\n');
}
```

### Phase 3: Update System Prompt

#### 3.1 Add Intent-Aware Instructions
**File**: `/supabase/functions/_shared/ai-service.ts`
**Location**: Line 195 (after ASK CLARIFYING QUESTIONS section)

Add new section:

```typescript
6. **INTENT-AWARE RECOMMENDATIONS**: When detected intent is provided:
   - Acknowledge the detected shopping behavior naturally
   - Prioritize products that match the detected intent
   - Use confidence level to determine how specific to be:
     * High confidence (>70%): Be specific about their interest
     * Medium confidence (40-70%): Acknowledge general category interest
     * Low confidence (<40%): Keep recommendations broad
   - Reference behavioral signals to show understanding
   - Examples:
     * "I see you've been exploring smartphones extensively..."
     * "Based on your focused browsing in the TV category..."
     * "You seem to be comparing different laptop options..."
```

### Phase 4: Update Recommendations Endpoint

#### 4.1 Extract Intent from Request
**File**: `/supabase/functions/recommendations/index.ts`
**Location**: Line 331-337 (generateRecommendations call)

```typescript
const result = await aiService.generateRecommendations({
  query: request.query || '',
  products: products,
  customerProfile: request.customer_profile,
  conversationHistory: request.conversation_history,
  context: request.context,
  detectedIntent: request.context?.detected_intent  // ADD THIS LINE
});
```

### Phase 5: Enhance Prompt Examples

#### 5.1 Update Response Examples
**File**: `/supabase/functions/_shared/ai-service.ts`
**Location**: Line 217-226 (RESPONSE EXAMPLES section)

Add intent-aware examples:

```typescript
INTENT-AWARE RESPONSE EXAMPLES:
User: "Show me TVs" (Detected Intent: "Category Exploration - TVs" 85% confidence)
You: "I see you've been thoroughly exploring our TV selection! Based on your viewing pattern, you seem particularly interested in larger screens. Let me show you our top-rated 55-65 inch models..."

User: "Something for gaming" (Detected Intent: "Gaming Equipment Research" 72% confidence)
You: "Perfect timing! I noticed you've been checking out gaming gear across multiple categories. Whether you need a new console, gaming laptop, or accessories, I've got some excellent recommendations based on what you've been viewing..."

User: "What do you recommend?" (Detected Intent: "Smartphone Comparison" 68% confidence)
You: "Based on your recent browsing of several smartphone models, particularly the premium ones, here are my top picks that match your interests..."
```

## Validation Gates

### Unit Tests
```bash
# Test AI service with intent data
cd /Users/egidijus/Documents/Porta futuri
npm run test:unit -- ai-service.test.ts
```

### Integration Tests
```bash
# Test full recommendation flow with intent
npm run test:integration -- recommendations.test.ts
```

### Manual Testing Checklist
1. [ ] Widget detects and displays intent correctly
2. [ ] Intent data is included in API request payload
3. [ ] Gemini prompt includes formatted intent section
4. [ ] AI acknowledges detected intent in response
5. [ ] Recommendations align with detected intent
6. [ ] Different confidence levels produce appropriate responses
7. [ ] System works without intent data (backward compatibility)

### Performance Validation
```bash
# Check prompt size doesn't exceed limits
npm run test:performance -- prompt-size.test.ts

# Verify response time < 3s (P95)
npm run test:performance -- response-time.test.ts
```

## Error Handling Strategy

1. **Missing Intent Data**: Continue without intent (backward compatible)
2. **Invalid Intent Format**: Log warning, proceed without intent
3. **Confidence Out of Range**: Clamp to [0, 1] range
4. **Empty Behavioral Signals**: Use intent without signals
5. **Prompt Size Overflow**: Truncate product catalog before removing intent

## Implementation Order

1. **Update Type Definitions** (5 min)
   - Add DetectedIntent interface
   - Update method signatures

2. **Implement Intent Formatting** (10 min)
   - Create formatDetectedIntent method
   - Add to buildPrompt flow

3. **Update System Prompt** (10 min)
   - Add intent-aware instructions
   - Add response examples

4. **Update Recommendations Endpoint** (5 min)
   - Pass intent from context to AI service

5. **Test Implementation** (20 min)
   - Manual testing with widget
   - Verify prompt includes intent
   - Check AI responses acknowledge intent

6. **Write Unit Tests** (15 min)
   - Test intent formatting
   - Test prompt building with/without intent
   - Test edge cases

## Success Criteria

- [ ] Intent data appears in Gemini prompt logs
- [ ] AI responses acknowledge detected shopping intent
- [ ] Recommendations correlate with detected intent (manual review)
- [ ] No regression in existing functionality
- [ ] Response time remains < 3s (P95)
- [ ] All tests pass

## Code References

### Key Files to Modify
1. `/supabase/functions/_shared/ai-service.ts:93-99` - Add intent parameter
2. `/supabase/functions/_shared/ai-service.ts:256-310` - Include intent in prompt
3. `/supabase/functions/_shared/ai-service.ts:155-253` - Update system prompt
4. `/supabase/functions/recommendations/index.ts:331-337` - Pass intent to service

### Related Documentation
- Intent Detection Service: `/supabase/functions/_shared/intent-service.ts`
- Widget Intent Tracking: `/src/widget/services/eventTracking.ts`
- Intent Display Component: `/src/widget/components/BrowsingHistory.tsx`

## Potential Enhancements (Future)

1. **Intent History**: Track intent evolution over session
2. **Multi-Intent Support**: Handle multiple concurrent intents
3. **Intent Transitions**: Detect when user switches shopping focus
4. **Predictive Intent**: Anticipate next likely intent
5. **A/B Testing**: Compare intent-aware vs standard recommendations

## Risk Mitigation

- **Risk**: Prompt size exceeds token limits
  - **Mitigation**: Monitor prompt size, truncate products if needed
  
- **Risk**: Intent data causes parsing errors
  - **Mitigation**: Validate intent structure, use try-catch blocks
  
- **Risk**: Performance degradation
  - **Mitigation**: Cache intent formatting, optimize string operations

## Notes

- Intent detection runs every 3 interactions or 30 seconds
- Intent confidence naturally decreases over time without reinforcement
- Behavioral signals are most recent 20 events
- Intent analysis is cached for 5 minutes to reduce API calls
