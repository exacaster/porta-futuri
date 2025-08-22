import {
  ConversationContext,
  ConversationState,
  Topic,
  MessageAnalysis,
  CustomerInsight,
} from "@shared/types/conversation.types";

export class ConversationManager {
  private context: ConversationContext;
  private readonly MAX_GENERAL_TURNS = 3;
  private readonly REDIRECT_THRESHOLD = 2;

  constructor(sessionId: string) {
    this.context = {
      sessionId,
      currentState: ConversationState.GREETING,
      topicStack: [],
      shoppingIntent: {
        identified: false,
        urgency: "browsing",
        confidence: 0,
      },
      redirectAttempts: 0,
      generalTurns: 0,
      insights: [],
      startTime: new Date(),
      lastActivity: new Date(),
    };
  }

  analyzeMessage(message: string): MessageAnalysis {
    const lowerMessage = message.toLowerCase();

    return {
      intent: this.detectIntent(lowerMessage),
      sentiment: this.analyzeSentiment(lowerMessage),
      topic: this.identifyTopic(lowerMessage),
      category: this.detectCategory(lowerMessage),
      entities: this.extractEntities(message),
      confidence: this.calculateConfidence(lowerMessage),
      shouldRedirect: this.shouldRedirect(),
    };
  }

  private detectIntent(message: string): "shopping" | "general" | "mixed" {
    const shoppingKeywords = [
      "buy",
      "purchase",
      "need",
      "looking for",
      "price",
      "cost",
    ];
    const matchCount = shoppingKeywords.filter((kw) =>
      message.includes(kw),
    ).length;

    if (matchCount >= 2) {
      return "shopping";
    }
    if (matchCount === 1) {
      return "mixed";
    }
    return "general";
  }

  private analyzeSentiment(
    message: string,
  ): "positive" | "neutral" | "negative" {
    const positive = ["love", "great", "excellent", "good", "nice"].some((w) =>
      message.includes(w),
    );
    const negative = ["hate", "bad", "terrible", "awful", "poor"].some((w) =>
      message.includes(w),
    );

    if (positive && !negative) {
      return "positive";
    }
    if (negative && !positive) {
      return "negative";
    }
    return "neutral";
  }

  private identifyTopic(message: string): string {
    const topics: Record<string, string[]> = {
      weather: ["weather", "rain", "snow", "cold", "hot"],
      travel: ["trip", "vacation", "travel", "flight"],
      technology: ["computer", "phone", "tech", "device"],
      health: ["health", "fitness", "exercise", "wellness"],
    };

    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some((kw) => message.includes(kw))) {
        return topic;
      }
    }

    return "general";
  }

  private detectCategory(message: string): string | undefined {
    const categories: Record<string, string[]> = {
      electronics: ["phone", "laptop", "computer", "tablet"],
      clothing: ["shirt", "pants", "dress", "shoes"],
      home: ["furniture", "decor", "kitchen", "bedroom"],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((kw) => message.includes(kw))) {
        return category;
      }
    }

    return undefined;
  }

  private extractEntities(message: string): string[] {
    const entities: string[] = [];

    // Extract brands
    const brands = message.match(/\b(Apple|Samsung|Nike|Sony)\b/gi);
    if (brands) {
      entities.push(...brands);
    }

    // Extract prices
    const prices = message.match(/\$\d+/g);
    if (prices) {
      entities.push(...prices);
    }

    return entities;
  }

  private calculateConfidence(message: string): number {
    // Simple confidence calculation based on message clarity
    if (message.includes("?")) {
      return 0.7;
    }
    if (message.length > 50) {
      return 0.8;
    }
    return 0.6;
  }

  determineNextState(analysis: MessageAnalysis): ConversationState {
    if (analysis.intent === "shopping") {
      return ConversationState.PRODUCT_DISCOVERY;
    }

    if (this.context.currentState === ConversationState.GREETING) {
      return ConversationState.GENERAL_CHAT;
    }

    if (this.context.generalTurns >= this.MAX_GENERAL_TURNS) {
      return ConversationState.PRODUCT_DISCOVERY;
    }

    return this.context.currentState;
  }

  shouldRedirect(): boolean {
    return (
      this.context.generalTurns >= this.MAX_GENERAL_TURNS &&
      this.context.redirectAttempts < this.REDIRECT_THRESHOLD
    );
  }

  generateRedirectPrompt(): string {
    const prompts = [
      "By the way, is there anything specific you're shopping for today?",
      "While we're chatting, feel free to ask if you need help finding any products.",
      "Speaking of which, would you like to see our latest collections?",
    ];

    this.context.redirectAttempts++;
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  extractInsights(message: string): CustomerInsight[] {
    const insights: CustomerInsight[] = [];
    const lowerMessage = message.toLowerCase();

    // Extract preferences
    if (lowerMessage.includes("love") || lowerMessage.includes("like")) {
      const match = message.match(/(?:love|like) (\w+)/i);
      if (match) {
        insights.push({
          id: `insight-${Date.now()}`,
          type: "preference",
          value: match[1],
          confidence: 0.8,
          timestamp: new Date(),
          source: "explicit",
        });
      }
    }

    // Extract needs
    if (lowerMessage.includes("need") || lowerMessage.includes("looking for")) {
      const match = message.match(/(?:need|looking for) (\w+)/i);
      if (match) {
        insights.push({
          id: `insight-${Date.now()}-2`,
          type: "need",
          value: match[1],
          confidence: 0.9,
          timestamp: new Date(),
          source: "explicit",
        });
      }
    }

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
      this.context.topicStack.push(topic);
      if (this.context.topicStack.length > 10) {
        this.context.topicStack.shift();
      }
    }
  }

  getContext(): ConversationContext {
    return { ...this.context };
  }

  incrementGeneralTurns(): void {
    this.context.generalTurns++;
  }
}
