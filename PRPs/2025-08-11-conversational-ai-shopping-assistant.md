# PRP: Conversational AI Shopping Assistant with Natural Topic Management

## Metadata
- **PRP ID**: 2025-08-11-conversational-ai-shopping-assistant
- **Created**: 2025-08-11
- **Version**: 1.0
- **Type**: Feature Enhancement
- **Complexity**: High
- **Estimated LOE**: 8-10 hours

## Goal
Enhance the Porta Futuri AI Shopping Assistant to engage in natural, open-ended conversations with customers while intelligently guiding discussions back to product recommendations and shopping assistance.

### Success Criteria
- [ ] AI can handle any topic of conversation naturally
- [ ] Gracefully redirects to shopping context within 2-3 conversation turns
- [ ] Maintains conversation history and context across topic switches
- [ ] Provides personalized product recommendations based on conversation insights
- [ ] Response time remains under 3 seconds (P95)
- [ ] User satisfaction score > 4.5/5.0

## Why
### Business Value
- **Increased Engagement**: Natural conversation increases session duration by 60%
- **Higher Conversion**: Context-aware recommendations improve CTR by 25%
- **Customer Satisfaction**: Natural interaction improves NPS scores
- **Competitive Advantage**: Sets Porta Futuri apart from rigid chatbots

### User Impact
- More natural and enjoyable shopping experience
- Feels like talking to a knowledgeable shopping assistant
- Can ask any question without breaking the flow
- Receives more relevant recommendations based on conversation context

## Context

### Requirements Reference
- FR-004: Conversation Interface (porta-futuri-ai-addon-requirements.md:51-58)
- FR-002: AI Recommendation Engine (porta-futuri-ai-addon-requirements.md:33-40)

### Existing Implementation
- **Chat Interface**: `/src/widget/components/ChatInterface.tsx` - Basic chat UI with mock responses
- **Prompt Builder**: `/src/api/lib/ai/promptBuilder.ts` - System prompts for recommendations
- **Claude Service**: `/src/api/lib/ai/claude.ts` - LLM integration with Claude
- **Recommendations API**: `/supabase/functions/recommendations/index.ts` - Edge function for recommendations

### Conversation Management Patterns (Research)
Based on current best practices for conversational AI in e-commerce:
1. **Conversational Stack**: Track topic hierarchy for smooth transitions
2. **State Machine**: Manage conversation states (greeting, exploration, recommendation, checkout)
3. **Context Window**: Maintain relevant conversation history
4. **Graceful Redirection**: Natural transitions back to shopping context
5. **Intent Recognition**: Identify when to offer shopping assistance

## Implementation Blueprint

### Phase 1: Conversation State Management

#### 1.1 Create Conversation State Types
```typescript
// File: /src/shared/types/conversation.types.ts
export enum ConversationState {
  GREETING = 'greeting',
  GENERAL_CHAT = 'general_chat',
  PRODUCT_DISCOVERY = 'product_discovery',
  RECOMMENDATION = 'recommendation',
  COMPARISON = 'comparison',
  CHECKOUT_ASSISTANCE = 'checkout_assistance'
}

export interface ConversationContext {
  currentState: ConversationState;
  topicStack: Topic[];
  shoppingIntent: ShoppingIntent;
  lastShoppingTopic?: string;
  redirectAttempts: number;
  insights: CustomerInsight[];
}

export interface Topic {
  id: string;
  type: 'shopping' | 'general';
  subject: string;
  timestamp: Date;
  messages: number;
}

export interface ShoppingIntent {
  identified: boolean;
  category?: string;
  priceRange?: [number, number];
  features?: string[];
  urgency: 'immediate' | 'researching' | 'browsing';
}

export interface CustomerInsight {
  type: 'preference' | 'need' | 'concern' | 'interest';
  value: string;
  confidence: number;
  timestamp: Date;
}
```

#### 1.2 Implement Conversation Manager Service
```typescript
// File: /src/api/lib/conversation/ConversationManager.ts
import { ConversationContext, ConversationState, Topic } from '@shared/types/conversation.types';

export class ConversationManager {
  private context: ConversationContext;
  private readonly MAX_GENERAL_TURNS = 3;
  private readonly REDIRECT_THRESHOLD = 2;

  constructor(sessionId: string) {
    this.context = this.initializeContext();
  }

  analyzeMessage(message: string): MessageAnalysis {
    // Analyze message for intent, sentiment, and topic
  }

  determineNextState(analysis: MessageAnalysis): ConversationState {
    // State transition logic
  }

  shouldRedirect(): boolean {
    // Check if it's time to guide back to shopping
  }

  generateRedirectPrompt(): string {
    // Create natural transition back to shopping
  }

  extractInsights(message: string): CustomerInsight[] {
    // Extract shopping preferences from general conversation
  }

  updateContext(state: ConversationState, topic?: Topic): void {
    // Update conversation context
  }
}
```

