# PRP: AI Recommendation System Improvements

**Date**: 2025-08-22
**Type**: Feature Enhancement
**Priority**: High
**Confidence Score**: 8/10

## Goal
Implement three critical improvements to the AI recommendation system:
1. Prevent recommendations from being shown when the AI is asking clarifying questions
2. Cross-validate all recommendations against the actual product catalog to ensure accuracy
3. Make product links in recommendation cards clickable with proper demo site navigation

## Why
- **Customer Experience**: Users should not see irrelevant recommendations when the AI needs more information
- **Data Integrity**: Recommendations must match actual products in the catalog with correct pricing and details
- **Usability**: Users must be able to click on recommended products to view them on the demo site

## Context
### Current Implementation
- **AI Service**: `/supabase/functions/_shared/ai-service.ts` - Uses Gemini 2.0 Flash for recommendations
- **System Prompt**: Lines 155-219 define personality and behavior
- **Response Parsing**: Lines 409-450 parse AI responses and map to products
- **Widget Rendering**: `/src/widget/components/ChatInterface.tsx` - Lines 314-457 render product cards
- **Demo Site Routes**: `/product/:id` route defined in `/src/demo-site/App.tsx`

### Existing Patterns
- Product catalog is already sent to Gemini (lines 349-406 in ai-service.ts)
- Products are mapped by product_id (line 423 in ai-service.ts)
- Demo site uses React Router with `/product/:id` pattern
- Widget is isolated in iframe, needs postMessage for navigation

## Implementation Blueprint

### Task 1: Improve Master Prompt to Prevent Recommendations During Clarifications

**Location**: `/supabase/functions/_shared/ai-service.ts`

**Current Issue**: The prompt doesn't explicitly instruct Gemini to withhold recommendations when asking questions.

**Implementation**:
```typescript
// Modify getSystemPrompt() method starting at line 155
// Add new section after line 179:

CLARIFICATION RULES:
4. **NO RECOMMENDATIONS DURING CLARIFICATIONS**: Critical rule enforcement:
   - When asking clarifying questions → DO NOT include recommendations
   - Return ONLY your question in the message field
   - Set recommendations array to empty []
   - Examples of clarifying scenarios:
     * "What aspects are most important to you?"
     * "What's your budget range?"
     * "Will you use this for work or entertainment?"
   - Only provide recommendations AFTER receiving answers to your questions

// Modify response format instruction at line 217:
RESPONSE FORMAT RULES:
- When asking clarifying questions: Return empty recommendations array []
- When making recommendations: Include 3-5 products based on relevance
- Always return valid JSON structure:
  {
    "message": "Your response",
    "intent": { "understood": "what you understood", "confidence": 0.0-1.0 },
    "recommendations": [], // Empty when asking questions, populated when recommending
    "is_clarifying": true/false // New field to indicate if asking for clarification
  }
```

### Task 2: Cross-Check Recommendations with Product Catalog

**Location**: `/supabase/functions/_shared/ai-service.ts`

**Current Issue**: AI might hallucinate product details or return incorrect information.

