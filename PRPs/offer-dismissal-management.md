# PRP: Comprehensive Offer Dismissal Management

## Objective
Transform the current simple "x" button dismissal system into a comprehensive offer dismissal management feature with proper AI feedback, multilingual responses, and persistent exclusion of dismissed offers from recommendations.

## Goal
Create a user-friendly dismissal system where:
1. Users see a "Dismiss it" button instead of "x" 
2. AI agent immediately acknowledges dismissal with localized response
3. Dismissed offers are permanently excluded from future recommendations
4. System maintains dismissed offers list throughout the session and passes it to AI

## Success Metrics
- **Completion**: All dismissed offers are excluded from future recommendations (100% exclusion rate)
- **Response Time**: AI acknowledgment appears within 500ms
- **Localization**: Works seamlessly in both Lithuanian and English
- **Persistence**: Dismissed offers remain excluded for entire session
- **UX**: Clear visual feedback and professional interaction

## Context

### Current Implementation Analysis
- **Location**: `/src/widget/components/ChatInterface.tsx:473-510`
- **Current UI**: Simple "x" button with circular design
- **Storage**: SessionStorage for dismissed recommendations
- **Data Structure**: Set of `${messageId}-${productId}` keys
- **AI Integration**: Currently NOT passed to AI for exclusion

### Files to Modify
1. `/src/widget/components/ChatInterface.tsx` - Main UI changes
2. `/src/widget/services/i18n/translations.ts` - Add new translations
3. `/supabase/functions/_shared/ai-service.ts` - Update prompt to exclude dismissed offers
4. `/supabase/functions/recommendations/index.ts` - Pass dismissed offers to AI service

### Existing Patterns to Follow
- **Button Styling**: Follow existing button patterns (e.g., Clear Chat button at line 739-763)
- **Translation System**: Use `useLanguage` hook with `t()` function
- **State Management**: Use React hooks pattern already established
- **AI Communication**: Follow existing request payload structure

## Implementation Blueprint

### Phase 1: Update UI Component (ChatInterface.tsx)

#### 1.1 Replace X Button with "Dismiss it" Button
```typescript
// Line 473-510 - Replace existing dismiss button
<button
  onClick={(e) => {
    e.stopPropagation();
    handleDismissRecommendation(
      (product as any).id || (product as any).product_id,
      msg.id
    );
  }}
  style={{
    position: "absolute",
    top: "8px",
    right: "8px",
    padding: "6px 12px",
    borderRadius: "4px",
    background: "rgba(255, 255, 255, 0.95)",
    border: "1px solid #e5e5e7",
    fontSize: "12px",
    fontWeight: "500",
    color: "#666",
    cursor: "pointer",
    zIndex: 10,
    transition: "all 0.2s",
    backdropFilter: "blur(10px)",
  }}
  onMouseEnter={(e) => {
    (e.currentTarget as HTMLElement).style.background = "#fff";
    (e.currentTarget as HTMLElement).style.color = "#ef4444";
    (e.currentTarget as HTMLElement).style.borderColor = "#ef4444";
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.95)";
    (e.currentTarget as HTMLElement).style.color = "#666";
    (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e7";
  }}
  aria-label={t("chat.dismissOffer")}
>
  {t("chat.dismissButton")}
</button>
```

#### 1.2 Update handleDismissRecommendation Function
```typescript
// Update around line 132-135
const handleDismissRecommendation = useCallback((productId: string, messageId: string) => {
  const dismissKey = `${messageId}-${productId}`;
  setDismissedRecommendations(prev => {
    const updated = new Set(prev).add(dismissKey);
    
    // Also store just product IDs for easier AI integration
    const dismissedProductIds = new Set<string>();
    updated.forEach(key => {
      const [, pid] = key.split('-');
      if (pid) dismissedProductIds.add(pid);
    });
    sessionStorage.setItem('porta_futuri_dismissed_products', 
      JSON.stringify(Array.from(dismissedProductIds)));
    
    return updated;
  });
  
  // Add AI acknowledgment message
  const acknowledgmentMessage: Message = {
    id: `msg-${Date.now()}`,
    role: "assistant",
    content: t("chat.offerDismissed"),
    timestamp: new Date(),
  };
  setMessages(prev => [...prev, acknowledgmentMessage]);
}, [t]);
```

