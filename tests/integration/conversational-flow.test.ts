import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationManager } from '@/api/lib/conversation/ConversationManager';
import { InsightExtractor } from '@/api/lib/ai/insightExtractor';
import { ConversationState } from '@shared/types/conversation.types';

// Helper function to simulate a conversation
async function testConversation(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  const manager = new ConversationManager('test-session');
  const extractor = new InsightExtractor();
  
  const conversation = {
    messages: [] as any[],
    state: ConversationState.GREETING,
    recommendations: [] as any[],
    insights: [] as any[],
    topicStack: [] as any[]
  };
  
  for (const msg of messages) {
    conversation.messages.push(msg);
    
    if (msg.role === 'user') {
      const analysis = manager.analyzeMessage(msg.content);
      const nextState = manager.determineNextState(analysis);
      const insights = extractor.extractFromConversation([msg]);
      
      conversation.state = nextState;
      conversation.insights.push(...insights);
      
      manager.updateContext(nextState);
      
      if (analysis.topic) {
        conversation.topicStack.push({
          type: analysis.intent === 'shopping' ? 'shopping' : 'general',
          subject: analysis.topic
        });
      }
      
      // Simulate getting recommendations if in appropriate state
      if (nextState === ConversationState.RECOMMENDATION || 
          nextState === ConversationState.PRODUCT_DISCOVERY) {
        conversation.recommendations = [
          { id: 'prod-1', name: 'Product 1', category: analysis.category || 'general' }
        ];
      }
    }
  }
  
  return conversation;
}

