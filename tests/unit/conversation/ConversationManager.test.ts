import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationManager } from '@/api/lib/conversation/ConversationManager';
import { ConversationState } from '@shared/types/conversation.types';

describe('ConversationManager', () => {
  let manager: ConversationManager;
  
  beforeEach(() => {
    manager = new ConversationManager('test-session');
  });
  
  describe('Message Analysis', () => {
    it('should identify shopping intent', () => {
      const analysis = manager.analyzeMessage('I need a new laptop for work');
      expect(analysis.intent).toBe('shopping');
      expect(analysis.category).toBe('electronics');
    });
    
    it('should handle general conversation', () => {
      const analysis = manager.analyzeMessage('The weather is nice today');
      expect(analysis.intent).toBe('general');
      expect(analysis.topic).toBe('weather');
    });
    
    it('should identify mixed intent', () => {
      const analysis = manager.analyzeMessage('I was thinking about buying something');
      expect(['shopping', 'mixed']).toContain(analysis.intent);
    });
    
    it('should extract entities from message', () => {
      const analysis = manager.analyzeMessage('I want an Apple iPhone for $999');
      expect(analysis.entities).toContain('Apple');
      expect(analysis.entities.some(e => e.includes('999'))).toBe(true);
    });
    
    it('should analyze sentiment correctly', () => {
      const positive = manager.analyzeMessage('I love this product!');
      expect(positive.sentiment).toBe('positive');
      
      const negative = manager.analyzeMessage('This is terrible');
      expect(negative.sentiment).toBe('negative');
      
      const neutral = manager.analyzeMessage('Show me products');
      expect(neutral.sentiment).toBe('neutral');
    });
  });
  
  describe('State Management', () => {
    it('should start with greeting state', () => {
      const context = manager.getContext();
      expect(context.currentState).toBe(ConversationState.GREETING);
    });
    
    it('should transition to general chat from greeting', () => {
      const analysis = manager.analyzeMessage('Hello there');
      const nextState = manager.determineNextState(analysis);
      expect(nextState).toBe(ConversationState.GENERAL_CHAT);
    });
    
    it('should transition to product discovery for shopping intent', () => {
      const analysis = manager.analyzeMessage('I want to buy a phone');
      const nextState = manager.determineNextState(analysis);
      expect(nextState).toBe(ConversationState.PRODUCT_DISCOVERY);
    });
    
    it('should track general turns', () => {
      manager.updateContext(ConversationState.GENERAL_CHAT);
      manager.incrementGeneralTurns();
      manager.incrementGeneralTurns();
      
      const context = manager.getContext();
      expect(context.generalTurns).toBe(3);
    });
  });
  
  describe('Redirect Logic', () => {
    it('should trigger redirect after threshold', () => {
      manager.updateContext(ConversationState.GENERAL_CHAT);
      manager.incrementGeneralTurns();
      manager.incrementGeneralTurns();
      manager.incrementGeneralTurns();
      
      expect(manager.shouldRedirect()).toBe(true);
    });
    
    it('should not redirect if attempts exceed threshold', () => {
      manager.updateContext(ConversationState.GENERAL_CHAT);
      
      // Simulate multiple redirect attempts
      for (let i = 0; i < 3; i++) {
        manager.generateRedirectPrompt();
      }
      
      expect(manager.shouldRedirect()).toBe(false);
    });
    
    it('should generate redirect prompts', () => {
      const prompt = manager.generateRedirectPrompt();
      expect(prompt).toBeTruthy();
      expect(prompt).toContain('shopping');
    });
  });
  
  describe('Insight Extraction', () => {
    it('should extract preferences from conversation', () => {
      const insights = manager.extractInsights('I love outdoor activities and hiking');
      expect(insights).toHaveLength(2);
      expect(insights[0].type).toBe('preference');
      expect(insights[0].value).toContain('outdoor');
    });
    
    it('should extract needs from message', () => {
      const insights = manager.extractInsights('I need a waterproof jacket');
      expect(insights.some(i => i.type === 'need')).toBe(true);
      expect(insights.some(i => i.value.includes('waterproof'))).toBe(true);
    });
    
    it('should identify price sensitivity', () => {
      const insights = manager.extractInsights('I am on a tight budget');
      expect(insights.some(i => 
        i.type === 'concern' && i.value === 'price_sensitive'
      )).toBe(true);
    });
    
    it('should extract multiple insight types', () => {
      const insights = manager.extractInsights('I love Apple products but need something affordable');
      
      const hasPreference = insights.some(i => i.type === 'preference');
      const hasNeed = insights.some(i => i.type === 'need');
      const hasConcern = insights.some(i => i.type === 'concern');
      
      expect(hasPreference || hasNeed || hasConcern).toBe(true);
    });
  });
  
  describe('Topic Management', () => {
    it('should add topics to stack', () => {
      const topic = {
        id: 'topic-1',
        type: 'shopping' as const,
        subject: 'electronics',
        timestamp: new Date(),
        messages: 1
      };
      
      manager.updateContext(ConversationState.PRODUCT_DISCOVERY, topic);
      const context = manager.getContext();
      
      expect(context.topicStack).toHaveLength(1);
      expect(context.topicStack[0].subject).toBe('electronics');
    });
    
    it('should maintain topic stack limit', () => {
      // Add more than 10 topics
      for (let i = 0; i < 15; i++) {
        const topic = {
          id: `topic-${i}`,
          type: 'general' as const,
          subject: `topic-${i}`,
          timestamp: new Date(),
          messages: 1
        };
        manager.updateContext(ConversationState.GENERAL_CHAT, topic);
      }
      
      const context = manager.getContext();
      expect(context.topicStack.length).toBeLessThanOrEqual(10);
    });
    
    it('should track last shopping topic', () => {
      const shoppingTopic = {
        id: 'shopping-1',
        type: 'shopping' as const,
        subject: 'laptops',
        timestamp: new Date(),
        messages: 1
      };
      
      manager.updateContext(ConversationState.PRODUCT_DISCOVERY, shoppingTopic);
      const context = manager.getContext();
      
      expect(context.lastShoppingTopic).toBe('laptops');
    });
  });
  
  describe('Shopping Intent', () => {
    it('should update shopping intent', () => {
      manager.updateShoppingIntent({
        identified: true,
        category: 'electronics',
        confidence: 0.9
      });
      
      const context = manager.getContext();
      expect(context.shoppingIntent.identified).toBe(true);
      expect(context.shoppingIntent.category).toBe('electronics');
      expect(context.shoppingIntent.confidence).toBe(0.9);
    });
    
    it('should detect urgency in messages', () => {
      const urgentAnalysis = manager.analyzeMessage('I need this ASAP for tomorrow');
      expect(urgentAnalysis.confidence).toBeGreaterThan(0.5);
    });
  });
  
  describe('Conversation Transitions', () => {
    it('should provide transition suggestions', () => {
      const transition = manager.getTransitionSuggestion();
      expect(transition).toBeTruthy();
      expect(transition?.template).toBeTruthy();
    });
    
    it('should transition from general to shopping naturally', () => {
      manager.updateContext(ConversationState.GENERAL_CHAT);
      manager.incrementGeneralTurns();
      manager.incrementGeneralTurns();
      
      const analysis = manager.analyzeMessage('Actually, I do need some help finding something');
      const nextState = manager.determineNextState(analysis);
      
      expect(nextState).toBe(ConversationState.PRODUCT_DISCOVERY);
    });
  });
});