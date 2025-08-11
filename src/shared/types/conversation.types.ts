export enum ConversationState {
  GREETING = 'greeting',
  GENERAL_CHAT = 'general_chat',
  PRODUCT_DISCOVERY = 'product_discovery',
  RECOMMENDATION = 'recommendation',
  COMPARISON = 'comparison',
  CHECKOUT_ASSISTANCE = 'checkout_assistance'
}

export interface ConversationContext {
  sessionId: string;
  currentState: ConversationState;
  topicStack: Topic[];
  shoppingIntent: ShoppingIntent;
  lastShoppingTopic?: string;
  redirectAttempts: number;
  generalTurns: number;
  insights: CustomerInsight[];
  startTime: Date;
  lastActivity: Date;
}

export interface Topic {
  id: string;
  type: 'shopping' | 'general';
  subject: string;
  timestamp: Date;
  messages: number;
  keywords?: string[];
}

export interface ShoppingIntent {
  identified: boolean;
  category?: string;
  priceRange?: [number, number];
  features?: string[];
  urgency: 'immediate' | 'researching' | 'browsing';
  confidence: number;
}

export interface CustomerInsight {
  id: string;
  type: 'preference' | 'need' | 'concern' | 'interest';
  value: string;
  confidence: number;
  timestamp: Date;
  source: 'explicit' | 'inferred';
}

export interface MessageAnalysis {
  intent: 'shopping' | 'general' | 'mixed';
  sentiment: 'positive' | 'neutral' | 'negative';
  topic?: string;
  category?: string;
  entities: string[];
  confidence: number;
  shouldRedirect: boolean;
}

export interface ConversationTransition {
  fromState: ConversationState;
  toState: ConversationState;
  trigger: string;
  template: string;
  confidence: number;
}

export interface ConversationMetrics {
  totalMessages: number;
  topicSwitches: number;
  redirectAttempts: number;
  insightsExtracted: number;
  recommendationsShown: number;
  engagementScore: number;
}