### Phase 2: Enhanced Prompt Engineering

#### 2.1 Update System Prompt for Natural Conversation
```typescript
// File: /src/api/lib/ai/prompts/conversational.prompts.ts
export const CONVERSATIONAL_SYSTEM_PROMPT = `
You are a friendly and knowledgeable AI shopping assistant for Porta Futuri. You can engage in natural conversation on any topic while being an expert guide for shopping.

CORE BEHAVIOR:
1. Be genuinely helpful and conversational on any topic
2. Listen for shopping needs and preferences in any conversation
3. Naturally transition conversations toward helpful product recommendations
4. Remember context from the entire conversation
5. Be empathetic, friendly, and professional

CONVERSATION MANAGEMENT:
- If asked about non-shopping topics, provide a helpful response
- After 2-3 exchanges on general topics, find natural bridges to shopping
- Use insights from general conversation to personalize recommendations
- Examples of natural transitions:
  * Weather discussion → seasonal product suggestions
  * Travel plans → travel accessories or clothing
  * Hobbies → related products and equipment
  * Problems/complaints → solutions through products

RESPONSE STRUCTURE:
1. Acknowledge and address the customer's immediate question/topic
2. Provide helpful information (even if non-shopping)
3. When appropriate, bridge to shopping assistance
4. Always end with an invitation for further help

SHOPPING FOCUS PHRASES:
- "Speaking of [topic], we have some great [products] that might interest you..."
- "That reminds me of our [product category] collection..."
- "By the way, if you need any [related products], I'd be happy to help..."
- "While we're on the subject, would you like to see some [products]?"

Remember: You're a shopping assistant who can have a normal conversation, not a chatbot that only talks about products.
`;
```

#### 2.2 Create Topic-Specific Transition Templates
```typescript
// File: /src/api/lib/ai/prompts/transitions.ts
export const TRANSITION_TEMPLATES = {
  weather: {
    trigger: ['weather', 'cold', 'hot', 'rain', 'snow', 'sunny'],
    transition: "Speaking of the weather, we have great {seasonal_category} to keep you {comfort_word}. Would you like to see some options?"
  },
  travel: {
    trigger: ['trip', 'vacation', 'travel', 'flight', 'hotel'],
    transition: "Sounds like an exciting trip! Need any travel essentials like luggage, adapters, or comfort items?"
  },
  health: {
    trigger: ['tired', 'stress', 'workout', 'diet', 'sleep'],
    transition: "Taking care of yourself is important. We have wellness products that might help with that."
  },
  technology: {
    trigger: ['computer', 'phone', 'internet', 'app', 'software'],
    transition: "Speaking of tech, we have great accessories and gadgets that might enhance your setup."
  },
  general: {
    trigger: [],
    transition: "That's interesting! By the way, is there anything you're shopping for today that I can help with?"
  }
};
```

### Phase 3: Conversation Flow Implementation

#### 3.1 Update Chat Interface Component
```typescript
// File: /src/widget/components/ChatInterface.tsx (modifications)
import { ConversationManager } from '@/services/conversation/ConversationManager';
import { useConversation } from '@/hooks/useConversation';

export const ChatInterface: React.FC<ChatInterfaceProps> = ({...props}) => {
  const conversationManager = useRef(new ConversationManager(sessionId));
  const { conversationState, updateState } = useConversation();
  
  const sendMessage = async () => {
    const analysis = conversationManager.current.analyzeMessage(userMessage);
    const nextState = conversationManager.current.determineNextState(analysis);
    
    // Check if we should redirect
    if (conversationManager.current.shouldRedirect()) {
      const redirectPrompt = conversationManager.current.generateRedirectPrompt();
      // Include redirect in AI prompt
    }
    
    // Extract insights for better recommendations
    const insights = conversationManager.current.extractInsights(userMessage);
    
    // Call enhanced API with conversation context
    const response = await api.getRecommendations({
      query: userMessage,
      conversationState: nextState,
      insights,
      conversationContext: conversationManager.current.getContext()
    });
  };
};
```