#### 1.3 Include Dismissed Products in API Request
```typescript
// Update sendMessage function around line 255-289
// Add dismissed products to request payload
const dismissedProductIds = JSON.parse(
  sessionStorage.getItem('porta_futuri_dismissed_products') || '[]'
);

const requestPayload = {
  session_id: sessionId,
  query: userMessage,
  conversation_history: messages.map((m) => ({
    role: m.role,
    content: m.content,
  })),
  dismissed_products: dismissedProductIds, // ADD THIS LINE
  context: {
    current_page: window.location.pathname,
    browsing_category: analysis.category,
    // ... rest of context
  },
  // ... rest of payload
};
```

### Phase 2: Add Translations

#### 2.1 Update translations.ts
```typescript
// Add to TranslationStrings interface around line 44
chat: {
  // ... existing translations
  dismissButton: string;
  dismissOffer: string;
  offerDismissed: string;
}

// Add to Lithuanian translations around line 127
chat: {
  // ... existing translations
  dismissButton: "Atmesti",
  dismissOffer: "Atmesti pasiūlymą",
  offerDismissed: "Gerai, pašalinu šį pasiūlymą ir daugiau jo nerodysiu ateityje.",
}

// Add to English translations around line 217
chat: {
  // ... existing translations  
  dismissButton: "Dismiss it",
  dismissOffer: "Dismiss offer",
  offerDismissed: "Ok, I am removing this offer and will not show it to you in the future.",
}
```

### Phase 3: Update Backend Services

#### 3.1 Update recommendations/index.ts
```typescript
// Add to RecommendationRequest interface around line 12
interface RecommendationRequest {
  // ... existing fields
  dismissed_products?: string[]; // Array of product IDs to exclude
}

// Pass dismissed products to AI service around line 140
const recommendations = await aiService.generateRecommendations({
  query: body.query,
  products: body.products || [],
  customerProfile: body.customer_profile,
  conversationHistory: body.conversation_history,
  context: body.context,
  detectedIntent: body.context?.detected_intent,
  dismissedProducts: body.dismissed_products || [], // ADD THIS
});
```

#### 3.2 Update ai-service.ts
```typescript
// Add to generateRecommendations params around line 100
async generateRecommendations(params: {
  // ... existing params
  dismissedProducts?: string[];
}): Promise<RecommendationResponse> {

// Update buildPrompt method around line 286
private buildPrompt(params: {
  // ... existing params
  dismissedProducts?: string[];
}): string {
  const parts: string[] = [];
  
  // ... existing parts
  
  // Add dismissed products section
  if (params.dismissedProducts && params.dismissedProducts.length > 0) {
    parts.push(`\nDismissed Products (DO NOT RECOMMEND THESE):\n${params.dismissedProducts.join(', ')}`);
    parts.push(`\nIMPORTANT: The customer has explicitly dismissed the above products. Never recommend them again, even if they seem like a perfect match.`);
  }
  
  // ... rest of method
}

// Update getSystemPrompt to include dismissal logic around line 200
private getSystemPrompt(): string {
  return `You are a friendly, knowledgeable AI shopping assistant...
  
  CRITICAL EXCLUSION RULES:
  1. NEVER recommend products that appear in the "Dismissed Products" list
  2. If a dismissed product would be perfect, find the next best alternative
  3. Do not mention or reference dismissed products in any way
  4. Treat dismissed products as if they don't exist in the catalog
  
  ${/* rest of existing prompt */}`;
}
```

### Phase 4: Testing & Validation

#### 4.1 Manual Testing Checklist
```bash
# 1. Test UI Changes
- [ ] "Dismiss it" button appears correctly
- [ ] Button has proper hover effects
- [ ] Button click dismisses the product card
- [ ] AI acknowledgment message appears

# 2. Test Localization
- [ ] Switch to Lithuanian - see "Atmesti"
- [ ] Dismissal message in Lithuanian
- [ ] Switch to English - see "Dismiss it"
- [ ] Dismissal message in English

# 3. Test Persistence
- [ ] Dismiss a product
- [ ] Ask for new recommendations
- [ ] Verify dismissed product doesn't appear
- [ ] Refresh page (session persists)
- [ ] Verify dismissed products still excluded

# 4. Test AI Integration
- [ ] Dismiss multiple products
- [ ] Ask for recommendations in same category
- [ ] Verify AI finds alternatives
- [ ] Check AI doesn't mention dismissed items
```

