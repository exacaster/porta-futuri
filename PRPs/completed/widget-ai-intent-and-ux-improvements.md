# PRP: Widget AI Intent Context and UX Improvements

**Created**: 2025-01-22
**Status**: Active
**Confidence Score**: 9/10

## Goal
Implement three critical improvements to the widget:
1. Pass AI-detected customer intent to recommendations for better context-aware suggestions
2. Add capability for users to dismiss individual product recommendations
3. Add clear chat history functionality with updated greeting message

## Why
These improvements enhance the user experience by:
- Making AI recommendations more contextually relevant by understanding user intent
- Giving users control over which recommendations they see
- Allowing users to start fresh conversations
- Providing clearer call-to-action messaging in Lithuanian

## Context

### Current Implementation Analysis

#### 1. Intent Detection System
- **Location**: `/src/widget/services/eventTracking.ts` (lines 271-342)
- **Hook**: `/src/widget/hooks/useBrowsingHistory.ts` 
- **Component**: `/src/widget/components/BrowsingHistory.tsx`
- **Current State**: Intent is detected and displayed in the UI but NOT passed to recommendations API

```typescript
// Current detectedIntent structure (from eventTracking.ts)
interface BrowsingIntent {
  intent: string;
  confidence: number;
  signals: string[];
  suggestedMessage?: string;
}
```

#### 2. Chat Interface
- **Location**: `/src/widget/components/ChatInterface.tsx`
- **Current Message Storage**: Lines 50-66 use sessionStorage for persistence
- **API Call**: Lines 217-244 build request payload
- **No Current Clear Function**: Messages persist but no explicit clear button

#### 3. Recommendations Display
- **Location**: `/src/widget/components/ChatInterface.tsx` (lines 385-500+)
- **Current**: No dismiss capability, recommendations are static once rendered

### Code Patterns to Follow

#### Session Storage Pattern (from ChatInterface.tsx:50-66)
```typescript
const [messages, setMessages] = useState<Message[]>(() => {
  const savedMessages = sessionStorage.getItem('porta_futuri_chat_messages');
  if (savedMessages) {
    try {
      const parsed = JSON.parse(savedMessages);
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  }
  return [];
});
```

#### Translation Pattern (from useLanguage.tsx:32-58)
```typescript
const t = useCallback(
  (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      }
    }
    return typeof value === "string" ? value : key;
  },
  [language],
);
```

### External Resources
- React Documentation on State Management: https://react.dev/learn/managing-state
- SessionStorage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage

## Implementation Blueprint

### Phase 1: Pass Intent Context to Recommendations

#### Step 1.1: Update App.tsx to pass detectedIntent to ChatInterface
```typescript
// In /src/widget/App.tsx around line 485
<ChatInterface
  apiKey={config.apiKey}
  apiUrl={apiUrl}
  products={products}
  customerProfile={customerProfile}
  contextEvents={contextEvents}
  detectedIntent={detectedIntent}  // ADD THIS LINE
  onFileUpload={handleDataUpload}
  navigation={config.navigation}
/>
```

#### Step 1.2: Update ChatInterface Props Interface
```typescript
// In /src/widget/components/ChatInterface.tsx around line 13
import { BrowsingIntent } from '../services/eventTracking';

interface ChatInterfaceProps {
  apiKey: string;
  apiUrl?: string;
  products: Product[];
  customerProfile: CustomerProfile | null;
  contextEvents: ContextEvent[];
  detectedIntent?: BrowsingIntent | null;  // ADD THIS LINE
  onFileUpload?: (files: {
    products?: File;
    customer?: File;
    context?: File;
  }) => void;
  navigation?: {
    productUrlPattern?: string;
    baseUrl?: string;
    openInNewTab?: boolean;
  };
}
```

#### Step 1.3: Include Intent in API Request
```typescript
// In /src/widget/components/ChatInterface.tsx around line 216
const requestPayload = {
  session_id: sessionId,
  query: userMessage,
  conversation_history: messages.map((m) => ({
    role: m.role,
    content: m.content,
  })),
  context: {
    current_page: window.location.pathname,
    browsing_category: analysis.category,
    session_duration: Math.floor(
      (Date.now() - (context?.startTime.getTime() || Date.now())) / 1000,
    ),
    conversation_state: nextState,
    insights: insights,
    // ADD THESE LINES
    detected_intent: detectedIntent ? {
      primary_interest: detectedIntent.intent,
      confidence: detectedIntent.confidence,
      behavioral_signals: detectedIntent.signals,
      suggested_context: detectedIntent.suggestedMessage
    } : null,
  },
  // ... rest of payload
};
```

#### Step 1.4: Update Edge Function to Use Intent Context
```typescript
// In /supabase/functions/recommendations/index.ts, modify generateRecommendations
// Add to the context passed to AI service around line 336
const result = await aiService.generateRecommendations({
  query: request.query || '',
  products: products,
  customerProfile: request.customer_profile,
  conversationHistory: request.conversation_history,
  context: {
    ...request.context,
    // Intent context is already included via request.context.detected_intent
  }
});
```

