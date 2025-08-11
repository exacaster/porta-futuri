import {
  ConversationContext,
  ConversationState,
  Topic,
  MessageAnalysis,
  CustomerInsight,
  ShoppingIntent,
  ConversationTransition
} from '@shared/types/conversation.types';

export class ConversationManager {
  private context: ConversationContext;
  private readonly MAX_GENERAL_TURNS = 3;
  private readonly REDIRECT_THRESHOLD = 2;
  
  // Shopping-related keywords for intent detection
  private readonly SHOPPING_KEYWORDS = [
    'buy', 'purchase', 'need', 'looking for', 'want', 'shop', 'price',
    'cost', 'cheap', 'expensive', 'budget', 'gift', 'present', 'recommendation',
    'suggest', 'best', 'top', 'quality', 'review', 'compare', 'vs', 'better'
  ];
  
  // Category keywords for classification
  private readonly CATEGORY_PATTERNS: Record<string, string[]> = {
    electronics: ['phone', 'laptop', 'computer', 'tablet', 'camera', 'tv', 'headphones', 'speaker'],
    clothing: ['shirt', 'pants', 'dress', 'jacket', 'shoes', 'coat', 'jeans', 'sweater'],
    home: ['furniture', 'decor', 'kitchen', 'bathroom', 'bedroom', 'living room', 'table', 'chair'],
    beauty: ['makeup', 'skincare', 'perfume', 'cosmetics', 'beauty', 'lotion', 'cream'],
    sports: ['fitness', 'gym', 'running', 'yoga', 'sports', 'exercise', 'workout', 'training'],
    travel: ['luggage', 'suitcase', 'backpack', 'travel', 'trip', 'vacation', 'flight', 'hotel']
  };

  constructor(sessionId: string) {
    this.context = this.initializeContext(sessionId);
  }

  private initializeContext(sessionId: string): ConversationContext {
    return {
      sessionId,
      currentState: ConversationState.GREETING,
      topicStack: [],
      shoppingIntent: {
        identified: false,
        urgency: 'browsing',
        confidence: 0
      },
      redirectAttempts: 0,
      generalTurns: 0,
      insights: [],
      startTime: new Date(),
      lastActivity: new Date()
    };
  }

  analyzeMessage(message: string): MessageAnalysis {
    const lowerMessage = message.toLowerCase();
    const analysis: MessageAnalysis = {
      intent: 'general',
      sentiment: this.analyzeSentiment(message),
      entities: this.extractEntities(message),
      confidence: 0,
      shouldRedirect: false
    };

    // Check for shopping intent
    const shoppingScore = this.calculateShoppingIntentScore(lowerMessage);
    if (shoppingScore > 0.3) {
      analysis.intent = shoppingScore > 0.7 ? 'shopping' : 'mixed';
      analysis.confidence = shoppingScore;
    }

    // Detect category
    for (const [category, keywords] of Object.entries(this.CATEGORY_PATTERNS)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        analysis.category = category;
        break;
      }
    }

    // Identify topic
    analysis.topic = this.identifyTopic(message);

    // Determine if we should redirect
    if (this.context.generalTurns >= this.MAX_GENERAL_TURNS && analysis.intent === 'general') {
      analysis.shouldRedirect = true;
    }