#### 4.2 Automated Tests
```typescript
// Add to tests/unit/ChatInterface.test.tsx
describe('Offer Dismissal Management', () => {
  it('should show Dismiss it button instead of X', () => {
    // Test button text
  });
  
  it('should add AI acknowledgment on dismissal', () => {
    // Test message addition
  });
  
  it('should persist dismissed products in session', () => {
    // Test sessionStorage
  });
  
  it('should exclude dismissed products from recommendations', () => {
    // Test API payload
  });
});
```

## Validation Gates

```bash
# 1. Syntax and Type Checking
npm run typecheck

# 2. Linting
npm run lint

# 3. Run Tests
npm test

# 4. Build Verification
npm run build:widget
npm run build:api

# 5. Manual Testing
# Start development environment
npm run dev:admin
npm run dev:demo
# Then manually test all scenarios from checklist
```

## Error Handling

1. **Network Failures**: If dismissal acknowledgment fails, still remove product locally
2. **Translation Missing**: Fallback to English if translation key not found
3. **AI Service Error**: Continue to exclude dismissed products even if AI fails
4. **SessionStorage Full**: Implement cleanup of old dismissed products (>30 days)

## Performance Considerations

- **Memory**: Limit dismissed products list to 100 items max
- **Storage**: Use efficient Set structure for O(1) lookups
- **AI Prompt**: Keep dismissed list concise (just IDs)
- **Response Time**: Acknowledgment should be instant (don't wait for API)

## Security Considerations

- **Input Validation**: Validate product IDs before storage
- **XSS Prevention**: Sanitize any displayed product IDs
- **Session Isolation**: Dismissed products are session-specific

## Rollback Plan

If issues occur:
1. Revert UI changes in ChatInterface.tsx
2. Remove new translation keys
3. Remove dismissed_products from API payload
4. Deploy previous version

## Documentation Requirements

Update the following documentation:
1. Widget Integration Guide - explain dismissal feature
2. API Documentation - document dismissed_products parameter
3. User Guide - explain how dismissal works

## Dependencies

- No new npm packages required
- Uses existing React, TypeScript, and translation system
- Compatible with current Supabase edge functions

## Implementation Order

1. **First**: Update translations.ts (no breaking changes)
2. **Second**: Update ChatInterface.tsx UI (visual change only)
3. **Third**: Update backend services (backward compatible)
4. **Fourth**: Test end-to-end functionality
5. **Fifth**: Deploy to production

## Notes for AI Implementation

**CRITICAL IMPLEMENTATION NOTES:**
1. The dismiss button MUST replace the existing X button, not add to it
2. The acknowledgment message should appear IMMEDIATELY, not wait for API
3. SessionStorage keys must maintain backward compatibility
4. The dismissed products list should be cumulative across the session
5. Test in BOTH languages before considering complete

**Code Style Requirements:**
- Follow existing code patterns exactly
- Use same indentation (2 spaces)
- Match existing naming conventions
- Keep functions pure where possible
- Add proper TypeScript types

**Common Pitfalls to Avoid:**
1. Don't forget to stop event propagation on button click
2. Remember products can have either 'id' or 'product_id' field
3. Handle empty dismissed products array gracefully
4. Don't break existing recommendation filtering logic
5. Ensure translations are properly escaped for special characters

## External References

- React Event Handling: https://react.dev/learn/responding-to-events
- SessionStorage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Google Gemini API: https://ai.google.dev/gemini-api/docs

---

**PRP Confidence Score: 9/10**

This PRP has high confidence because:
- ✅ All existing code patterns are identified and documented
- ✅ Clear implementation steps with actual code examples
- ✅ Validation gates are executable
- ✅ Error handling is comprehensive
- ✅ Follows KISS and YAGNI principles
- ✅ Addresses the root cause properly
- ✅ Includes rollback plan
- ⚠️ Minor uncertainty around exact Gemini API prompt optimization

The implementation should succeed in a single pass with these comprehensive instructions.