**Implementation**:
```typescript
// Add new validation method after line 505:
private validateRecommendations(
  recommendations: any[],
  actualProducts: Product[]
): any[] {
  const validatedRecs: any[] = [];
  
  for (const rec of recommendations) {
    // Find the actual product in catalog
    const actualProduct = actualProducts.find(
      p => p.product_id === rec.product_id
    );
    
    if (!actualProduct) {
      console.warn(`Product ${rec.product_id} not found in catalog, skipping`);
      continue;
    }
    
    // Use actual product data, preserve AI's reasoning and score
    validatedRecs.push({
      ...actualProduct, // Use all real product data
      reasoning: rec.reasoning || 'Recommended based on your preferences',
      match_score: rec.match_score || 75,
      position: validatedRecs.length + 1,
      // Ensure arrays are properly formatted
      features: Array.isArray(actualProduct.features) 
        ? actualProduct.features 
        : actualProduct.features 
          ? [actualProduct.features] 
          : undefined
    });
  }
  
  // If no valid products found, log error
  if (validatedRecs.length === 0 && recommendations.length > 0) {
    console.error('All recommended products were invalid:', 
      recommendations.map(r => r.product_id)
    );
  }
  
  return validatedRecs;
}

// Modify parseResponse method at line 409:
// After line 433, before filtering:
.map((rec: any, index: number) => {
  const product = allProducts.find(p => p.product_id === rec.product_id);
  if (!product) {
    console.warn(`Invalid product_id from AI: ${rec.product_id}`);
    return null;
  }
  
  // Return actual product data with AI metadata
  return {
    ...product, // Use actual product data
    // Preserve only AI-specific fields
    reasoning: rec.reasoning || `Recommended based on your query`,
    match_score: rec.match_score || (90 - index * 10),
    position: index + 1,
    features: Array.isArray(product.features) 
      ? product.features 
      : product.features ? [product.features] : undefined
  };
})

// Add validation before returning at line 436:
const validatedRecommendations = this.validateRecommendations(
  recommendations,
  allProducts
);

return {
  recommendations: validatedRecommendations,
  message: parsed.message || 'Here are my recommendations for you:',
  intent: parsed.intent || {
    understood: 'General product search',
    confidence: 0.7
  },
  is_clarifying: parsed.is_clarifying || false,
  fallback_used: false
};
```

### Task 3: Make Product Links Clickable with Demo Site Navigation

**Location**: `/src/widget/components/ChatInterface.tsx`

**Current Issue**: Product cards have empty onClick handler (line 336-338).

**Implementation**:
```typescript
// Add new handler function after line 80:
const handleProductClick = useCallback((productId: string) => {
  // Check if we're in iframe
  if (window.parent !== window) {
    // Send message to parent window
    window.parent.postMessage({
      type: 'porta-futuri-navigation',
      action: 'navigate-to-product',
      productId: productId,
      url: `/product/${productId}`
    }, '*');
  } else {
    // If not in iframe, try to open in new tab
    // Use relative URL if on same domain, otherwise use demo site URL
    const demoSiteUrl = 'http://localhost:3002'; // This should come from config
    window.open(`${demoSiteUrl}/product/${productId}`, '_blank');
  }
  
  // Track the click event
  if (window.PortaFuturi?.trackEvent) {
    window.PortaFuturi.trackEvent('product_click', {
      product_id: productId,
      source: 'recommendation_card'
    });
  }
}, []);

// Update onClick handler at line 336:
onClick={() => handleProductClick(product.product_id || product.id)}

// Add hover effects and cursor styling at line 331:
style={{
  border: "1px solid hsl(var(--pf-border))",
  borderRadius: "calc(var(--pf-radius) - 2px)",
  background: "hsl(var(--pf-card))",
  cursor: "pointer",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.2s ease",
  transform: "translateY(0)",
}}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = "translateY(-2px)";
  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = "translateY(0)";
  e.currentTarget.style.boxShadow = "none";
}}

// Add visual feedback for clickable state
// After line 418 (product name), add link icon:
<div style={{ 
  display: "flex", 
  alignItems: "center", 
  gap: "4px" 
}}>
  {product.name}
  <svg 
    width="12" 
    height="12" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    style={{ opacity: 0.5 }}
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
</div>
```

**Parent Window Handler** (for demo site integration):
Create new file: `/src/demo-site/utils/widgetIntegration.ts`
```typescript
// Listen for widget navigation messages
export function initWidgetNavigationHandler() {
  window.addEventListener('message', (event) => {
    // Validate origin if needed
    // if (event.origin !== expectedWidgetOrigin) return;
    
    if (event.data?.type === 'porta-futuri-navigation') {
      if (event.data.action === 'navigate-to-product') {
        // Use React Router navigation
        window.location.href = `/product/${event.data.productId}`;
      }
    }
  });
}

// Call this in demo site's App.tsx useEffect
```

### Task 4: Update Widget Configuration

**Location**: `/src/widget/types/widget.types.ts` and `/src/widget/App.tsx`