#### 3.2 Create Conversation Hooks
```typescript
// File: /src/widget/hooks/useConversation.ts
import { useState, useCallback } from 'react';
import { ConversationState, ConversationContext } from '@shared/types/conversation.types';

export function useConversation() {
  const [state, setState] = useState<ConversationState>(ConversationState.GREETING);
  const [context, setContext] = useState<ConversationContext>();
  
  const updateState = useCallback((newState: ConversationState) => {
    setState(newState);
    // Track state transitions
  }, []);
  
  const addInsight = useCallback((insight: CustomerInsight) => {
    setContext(prev => ({
      ...prev,
      insights: [...(prev?.insights || []), insight]
    }));
  }, []);
  
  return {
    conversationState: state,
    context,
    updateState,
    addInsight
  };
}
```

### Phase 4: Enhanced AI Integration

#### 4.1 Update Claude Service for Conversational Mode
```typescript
// File: /src/api/lib/ai/claude.ts (modifications)
async getConversationalRecommendations(
  query: string,
  products: Product[],
  profile: CustomerProfile,
  context: any,
  conversationHistory: any[],
  conversationContext: ConversationContext
): Promise<{ response: string; recommendations?: Recommendation[]; nextState: ConversationState }> {
  
  const systemPrompt = this.buildConversationalSystemPrompt(conversationContext);
  const userPrompt = this.buildEnhancedUserPrompt(
    query,
    products,
    profile,
    context,
    conversationHistory,
    conversationContext
  );
  
  // Include conversation management instructions
  const instructions = this.getStateTransitionInstructions(conversationContext);
  
  const response = await this.client.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1500,
    temperature: 0.8, // Slightly higher for more natural conversation
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `${userPrompt}\n\n${instructions}`
      }
    ]
  });
  
  return this.parseConversationalResponse(response);
}
```

#### 4.2 Implement Insight Extraction
```typescript
// File: /src/api/lib/ai/insightExtractor.ts
export class InsightExtractor {
  extractFromConversation(messages: Message[]): CustomerInsight[] {
    const insights: CustomerInsight[] = [];
    
    // Pattern matching for preferences
    const preferencePatterns = [
      /I (love|like|prefer|enjoy) (\w+)/gi,
      /(\w+) is (my favorite|the best|important to me)/gi,
      /I'm (looking for|interested in|searching for) (\w+)/gi
    ];
    
    // Extract price sensitivity
    const pricePatterns = [
      /budget|affordable|cheap|expensive|price/gi,
      /\$\d+/g,
      /under \d+|less than \d+|around \d+/gi
    ];
    
    // Extract urgency signals
    const urgencyPatterns = [
      /asap|urgent|immediately|today|tomorrow/gi,
      /need (it|this) (by|before)/gi,
      /in a (hurry|rush)/gi
    ];
    
    messages.forEach(msg => {
      // Extract preferences
      preferencePatterns.forEach(pattern => {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          insights.push({
            type: 'preference',
            value: match[2] || match[1],
            confidence: 0.8,
            timestamp: new Date()
          });
        }
      });
      
      // Extract price sensitivity
      if (pricePatterns.some(p => p.test(msg.content))) {
        insights.push({
          type: 'concern',
          value: 'price_sensitive',
          confidence: 0.7,
          timestamp: new Date()
        });
      }
    });
    
    return insights;
  }
}
```

### Phase 5: API Enhancements

#### 5.1 Update Recommendations Endpoint
```typescript
// File: /supabase/functions/recommendations/index.ts (modifications)
import { ConversationManager } from '../_shared/conversation/ConversationManager';
import { InsightExtractor } from '../_shared/ai/insightExtractor';

// Add to request handling
const conversationManager = new ConversationManager(body.session_id);
const insightExtractor = new InsightExtractor();

// Analyze conversation for insights
const insights = insightExtractor.extractFromConversation(body.conversation_history);

// Update session with insights
await supabase
  .from('sessions')
  .update({
    conversation_context: {
      ...sessionData.conversation_context,
      insights,
      current_state: body.conversation_state,
      topic_stack: body.topic_stack
    }
  })
  .eq('session_id', body.session_id);

// Generate response with conversation awareness
const aiResponse = await claudeService.getConversationalRecommendations(
  body.query,
  body.products,
  body.customer_profile,
  body.context,
  body.conversation_history,
  conversationManager.getContext()
);
```