### Phase 2: Add Dismiss Capability to Recommendations

#### Step 2.1: Add State for Dismissed Recommendations
```typescript
// In /src/widget/components/ChatInterface.tsx after line 68
const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(() => {
  const saved = sessionStorage.getItem('porta_futuri_dismissed_recommendations');
  return saved ? new Set(JSON.parse(saved)) : new Set();
});

// Add effect to persist dismissed recommendations
useEffect(() => {
  sessionStorage.setItem(
    'porta_futuri_dismissed_recommendations',
    JSON.stringify(Array.from(dismissedRecommendations))
  );
}, [dismissedRecommendations]);
```

#### Step 2.2: Add Dismiss Handler
```typescript
// In /src/widget/components/ChatInterface.tsx around line 150
const handleDismissRecommendation = useCallback((productId: string, messageId: string) => {
  const dismissKey = `${messageId}-${productId}`;
  setDismissedRecommendations(prev => new Set(prev).add(dismissKey));
}, []);
```

#### Step 2.3: Update Recommendation Card Rendering
```typescript
// In /src/widget/components/ChatInterface.tsx around line 395
{msg.recommendations && msg.recommendations.length > 0 && (
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.5rem",
    marginTop: "0.5rem",
    marginBottom: "1rem",
  }}>
    {msg.recommendations
      .filter((product) => {
        const dismissKey = `${msg.id}-${(product as any).id || (product as any).product_id}`;
        return !dismissedRecommendations.has(dismissKey);
      })
      .slice(0, 3)
      .map((product, idx) => (
        <div
          key={`${msg.id}-rec-${idx}`}
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
            position: "relative", // ADD THIS
          }}
          // ... rest of props
        >
          {/* ADD DISMISS BUTTON */}
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
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.9)",
              border: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              fontSize: "12px",
              color: "#666",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#fff";
              (e.currentTarget as HTMLElement).style.color = "#333";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.9)";
              (e.currentTarget as HTMLElement).style.color = "#666";
            }}
            aria-label="Dismiss recommendation"
          >
            ✕
          </button>
          {/* ... rest of card content */}
        </div>
      ))}
  </div>
)}
```

### Phase 3: Add Clear Chat History and Update Greeting

#### Step 3.1: Update Translations
```typescript
// In /src/widget/services/i18n/translations.ts

// Update line 89-94 (Lithuanian greeting)
greeting: [
  "Klauskite AI asistento patarimo",
  "Klauskite AI asistento patarimo",
  "Klauskite AI asistento patarimo",
  "Klauskite AI asistento patarimo",
],

// Add new translation for clear chat button around line 144
chat: {
  // ... existing translations
  clearHistory: "Išvalyti pokalbį", // ADD THIS LINE
}

// Add English translation around line 234
chat: {
  // ... existing translations  
  clearHistory: "Clear chat", // ADD THIS LINE
}
```

#### Step 3.2: Add Clear History Handler
```typescript
// In /src/widget/components/ChatInterface.tsx around line 150
const handleClearChat = useCallback(() => {
  // Clear messages from state and sessionStorage
  setMessages([]);
  sessionStorage.removeItem('porta_futuri_chat_messages');
  
  // Reset dismissed recommendations
  setDismissedRecommendations(new Set());
  sessionStorage.removeItem('porta_futuri_dismissed_recommendations');
  
  // Add initial greeting message
  const greetingMessage: Message = {
    id: `msg-${Date.now()}`,
    role: "assistant",
    content: t("greeting"),
    timestamp: new Date(),
  };
  setMessages([greetingMessage]);
}, [t]);
```

#### Step 3.3: Add Clear Button to Chat UI
```typescript
// In /src/widget/components/ChatInterface.tsx, add header with clear button
// Add this before the messages container (around line 580)
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 12px",
  borderBottom: "1px solid hsl(var(--pf-border))",
  background: "hsl(var(--pf-background))",
}}>
  <span style={{
    fontSize: "14px",
    fontWeight: "500",
    color: "hsl(var(--pf-foreground))",
  }}>
    {t("chat.title")}
  </span>
  {messages.length > 1 && (
    <button
      onClick={handleClearChat}
      style={{
        padding: "4px 8px",
        fontSize: "12px",
        background: "transparent",
        border: "1px solid hsl(var(--pf-border))",
        borderRadius: "4px",
        color: "hsl(var(--pf-muted-foreground))",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "hsl(var(--pf-muted))";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <span style={{ fontSize: "14px" }}>🗑️</span>
      {t("chat.clearHistory")}
    </button>
  )}
</div>
```

## Detailed Implementation Steps