    return analysis;
  }

  private calculateShoppingIntentScore(message: string): number {
    let score = 0;
    let matchCount = 0;

    for (const keyword of this.SHOPPING_KEYWORDS) {
      if (message.includes(keyword)) {
        matchCount++;
      }
    }

    // Calculate base score from keyword matches
    score = Math.min(matchCount / 3, 1);

    // Boost score if message contains question marks and shopping keywords
    if (message.includes('?') && matchCount > 0) {
      score = Math.min(score + 0.2, 1);
    }

    // Boost for specific patterns
    if (/where can i (buy|get|find)/i.test(message) ||
        /do you have/i.test(message) ||
        /i'm looking for/i.test(message)) {
      score = Math.min(score + 0.3, 1);
    }

    return score;
  }

  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['love', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'good', 'nice'];
    const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'horrible', 'worst', 'disappointing', 'poor'];
    
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    
    if (positiveCount > negativeCount) {return 'positive';}
    if (negativeCount > positiveCount) {return 'negative';}
    return 'neutral';
  }

  private extractEntities(message: string): string[] {
    const entities: string[] = [];
    
    // Extract brand names (simple pattern matching)
    const brandPatterns = /\b(Apple|Samsung|Nike|Adidas|Sony|LG|Dell|HP|Lenovo|Microsoft)\b/gi;
    const brands = message.match(brandPatterns);
    if (brands) {entities.push(...brands);}
    
    // Extract price mentions
    const pricePattern = /\$?\d+(?:\.\d{2})?/g;
    const prices = message.match(pricePattern);
    if (prices) {entities.push(...prices);}
    
    // Extract colors
    const colorPattern = /\b(red|blue|green|black|white|gray|grey|yellow|orange|purple|pink)\b/gi;
    const colors = message.match(colorPattern);
    if (colors) {entities.push(...colors);}
    
    return entities;
  }

  private identifyTopic(message: string): string {
    const topicPatterns: Record<string, RegExp[]> = {
      weather: [/weather/i, /rain/i, /snow/i, /cold/i, /hot/i, /sunny/i, /cloudy/i],
      travel: [/trip/i, /vacation/i, /travel/i, /flight/i, /hotel/i, /destination/i],
      health: [/health/i, /sick/i, /doctor/i, /medicine/i, /workout/i, /exercise/i, /diet/i],
      technology: [/computer/i, /phone/i, /internet/i, /app/i, /software/i, /tech/i],
      food: [/food/i, /eat/i, /restaurant/i, /cook/i, /recipe/i, /meal/i, /dinner/i],
      entertainment: [/movie/i, /music/i, /game/i, /book/i, /show/i, /concert/i],
      work: [/work/i, /job/i, /office/i, /meeting/i, /project/i, /deadline/i]
    };
    
    for (const [topic, patterns] of Object.entries(topicPatterns)) {
      if (patterns.some(pattern => pattern.test(message))) {
        return topic;
      }
    }
    
    return 'general';
  }

  determineNextState(analysis: MessageAnalysis): ConversationState {
    const currentState = this.context.currentState;
    
    // Handle greeting state first
    if (currentState === ConversationState.GREETING) {
      if (analysis.intent === 'shopping') {
        return ConversationState.PRODUCT_DISCOVERY;
      }
      return analysis.intent === 'general' ? 
        ConversationState.GENERAL_CHAT : 
        ConversationState.PRODUCT_DISCOVERY;
    }
    
    // Handle general chat state
    if (currentState === ConversationState.GENERAL_CHAT) {
      if (analysis.intent === 'shopping') {
        return ConversationState.PRODUCT_DISCOVERY;
      }
      if (this.shouldRedirect()) {
        return ConversationState.PRODUCT_DISCOVERY;
      }
      return ConversationState.GENERAL_CHAT;
    }
    
    // Handle product discovery state
    if (currentState === ConversationState.PRODUCT_DISCOVERY) {
      if (analysis.intent === 'shopping' && analysis.entities.length >= 2) {
        return ConversationState.COMPARISON;
      }
      if (analysis.intent === 'shopping' || analysis.intent === 'mixed') {
        return ConversationState.RECOMMENDATION;
      }
      return ConversationState.PRODUCT_DISCOVERY;
    }
    
    // Handle shopping intent from any other state
    if (analysis.intent === 'shopping') {
      if (analysis.category) {
        return ConversationState.PRODUCT_DISCOVERY;
      }
      return ConversationState.RECOMMENDATION;
    }
    
    return currentState;
  }

  shouldRedirect(): boolean {
    // Check if we've been in general chat for too long
    if (this.context.generalTurns >= this.MAX_GENERAL_TURNS) {
      return true;
    }
    
    // Check if we've made too many redirect attempts
    if (this.context.redirectAttempts >= this.REDIRECT_THRESHOLD) {
      return false; // Stop trying to redirect if user resists
    }
    
    // Check time spent in general chat
    const timeSinceShoppingTopic = this.context.lastShoppingTopic ? 
      Date.now() - new Date(this.context.lastShoppingTopic).getTime() : 
      Infinity;
    
    if (timeSinceShoppingTopic > 60000) { // More than 1 minute
      return true;
    }
    
    return false;
  }

  generateRedirectPrompt(topic?: string): string {
    const redirectTemplates = [
      "By the way, is there anything specific you're shopping for today?",
      "Speaking of {topic}, we have some great products that might interest you.",
      "That reminds me - have you seen our latest {category} collection?",
      "While we're chatting, feel free to ask about any products you need help finding.",
      "Interesting point! On a related note, are you looking for anything in particular?",
      "I'd love to help you find something perfect. What brings you here today?"
    ];
    
    // Select appropriate template based on context
    let template = redirectTemplates[Math.floor(Math.random() * redirectTemplates.length)];
    
    // Replace placeholders
    if (topic && template.includes('{topic}')) {
      template = template.replace('{topic}', topic);
    }
    
    if (this.context.shoppingIntent.category && template.includes('{category}')) {
      template = template.replace('{category}', this.context.shoppingIntent.category);
    }
    
    // Remove unfilled placeholders
    template = template.replace(/\{[^}]+\}/g, 'that');
    
    this.context.redirectAttempts++;
    
    return template;
  }

  extractInsights(message: string): CustomerInsight[] {
    const insights: CustomerInsight[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Extract preferences
    const preferencePatterns = [
      { pattern: /i (love|like|prefer|enjoy) (\w+)/gi, type: 'preference' as const },
      { pattern: /(\w+) is (my favorite|the best)/gi, type: 'preference' as const },
      { pattern: /i'm (into|interested in) (\w+)/gi, type: 'interest' as const }
    ];
    
    for (const { pattern, type } of preferencePatterns) {
      const matches = [...message.matchAll(pattern)];
      for (const match of matches) {
        insights.push({
          id: this.generateId(),
          type,
          value: match[2] || match[1],
          confidence: 0.8,
          timestamp: new Date(),
          source: 'explicit'
        });
      }
    }
    
    // Extract needs
    const needPatterns = [
      /i need (\w+(?:\s+\w+)?)/gi,
      /looking for (\w+(?:\s+\w+)?)/gi,
      /want to buy (\w+(?:\s+\w+)?)/gi
    ];
    
    for (const pattern of needPatterns) {
      const matches = [...message.matchAll(pattern)];
      for (const match of matches) {
        insights.push({
          id: this.generateId(),
          type: 'need',
          value: match[1],
          confidence: 0.9,
          timestamp: new Date(),
          source: 'explicit'
        });
      }
    }
    
    // Extract concerns
    if (/budget|cheap|expensive|afford/i.test(lowerMessage)) {
      insights.push({
        id: this.generateId(),
        type: 'concern',
        value: 'price_sensitive',
        confidence: 0.7,
        timestamp: new Date(),
        source: 'inferred'
      });
    }
    
    if (/quality|durable|last|reliable/i.test(lowerMessage)) {
      insights.push({
        id: this.generateId(),
        type: 'preference',
        value: 'quality_focused',
        confidence: 0.7,
        timestamp: new Date(),
        source: 'inferred'
      });
    }
    
    // Add insights to context
    this.context.insights.push(...insights);
    
    return insights;
  }

  updateContext(state: ConversationState, topic?: Topic): void {
    this.context.currentState = state;
    this.context.lastActivity = new Date();
    
    if (state === ConversationState.GENERAL_CHAT) {
      this.context.generalTurns++;
    } else {
      this.context.generalTurns = 0;
    }
    
    if (topic) {
      // Add to topic stack
      this.context.topicStack.push(topic);
      
      // Keep only last 10 topics
      if (this.context.topicStack.length > 10) {
        this.context.topicStack.shift();
      }
      
      if (topic.type === 'shopping') {
        this.context.lastShoppingTopic = topic.subject;
      }
    }
  }

  updateShoppingIntent(intent: Partial<ShoppingIntent>): void {
    this.context.shoppingIntent = {
      ...this.context.shoppingIntent,
      ...intent
    };
  }

  getContext(): ConversationContext {
    return { ...this.context };
  }

  getTransitionSuggestion(): ConversationTransition | null {
    const transitions: ConversationTransition[] = [
      {
        fromState: ConversationState.GENERAL_CHAT,
        toState: ConversationState.PRODUCT_DISCOVERY,
        trigger: 'timeout',
        template: "By the way, can I help you find anything today?",
        confidence: 0.8
      },
      {
        fromState: ConversationState.GREETING,
        toState: ConversationState.PRODUCT_DISCOVERY,
        trigger: 'shopping_intent',
        template: "Great! Let me help you find the perfect {category}.",
        confidence: 0.9
      },
      {
        fromState: ConversationState.PRODUCT_DISCOVERY,
        toState: ConversationState.RECOMMENDATION,
        trigger: 'criteria_met',
        template: "Based on what you've told me, here are my recommendations:",
        confidence: 0.85
      }
    ];
    
    return transitions.find(t => 
      t.fromState === this.context.currentState
    ) || null;
  }

  incrementGeneralTurns(): void {
    this.context.generalTurns++;
  }

  resetRedirectAttempts(): void {
    this.context.redirectAttempts = 0;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}