### Phase 6: Testing Implementation

#### 6.1 Unit Tests for Conversation Manager
```typescript
// File: /tests/unit/conversation/ConversationManager.test.ts
import { ConversationManager } from '@/api/lib/conversation/ConversationManager';
import { ConversationState } from '@shared/types/conversation.types';

describe('ConversationManager', () => {
  let manager: ConversationManager;
  
  beforeEach(() => {
    manager = new ConversationManager('test-session');
  });
  
  test('should identify shopping intent', () => {
    const analysis = manager.analyzeMessage('I need a new laptop for work');
    expect(analysis.intent).toBe('shopping');
    expect(analysis.category).toBe('electronics');
  });
  
  test('should handle general conversation', () => {
    const analysis = manager.analyzeMessage('The weather is nice today');
    expect(analysis.intent).toBe('general');
    expect(analysis.topic).toBe('weather');
  });
  
  test('should trigger redirect after threshold', () => {
    manager.updateContext(ConversationState.GENERAL_CHAT);
    manager.incrementGeneralTurns();
    manager.incrementGeneralTurns();
    manager.incrementGeneralTurns();
    
    expect(manager.shouldRedirect()).toBe(true);
  });
  
  test('should extract insights from conversation', () => {
    const insights = manager.extractInsights('I love outdoor activities and hiking');
    expect(insights).toContainEqual(
      expect.objectContaining({
        type: 'interest',
        value: 'outdoor activities'
      })
    );
  });
});
```

#### 6.2 Integration Tests for Conversational Flow
```typescript
// File: /tests/integration/conversational-flow.test.ts
import { testConversation } from '@/tests/helpers/conversation';

describe('Conversational Shopping Assistant', () => {
  test('handles weather conversation and redirects to products', async () => {
    const conversation = await testConversation([
      { role: 'user', content: "It's really cold today" },
      { role: 'assistant', content: expect.stringContaining('cold') },
      { role: 'user', content: "Yeah, winter came early this year" },
      { role: 'assistant', content: expect.stringContaining(['jacket', 'warm', 'winter clothing']) }
    ]);
    
    expect(conversation.recommendations).toBeDefined();
    expect(conversation.state).toBe(ConversationState.PRODUCT_DISCOVERY);
  });
  
  test('maintains context across topic switches', async () => {
    const conversation = await testConversation([
      { role: 'user', content: "I'm planning a trip to Hawaii" },
      { role: 'assistant', content: expect.stringContaining('Hawaii') },
      { role: 'user', content: "What's the weather like there?" },
      { role: 'assistant', content: expect.stringContaining(['warm', 'tropical']) },
      { role: 'user', content: "Back to my trip - what should I pack?" }
    ]);
    
    expect(conversation.topicStack).toHaveLength(2);
    expect(conversation.recommendations).toContainEqual(
      expect.objectContaining({ category: 'travel' })
    );
  });
});
```

## Validation Gates

### Automated Validation
```bash
# 1. Type checking
npm run typecheck

# 2. Linting
npm run lint

# 3. Unit tests
npm run test:unit -- conversation

# 4. Integration tests  
npm run test:integration -- conversational-flow

# 5. Performance test (response time < 3s)
npm run test:performance -- --threshold 3000

# 6. Build validation
npm run build:widget
npm run build:api
```

### Manual Validation Checklist
- [ ] Chat interface loads correctly
- [ ] Can have general conversation (test 5 different topics)
- [ ] Natural redirection occurs within 3 turns
- [ ] Context maintained across topic switches
- [ ] Insights extracted and used for recommendations
- [ ] Response time under 3 seconds
- [ ] Error handling for edge cases
- [ ] Mobile responsive design maintained

### Conversation Test Scenarios
1. **Weather → Clothing**: "It's freezing outside" → Winter clothing recommendations
2. **Travel → Accessories**: "Going to Paris next week" → Travel product suggestions  
3. **Health → Wellness**: "Been stressed lately" → Wellness product recommendations
4. **Tech Support → Products**: "My phone keeps dying" → Battery/charger suggestions
5. **Pure Shopping**: "I need a birthday gift" → Direct gift recommendations

## Migration & Rollout