describe('Conversational Shopping Assistant Flow', () => {
  describe('Weather to Shopping Transitions', () => {
    it('handles weather conversation and redirects to products', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "It's really cold today" },
        { role: 'assistant', content: "I can imagine how uncomfortable that must be! Is it snowing where you are?" },
        { role: 'user', content: "Yeah, winter came early this year" },
        { role: 'assistant', content: "Winter weather can be tough! Speaking of staying warm, we have excellent winter clothing that could help. Would you like to see some options?" }
      ]);
      
      expect(conversation.topicStack.some(t => t.subject === 'weather')).toBe(true);
      expect(conversation.state).toBe(ConversationState.GENERAL_CHAT);
    });
    
    it('transitions from cold weather to winter clothing', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "I'm freezing! The heating in my apartment is broken" },
        { role: 'assistant', content: "That sounds really uncomfortable! While you wait for repairs, we have warm clothing that could help. Interested?" },
        { role: 'user', content: "Yes, show me what you have" }
      ]);
      
      expect(conversation.state).toBe(ConversationState.PRODUCT_DISCOVERY);
      expect(conversation.recommendations.length).toBeGreaterThan(0);
    });
  });
  
  describe('Travel Planning to Products', () => {
    it('transitions from travel discussion to travel accessories', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "I'm planning a trip to Hawaii next month" },
        { role: 'assistant', content: "Hawaii sounds amazing! The beaches and weather are perfect that time of year." },
        { role: 'user', content: "I've never been, what should I expect?" },
        { role: 'assistant', content: "Expect warm weather, beautiful beaches, and lots of outdoor activities. Need any travel essentials like luggage or beach gear for your trip?" }
      ]);
      
      expect(conversation.topicStack.some(t => t.subject === 'travel')).toBe(true);
      expect(conversation.insights.length).toBeGreaterThan(0);
    });
  });
  
  describe('Health and Wellness Transitions', () => {
    it('transitions from stress discussion to wellness products', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "I've been so stressed with work lately" },
        { role: 'assistant', content: "Work stress can really take a toll. Are you finding time for self-care?" },
        { role: 'user', content: "Not really, I don't know where to start" },
        { role: 'assistant', content: "Self-care is so important. We have wellness products that many customers find helpful for stress relief. Would you like some recommendations?" }
      ]);
      
      expect(conversation.topicStack.some(t => t.subject === 'health')).toBe(true);
    });
  });
  
  describe('Direct Shopping Requests', () => {
    it('handles immediate shopping intent', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "I need a gift for my mom's birthday" },
        { role: 'assistant', content: "I'd love to help you find the perfect birthday gift for your mom! To give you the best recommendations, could you tell me a bit about her interests?" }
      ]);
      
      expect(conversation.state).toBe(ConversationState.PRODUCT_DISCOVERY);
    });
    
    it('handles specific product requests', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "Do you have any wireless headphones under $200?" },
        { role: 'assistant', content: "Yes! I have several excellent wireless headphones within your budget. Let me show you our top options." }
      ]);
      
      expect(conversation.state).toBe(ConversationState.RECOMMENDATION);
      expect(conversation.insights.some(i => i.type === 'concern' && i.value === 'price_sensitive')).toBe(true);
    });
  });
  
  describe('Context Maintenance Across Topics', () => {
    it('maintains context across topic switches', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "I'm planning a trip to Hawaii" },
        { role: 'assistant', content: "Hawaii sounds wonderful! When are you planning to go?" },
        { role: 'user', content: "Next month. By the way, what's the weather like there?" },
        { role: 'assistant', content: "Hawaii has beautiful weather year-round, typically warm and tropical with occasional rain." },
        { role: 'user', content: "Back to my trip - what should I pack?" },
        { role: 'assistant', content: "For Hawaii, you'll want light, breathable clothing, swimwear, and sun protection. Would you like to see our travel essentials collection?" }
      ]);
      
      expect(conversation.topicStack.length).toBeGreaterThanOrEqual(2);
      expect(conversation.topicStack.some(t => t.subject === 'travel')).toBe(true);
      expect(conversation.topicStack.some(t => t.subject === 'weather')).toBe(true);
    });
  });
  
  describe('Insight Extraction from Conversation', () => {
    it('extracts preferences from casual conversation', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "I love outdoor activities, especially hiking and camping" },
        { role: 'assistant', content: "Outdoor adventures are amazing! Do you have a favorite hiking spot?" },
        { role: 'user', content: "The mountains near my home. I go every weekend" }
      ]);
      
      const outdoorInsights = conversation.insights.filter(i => 
        i.value.includes('outdoor') || i.value.includes('hiking') || i.value.includes('camping')
      );
      expect(outdoorInsights.length).toBeGreaterThan(0);
    });
    
    it('identifies budget constraints', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "I want something nice but I'm on a tight budget" },
        { role: 'assistant', content: "I understand - finding quality within budget is important. What's your price range?" },
        { role: 'user', content: "Ideally under $50" }
      ]);
      
      expect(conversation.insights.some(i => i.type === 'concern' && i.value === 'price_sensitive')).toBe(true);
    });
    
    it('captures brand preferences', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "I usually buy Apple products, but open to alternatives" },
        { role: 'assistant', content: "Apple makes great products! What do you like most about them?" },
        { role: 'user', content: "The build quality and ecosystem" }
      ]);
      
      expect(conversation.insights.some(i => i.value.includes('apple'))).toBe(true);
      expect(conversation.insights.some(i => i.value.includes('quality'))).toBe(true);
    });
  });
  
  describe('Redirect Behavior', () => {
    it('respects user resistance to shopping redirect', async () => {
      const manager = new ConversationManager('test-session');
      
      // Simulate resistance to redirect
      manager.updateContext(ConversationState.GENERAL_CHAT);
      manager.incrementGeneralTurns();
      manager.incrementGeneralTurns();
      manager.incrementGeneralTurns();
      
      // First redirect attempt
      expect(manager.shouldRedirect()).toBe(true);
      manager.generateRedirectPrompt();
      
      // User continues general chat
      const analysis = manager.analyzeMessage("Let's keep talking about the weather");
      expect(analysis.intent).toBe('general');
      
      // After multiple attempts, should stop redirecting
      manager.generateRedirectPrompt();
      manager.generateRedirectPrompt();
      expect(manager.shouldRedirect()).toBe(false);
    });
  });
  
  describe('State Progression', () => {
    it('progresses through conversation states naturally', async () => {
      const manager = new ConversationManager('test-session');
      const states: ConversationState[] = [];
      
      // Greeting
      states.push(manager.getContext().currentState);
      
      // General chat
      let analysis = manager.analyzeMessage("Hi there!");
      manager.updateContext(manager.determineNextState(analysis));
      states.push(manager.getContext().currentState);
      
      // Product discovery
      analysis = manager.analyzeMessage("I'm looking for a laptop");
      manager.updateContext(manager.determineNextState(analysis));
      states.push(manager.getContext().currentState);
      
      // Recommendation
      analysis = manager.analyzeMessage("I need it for programming and design work");
      manager.updateContext(ConversationState.RECOMMENDATION);
      states.push(manager.getContext().currentState);
      
      // Comparison
      analysis = manager.analyzeMessage("Can you compare the MacBook Pro and Dell XPS?");
      manager.updateContext(ConversationState.COMPARISON);
      states.push(manager.getContext().currentState);
      
      expect(states).toContain(ConversationState.GREETING);
      expect(states).toContain(ConversationState.GENERAL_CHAT);
      expect(states).toContain(ConversationState.PRODUCT_DISCOVERY);
      expect(states).toContain(ConversationState.RECOMMENDATION);
      expect(states).toContain(ConversationState.COMPARISON);
    });
  });
  
  describe('Multi-turn Conversations', () => {
    it('handles long conversations with multiple topics', async () => {
      const conversation = await testConversation([
        { role: 'user', content: "Hi!" },
        { role: 'assistant', content: "Hello! How can I help you today?" },
        { role: 'user', content: "Just browsing around" },
        { role: 'assistant', content: "Great! Take your time. Let me know if you need any recommendations." },
        { role: 'user', content: "Actually, the weather has been terrible lately" },
        { role: 'assistant', content: "I know what you mean! What kind of weather are you dealing with?" },
        { role: 'user', content: "Lots of rain" },
        { role: 'assistant', content: "Rainy weather can be challenging. By the way, we have great rain gear if you need to stay dry!" },
        { role: 'user', content: "Maybe later. I'm also planning a trip soon" },
        { role: 'assistant', content: "How exciting! Where are you headed?" },
        { role: 'user', content: "Thinking about Europe" },
        { role: 'assistant', content: "Europe is wonderful! For your trip, would you like to see our travel collection?" },
        { role: 'user', content: "Sure, show me backpacks" }
      ]);
      
      expect(conversation.messages.length).toBe(13);
      expect(conversation.topicStack.length).toBeGreaterThan(2);
      expect(conversation.state).toBe(ConversationState.PRODUCT_DISCOVERY);
    });
  });
});