1. **Update Component Props**
   - Modify App.tsx to pass `detectedIntent` to ChatInterface
   - Update ChatInterface props interface to accept `detectedIntent`

2. **Enhance API Payload**
   - Include detected intent in the context object sent to recommendations API
   - Ensure the Edge Function passes this context to the AI service

3. **Implement Dismiss Functionality**
   - Add state management for dismissed recommendations
   - Persist dismissed items in sessionStorage
   - Add dismiss button with proper styling and hover effects
   - Filter out dismissed items from display

4. **Add Clear Chat Feature**
   - Create handler to clear all messages and dismissed items
   - Update translations with new greeting text and clear button label
   - Add clear button to chat header with conditional rendering

5. **Test All Features**
   - Verify intent context improves recommendations
   - Test dismiss functionality persists across sessions
   - Confirm clear chat resets everything properly
   - Check translations work in both languages

## Validation Gates

### 1. Syntax and Type Checking
```bash
# Frontend
npm run typecheck
npm run lint

# Edge Functions (if modified)
cd supabase/functions
deno fmt --check
deno lint
```

### 2. Functional Testing Checklist
```bash
# Manual testing steps:
# 1. Browse 3+ products to generate intent
# 2. Open chat and send a message
# 3. Verify recommendations reference the detected intent
# 4. Dismiss a recommendation - verify it disappears
# 5. Refresh page - verify dismissed item stays hidden
# 6. Click clear chat - verify all messages cleared
# 7. Verify new greeting shows "Klauskite AI asistento patarimo" in Lithuanian
# 8. Switch to English - verify translations work
```

### 3. Browser Console Checks
```javascript
// Check intent is being passed
console.log('Intent in payload:', requestPayload.context.detected_intent);

// Check dismissed items persisted
console.log('Dismissed:', sessionStorage.getItem('porta_futuri_dismissed_recommendations'));

// Check messages cleared
console.log('Messages:', sessionStorage.getItem('porta_futuri_chat_messages'));
```

## Error Handling

### Dismissed Recommendations
- If sessionStorage is unavailable, gracefully degrade to in-memory only
- Handle invalid JSON in sessionStorage with try-catch

### Clear Chat
- Always show at least the greeting message after clearing
- Handle race conditions if clear is clicked during message sending

### Intent Context
- Provide null-safe access to intent properties
- Don't break recommendations if intent is unavailable

## Security Considerations
- Sanitize any intent messages before displaying
- Validate dismissed recommendation IDs
- Don't expose sensitive intent data in client-side storage

## Success Criteria
1. ✅ Intent context visible in recommendation API requests
2. ✅ Recommendations can be individually dismissed
3. ✅ Dismissed items persist across page refreshes
4. ✅ Clear chat button visible when messages exist
5. ✅ Greeting message updated to "Klauskite AI asistento patarimo"
6. ✅ All features work without breaking existing functionality

## Migration Notes
- No database changes required
- Backward compatible with existing sessions
- SessionStorage keys are new, no conflicts expected

## Testing Scenarios

### Scenario 1: Intent-Aware Recommendations
1. Browse smartphones category 3+ times
2. Open chat and ask "Show me something"
3. Verify recommendations are smartphone-related
4. Check browser console for intent in API payload

### Scenario 2: Dismiss and Persist
1. Get recommendations in chat
2. Dismiss one product
3. Refresh the page
4. Verify dismissed product remains hidden
5. Clear chat and get new recommendations
6. Verify previously dismissed product can appear again

### Scenario 3: Clear Chat Flow
1. Have multiple messages in chat
2. Click clear chat button
3. Verify only greeting message remains
4. Verify greeting is "Klauskite AI asistento patarimo" in Lithuanian
5. Switch to English, clear again
6. Verify English greeting appears

## Quality Score: 9/10

**Confidence Level**: Very high confidence in one-pass implementation

**Strengths**:
- Leverages existing patterns and infrastructure
- Clear implementation path with code examples
- No complex state management required
- All changes are additive (no breaking changes)

**Risk Factors** (-1 point):
- Minor risk of sessionStorage edge cases in older browsers
- Potential for translation key conflicts if not careful

## Implementation Checklist

- [ ] Pass detectedIntent from App.tsx to ChatInterface
- [ ] Update ChatInterface props interface
- [ ] Include intent context in API request payload
- [ ] Add dismissed recommendations state management
- [ ] Implement dismiss button on recommendation cards
- [ ] Add sessionStorage persistence for dismissed items
- [ ] Update Lithuanian greeting translation
- [ ] Add clearHistory translation keys
- [ ] Implement handleClearChat function
- [ ] Add clear chat button to UI
- [ ] Test intent context in recommendations
- [ ] Test dismiss functionality and persistence
- [ ] Test clear chat with both languages
- [ ] Run validation commands
- [ ] Verify no regressions in existing features

---

*PRP Version: 1.0*
*Last Updated: 2025-01-22*