**Add configuration for demo site URL**:
```typescript
// In widget.types.ts, add to WidgetConfig interface:
interface WidgetConfig {
  // ... existing fields
  navigation?: {
    productUrlPattern?: string; // e.g., "/product/{id}"
    baseUrl?: string; // e.g., "https://shop.example.com"
    openInNewTab?: boolean; // default: true
  };
}

// In App.tsx, use the configuration:
const productUrl = config.navigation?.productUrlPattern?.replace(
  '{id}', 
  productId
) || `/product/${productId}`;
```

## Validation Gates

### 1. Test Clarification Behavior
```bash
# Test that clarifying questions don't show recommendations
curl -X POST http://localhost:54321/functions/v1/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "query": "Can you recommend a device?",
    "products": [...],
    "conversation_history": []
  }'
# Expected: Response should have empty recommendations array when asking for clarification
```

### 2. Test Product Validation
```bash
# Test with invalid product IDs
# Modify AI service temporarily to return fake product_id
# Verify that invalid products are filtered out
npm run test:integration -- --grep "product validation"
```

### 3. Test Click Navigation
```bash
# Start demo site
npm run dev:demo

# Start widget in test mode
npm run dev:widget

# Manual test:
# 1. Load widget on demo site
# 2. Get recommendations
# 3. Click on product card
# 4. Verify navigation to /product/:id
```

### 4. Run Type Checking
```bash
npm run typecheck
```

### 5. Run Linting
```bash
npm run lint
```

## Error Handling

### Scenario 1: AI returns invalid product IDs
- **Action**: Filter out invalid products, log warning
- **Fallback**: Show only valid products from the response

### Scenario 2: No valid products in AI response
- **Action**: Log error with invalid IDs
- **Fallback**: Return popular products with appropriate message

### Scenario 3: Navigation fails (blocked popup/iframe restrictions)
- **Action**: Show toast with "Please allow popups" message
- **Fallback**: Display product ID for manual search

### Scenario 4: Clarification detection fails
- **Action**: Check for question marks and clarifying keywords
- **Fallback**: Allow user to manually indicate they want recommendations

## Performance Considerations

1. **Validation overhead**: Product validation is O(n*m) where n=recommendations, m=products
   - Optimization: Create Map for O(1) lookups if catalog >1000 products

2. **Message passing**: PostMessage is async and fast
   - No performance concerns for navigation

3. **Response parsing**: Added validation step is minimal overhead
   - Typical: <5ms for 5 recommendations

## Security Considerations

1. **Origin validation**: Add origin checking for postMessage
2. **XSS prevention**: Sanitize all product data before rendering
3. **URL validation**: Validate product IDs are alphanumeric before navigation

## Testing Checklist

- [ ] Clarifying questions return empty recommendations
- [ ] Product details match catalog exactly (price, name, description)
- [ ] Click on product navigates to correct URL
- [ ] Navigation works in iframe and standalone
- [ ] Invalid products are filtered from recommendations
- [ ] Error messages are user-friendly
- [ ] Performance targets met (<3s response time)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)

## Dependencies

- No new npm packages required
- Uses existing React Router for demo site
- Uses native postMessage API for cross-window communication
- Gemini API (existing integration)

## Migration Notes

- No database changes required
- Backward compatible with existing API
- Widget update can be deployed independently
- Demo site handler is optional (graceful degradation)

## Documentation Updates Required

1. Update API documentation with `is_clarifying` field
2. Add widget integration guide for navigation handling
3. Document product validation behavior
4. Update troubleshooting guide with new error scenarios

## Rollback Plan

1. Remove clarification rules from prompt → Previous behavior restored
2. Remove validation step → Previous (unvalidated) behavior restored  
3. Remove onClick handler → Cards become non-clickable again

Each change is independent and can be rolled back separately.

## Success Metrics

- **Clarification Success**: 0% recommendations shown during clarifications
- **Validation Success**: 100% of shown products exist in catalog
- **Navigation Success**: >95% successful navigations from clicks
- **User Satisfaction**: Reduction in "wrong product" complaints

## Implementation Order

1. **First**: Implement clarification prevention (Task 1) - Immediate UX improvement
2. **Second**: Add product validation (Task 2) - Data integrity
3. **Third**: Implement clickable navigation (Task 3) - Enhanced usability
4. **Fourth**: Add configuration options (Task 4) - Flexibility

Each task can be implemented and deployed independently.