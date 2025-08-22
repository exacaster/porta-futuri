import { useState, useCallback, useRef, useEffect } from "react";
import {
  ConversationState,
  ConversationContext,
  CustomerInsight,
  Topic,
  ShoppingIntent,
  ConversationMetrics,
} from "@shared/types/conversation.types";

interface UseConversationReturn {
  conversationState: ConversationState;
  context: ConversationContext | null;
  metrics: ConversationMetrics;
  insights: CustomerInsight[];
  updateState: (newState: ConversationState) => void;
  addInsight: (insight: CustomerInsight) => void;
  addTopic: (topic: Topic) => void;
  updateShoppingIntent: (intent: Partial<ShoppingIntent>) => void;
  incrementRedirectAttempts: () => void;
  resetConversation: () => void;
  getTopicHistory: () => Topic[];
  getConversationSummary: () => string;
}

export function useConversation(sessionId?: string): UseConversationReturn {
  const [conversationState, setConversationState] = useState<ConversationState>(
    ConversationState.GREETING,
  );

  const [context, setContext] = useState<ConversationContext | null>(null);
  const [insights, setInsights] = useState<CustomerInsight[]>([]);
  const [metrics, setMetrics] = useState<ConversationMetrics>({
    totalMessages: 0,
    topicSwitches: 0,
    redirectAttempts: 0,
    insightsExtracted: 0,
    recommendationsShown: 0,
    engagementScore: 0,
  });

  const stateHistory = useRef<ConversationState[]>([
    ConversationState.GREETING,
  ]);
  const messageCount = useRef(0);

  // Initialize context on mount or when sessionId changes
  useEffect(() => {
    if (sessionId) {
      setContext({
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
      });
    }
  }, [sessionId]);

  const updateState = useCallback((newState: ConversationState) => {
    setConversationState(newState);
    stateHistory.current.push(newState);

    setContext((prev) => {
      if (!prev) {
        return null;
      }

      const updated = {
        ...prev,
        currentState: newState,
        lastActivity: new Date(),
      };

      // Update general turns counter
      if (newState === ConversationState.GENERAL_CHAT) {
        updated.generalTurns = prev.generalTurns + 1;
      } else {
        updated.generalTurns = 0;
      }

      return updated;
    });

    // Update metrics
    setMetrics((prev) => ({
      ...prev,
      totalMessages: messageCount.current,
    }));
  }, []);

  const addInsight = useCallback((insight: CustomerInsight) => {
    setInsights((prev) => {
      // Check if insight already exists
      const exists = prev.some(
        (i) => i.type === insight.type && i.value === insight.value,
      );

      if (!exists) {
        setMetrics((m) => ({
          ...m,
          insightsExtracted: m.insightsExtracted + 1,
        }));
        return [...prev, insight];
      }

      // Update confidence if higher
      return prev.map((i) =>
        i.type === insight.type &&
        i.value === insight.value &&
        i.confidence < insight.confidence
          ? { ...i, confidence: insight.confidence }
          : i,
      );
    });

    setContext((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        insights: [...prev.insights, insight],
      };
    });
  }, []);

  const addTopic = useCallback((topic: Topic) => {
    setContext((prev) => {
      if (!prev) {
        return null;
      }

      const updatedStack = [...prev.topicStack, topic];

      // Keep only last 10 topics
      if (updatedStack.length > 10) {
        updatedStack.shift();
      }

      const updated = {
        ...prev,
        topicStack: updatedStack,
      };

      // Update last shopping topic if applicable
      if (topic.type === "shopping") {
        updated.lastShoppingTopic = topic.subject;
      }

      return updated;
    });

    // Update metrics
    setMetrics((prev) => ({
      ...prev,
      topicSwitches: prev.topicSwitches + 1,
    }));
  }, []);

  const updateShoppingIntent = useCallback(
    (intent: Partial<ShoppingIntent>) => {
      setContext((prev) => {
        if (!prev) {
          return null;
        }

        return {
          ...prev,
          shoppingIntent: {
            ...prev.shoppingIntent,
            ...intent,
          },
        };
      });
    },
    [],
  );

  const incrementRedirectAttempts = useCallback(() => {
    setContext((prev) => {
      if (!prev) {
        return null;
      }

      return {
        ...prev,
        redirectAttempts: prev.redirectAttempts + 1,
      };
    });

    setMetrics((prev) => ({
      ...prev,
      redirectAttempts: prev.redirectAttempts + 1,
    }));
  }, []);

  const resetConversation = useCallback(() => {
    setConversationState(ConversationState.GREETING);
    stateHistory.current = [ConversationState.GREETING];
    messageCount.current = 0;
    setInsights([]);
    setMetrics({
      totalMessages: 0,
      topicSwitches: 0,
      redirectAttempts: 0,
      insightsExtracted: 0,
      recommendationsShown: 0,
      engagementScore: 0,
    });

    if (context?.sessionId) {
      setContext({
        sessionId: context.sessionId,
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
      });
    }
  }, [context?.sessionId]);

  const getTopicHistory = useCallback((): Topic[] => {
    return context?.topicStack || [];
  }, [context]);

  const getConversationSummary = useCallback((): string => {
    if (!context) {
      return "No conversation started";
    }

    const duration = Math.floor(
      (Date.now() - context.startTime.getTime()) / 1000 / 60,
    );

    const topicCount = context.topicStack.length;
    const shoppingTopics = context.topicStack.filter(
      (t) => t.type === "shopping",
    ).length;
    const generalTopics = topicCount - shoppingTopics;

    let summary = `Conversation Duration: ${duration} minutes\n`;
    summary += `Topics Discussed: ${topicCount} (${shoppingTopics} shopping, ${generalTopics} general)\n`;
    summary += `Current State: ${conversationState}\n`;

    if (context.shoppingIntent.identified) {
      summary += `Shopping Intent: ${context.shoppingIntent.category || "General"} (${context.shoppingIntent.urgency})\n`;
    }

    if (insights.length > 0) {
      summary += `Insights Gathered: ${insights.length}\n`;
      const preferences = insights.filter((i) => i.type === "preference");
      const needs = insights.filter((i) => i.type === "need");
      if (preferences.length > 0) {
        summary += `  - Preferences: ${preferences.map((p) => p.value).join(", ")}\n`;
      }
      if (needs.length > 0) {
        summary += `  - Needs: ${needs.map((n) => n.value).join(", ")}\n`;
      }
    }

    summary += `Engagement Score: ${calculateEngagementScore(metrics)}/10`;

    return summary;
  }, [context, conversationState, insights, metrics]);

  // Update message count on each call
  useEffect(() => {
    messageCount.current++;
    setMetrics((prev) => ({
      ...prev,
      totalMessages: messageCount.current,
    }));
  }, [conversationState]);

  // Calculate engagement score
  useEffect(() => {
    const score = calculateEngagementScore(metrics);
    setMetrics((prev) => ({
      ...prev,
      engagementScore: score,
    }));
  }, [metrics.totalMessages, metrics.topicSwitches, metrics.insightsExtracted]);

  return {
    conversationState,
    context,
    metrics,
    insights,
    updateState,
    addInsight,
    addTopic,
    updateShoppingIntent,
    incrementRedirectAttempts,
    resetConversation,
    getTopicHistory,
    getConversationSummary,
  };
}

function calculateEngagementScore(metrics: ConversationMetrics): number {
  let score = 0;

  // Message count contribution (max 3 points)
  score += Math.min(metrics.totalMessages / 5, 3);

  // Topic diversity contribution (max 2 points)
  score += Math.min(metrics.topicSwitches / 3, 2);

  // Insights contribution (max 3 points)
  score += Math.min(metrics.insightsExtracted / 3, 3);

  // Recommendations interaction (max 2 points)
  if (metrics.recommendationsShown > 0) {
    score += Math.min(metrics.recommendationsShown / 2, 2);
  }

  return Math.round(Math.min(score, 10) * 10) / 10;
}