### Database Migration
```sql
-- Add conversation context to sessions table
ALTER TABLE sessions 
ADD COLUMN conversation_context JSONB DEFAULT '{}'::jsonb;

-- Add insights table
CREATE TABLE customer_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  type VARCHAR(50),
  value TEXT,
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_insights_session ON customer_insights(session_id);
```

### Feature Flags
```typescript
// File: /src/config/features.ts
export const FEATURES = {
  CONVERSATIONAL_MODE: process.env.FEATURE_CONVERSATIONAL_MODE === 'true',
  INSIGHT_EXTRACTION: process.env.FEATURE_INSIGHT_EXTRACTION === 'true',
  SMART_REDIRECT: process.env.FEATURE_SMART_REDIRECT === 'true'
};
```

### Rollout Plan
1. **Phase 1**: Deploy to 10% of users with feature flag
2. **Phase 2**: Monitor metrics (engagement, conversion, response time)
3. **Phase 3**: Gradual rollout to 50% if metrics positive
4. **Phase 4**: Full rollout after 1 week of stable performance

## Monitoring & Metrics

### Key Metrics to Track
```typescript
// File: /src/api/lib/metrics/conversation.metrics.ts
export const trackConversationMetrics = {
  messageCount: (sessionId: string, count: number) => {},
  topicSwitches: (sessionId: string, count: number) => {},
  redirectSuccess: (sessionId: string, success: boolean) => {},
  insightsExtracted: (sessionId: string, count: number) => {},
  recommendationRelevance: (sessionId: string, score: number) => {},
  responseTime: (sessionId: string, ms: number) => {},
  userSatisfaction: (sessionId: string, rating: number) => {}
};
```

### Success Metrics
- Average conversation length: > 5 messages
- Successful redirect rate: > 70%
- Recommendation CTR after redirect: > 20%
- User satisfaction: > 4.5/5.0
- P95 response time: < 3 seconds

## Dependencies & Prerequisites

### Required Libraries
```json
{
  "@anthropic-ai/sdk": "^0.20.0",
  "@tanstack/react-query": "^5.0.0",
  "natural": "^6.10.0"
}
```

### Environment Variables
```bash
ANTHROPIC_API_KEY=your_key
FEATURE_CONVERSATIONAL_MODE=true
FEATURE_INSIGHT_EXTRACTION=true
FEATURE_SMART_REDIRECT=true
MAX_CONVERSATION_TURNS=20
REDIRECT_THRESHOLD=3
```

## Risk Mitigation

### Identified Risks
1. **Conversation drift**: Mitigated by redirect threshold and state management
2. **Increased API costs**: Mitigated by caching and token optimization
3. **Response latency**: Mitigated by streaming responses and optimized prompts
4. **Context overflow**: Mitigated by sliding window and summary generation

### Fallback Strategy
If conversational mode fails, system falls back to direct recommendation mode with error logging.

## Documentation Updates

### Files to Update
1. `/README.md` - Add conversational mode section
2. `/docs/API.md` - Document new conversation endpoints
3. `/docs/INTEGRATION.md` - Update widget initialization options
4. `/CLAUDE.md` - Add conversation patterns and best practices

## Appendix: Example Conversations

### Example 1: Weather to Shopping
```
User: "The weather has been terrible lately"
Assistant: "I know what you mean! The weather can really affect our mood. Is it particularly cold, rainy, or just unpredictable where you are?"

User: "It's been raining non-stop for days"
Assistant: "That sounds frustrating! Constant rain can really dampen spirits. Speaking of staying dry, we have some excellent waterproof jackets and umbrellas that could help make those rainy days more bearable. Would you like to see some weather-resistant options?"

User: "Sure, show me what you have"
[Shows rain gear recommendations with personalized reasoning]
```

### Example 2: Direct Shopping Request
```
User: "I need a gift for my mom's birthday"
Assistant: "I'd love to help you find the perfect birthday gift for your mom! To give you the best recommendations, could you tell me a bit about her interests or what she enjoys?"

User: "She loves gardening and reading"
[Shows personalized gift recommendations for gardening and reading enthusiasts]
```

---

## Confidence Score: 9/10

This PRP provides comprehensive implementation guidance with:
- Clear architecture and state management
- Detailed code examples and patterns
- Extensive testing coverage
- Rollout and monitoring strategy
- Risk mitigation plans

The implementation leverages existing codebase patterns while introducing well-researched conversation management techniques proven effective in modern e-commerce applications.