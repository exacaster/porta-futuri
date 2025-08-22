import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Product,
  CustomerProfile,
  ContextEvent,
  ConversationState,
  Topic,
} from "@shared/types";
import { ConversationManager } from "../services/conversation/ConversationManager";
import { useConversation } from "../hooks/useConversation";
import { useLanguage } from "../hooks/useLanguage";

interface ChatInterfaceProps {
  apiKey: string;
  apiUrl?: string;
  products: Product[];
  customerProfile: CustomerProfile | null;
  contextEvents: ContextEvent[];
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

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  recommendations?: Product[];
  isRedirect?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  apiKey,
  apiUrl = "/api/v1/recommendations",
  products,
  customerProfile,
  contextEvents,
  onFileUpload: _onFileUpload,
  navigation,
}) => {
  // Load messages from sessionStorage on mount
  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = sessionStorage.getItem('porta_futuri_chat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
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
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  const { t } = useLanguage();

  const conversationManager = useRef<ConversationManager>(
    new ConversationManager(sessionId),
  );
  const {
    conversationState,
    context,
    insights,
    updateState,
    addInsight,
    addTopic,
    updateShoppingIntent,
    incrementRedirectAttempts,
  } = useConversation(sessionId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting only if no existing messages
  useEffect(() => {
    if (messages.length === 0) {
      const greetingMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: t("greeting"), // This will return a random greeting in the current language
        timestamp: new Date(),
      };
      setMessages([greetingMessage]);
    }
  }, [t]); // Remove messages from dependency to avoid re-triggering

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem('porta_futuri_chat_messages', JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleProductClick = useCallback((productId: string) => {
    // Build the product URL from config
    const productUrlPattern = navigation?.productUrlPattern || '/product/{id}';
    const productUrl = productUrlPattern.replace('{id}', productId);
    const baseUrl = navigation?.baseUrl || 'http://localhost:3002';
    const fullUrl = `${baseUrl}${productUrl}`;
    
    // Check if we're in iframe
    if (window.parent !== window) {
      // Send message to parent window
      window.parent.postMessage({
        type: 'porta-futuri-navigation',
        action: 'navigate-to-product',
        productId: productId,
        url: productUrl
      }, '*');
    } else {
      // If not in iframe, open in new tab or same window based on config
      const openInNewTab = navigation?.openInNewTab !== false; // default true
      if (openInNewTab) {
        window.open(fullUrl, '_blank');
      } else {
        window.location.href = fullUrl;
      }
    }
    
    // Track the click event
    if ((window as any).PortaFuturi?.trackEvent) {
      (window as any).PortaFuturi.trackEvent('product_click', {
        product_id: productId,
        source: 'recommendation_card'
      });
    }
  }, [navigation]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input.trim();
    setInput("");

    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Analyze message
      const analysis = conversationManager.current.analyzeMessage(userMessage);
      const nextState =
        conversationManager.current.determineNextState(analysis);

      // Extract insights
      const messageInsights =
        conversationManager.current.extractInsights(userMessage);
      messageInsights.forEach((insight) => addInsight(insight));

      // Update conversation state
      updateState(nextState);

      // Add topic to stack
      if (analysis.topic) {
        const topic: Topic = {
          id: `topic-${Date.now()}`,
          type: analysis.intent === "shopping" ? "shopping" : "general",
          subject: analysis.topic,
          timestamp: new Date(),
          messages: 1,
          keywords: analysis.entities,
        };
        addTopic(topic);
      }

      // Update shopping intent if detected
      if (analysis.intent === "shopping" || analysis.intent === "mixed") {
        updateShoppingIntent({
          identified: true,
          category: analysis.category,
          confidence: analysis.confidence,
        });
      }

      // Check if we should redirect
      let redirectPrompt = "";
      if (
        analysis.shouldRedirect &&
        conversationManager.current.shouldRedirect()
      ) {
        redirectPrompt = conversationManager.current.generateRedirectPrompt();
        incrementRedirectAttempts();
      }

      // Build request payload
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
        },
        customer_data: {
          csv_hash: customerProfile
            ? btoa(JSON.stringify(customerProfile)).substring(0, 16)
            : "",
          profile_loaded: !!customerProfile,
          context_loaded: contextEvents.length > 0,
        },
        products,
        customer_profile: customerProfile,
        context_events: contextEvents,
        redirect_prompt: redirectPrompt,
      };

      // Make API call
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Session-ID": sessionId,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response
      const assistantMsg: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: data.message || data.response,
        timestamp: new Date(),
        recommendations: data.recommendations,
        isRedirect: !!redirectPrompt,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Update conversation context based on response
      if (data.nextState) {
        updateState(data.nextState as ConversationState);
      }

      // Update conversation manager context
      conversationManager.current.updateContext(nextState, {
        id: `topic-${Date.now()}`,
        type: analysis.intent === "shopping" ? "shopping" : "general",
        subject: analysis.topic || "general",
        timestamp: new Date(),
        messages: 1,
      });
    } catch (error) {
      console.error("Error in conversation:", error);

      // Fallback response
      const fallbackMsg: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: t("chat.errorMessage"),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [
    input,
    isLoading,
    sessionId,
    messages,
    apiKey,
    apiUrl,
    products,
    customerProfile,
    contextEvents,
    context,
    insights,
    updateState,
    addInsight,
    addTopic,
    updateShoppingIntent,
    incrementRedirectAttempts,
    t,
  ]);

  const renderMessage = (msg: Message) => {
    if (msg.role === "system") {
      return (
        <div
          key={msg.id}
          style={{
            textAlign: "center",
            padding: "0.5rem",
            color: "hsl(var(--pf-muted-foreground))",
            fontSize: "0.9rem",
            fontStyle: "italic",
          }}
        >
          {msg.content}
        </div>
      );
    }

    return (
      <div
        key={msg.id}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: msg.role === "user" ? "flex-end" : "flex-start",
          marginBottom: "0.5rem",
          width: "100%",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderRadius:
              msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            background:
              msg.role === "user"
                ? "linear-gradient(135deg, #10a37f 0%, #0ea570 100%)"
                : msg.isRedirect
                  ? "#fff3cd"
                  : "white",
            color:
              msg.role === "user"
                ? "white"
                : msg.isRedirect
                  ? "#856404"
                  : "#0d0d0d",
            border: msg.role === "user" ? "none" : "1px solid #e5e5e7",
            boxShadow:
              msg.role === "user"
                ? "0 2px 5px rgba(16, 163, 127, 0.2)"
                : "0 1px 2px rgba(0, 0, 0, 0.05)",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            maxWidth: "70%",
            minWidth: "100px",
            boxSizing: "border-box",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          {msg.content}
        </div>

        {/* Render recommendations if present */}
        {msg.recommendations && msg.recommendations.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.5rem",
              marginTop: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            {msg.recommendations.slice(0, 3).map((product, idx) => (
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
                }}
                onClick={() => handleProductClick((product as any).id || (product as any).product_id)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Product Image */}
                {product.image_url && (
                  <div
                    style={{
                      width: "100%",
                      height: "150px",
                      background: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).style.display = "none";
                        const parent = (e.target as HTMLImageElement)
                          .parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div style="
                              width: 100%;
                              height: 100%;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              color: #999;
                              font-size: 0.8rem;
                            ">
                              📱
                            </div>
                          `;
                        }
                      }}
                    />
                  </div>
                )}
                {/* If no image, show placeholder */}
                {!product.image_url && (
                  <div
                    style={{
                      width: "100%",
                      height: "150px",
                      background: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2rem",
                      color: "#ccc",
                    }}
                  >
                    📦
                  </div>
                )}

                {/* Product Details */}
                <div style={{ padding: "0.75rem" }}>
                  <h4
                    style={{
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                      fontWeight: "600",
                      lineHeight: "1.2",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
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
                  </h4>
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "hsl(var(--pf-primary))",
                      fontWeight: "bold",
                      marginTop: "0.25rem",
                    }}
                  >
                    ${product.price}
                  </p>
                  {product.category && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "hsl(var(--pf-muted-foreground))",
                        marginTop: "0.25rem",
                      }}
                    >
                      {product.category}
                    </p>
                  )}
                  {"reasoning" in product && (product as any).reasoning && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        marginTop: "0.5rem",
                        color: "hsl(var(--pf-muted-foreground))",
                        fontStyle: "italic",
                        lineHeight: "1.3",
                      }}
                    >
                      {String((product as any).reasoning)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Add state indicator
  const renderStateIndicator = () => {
    const stateColors: Record<ConversationState, string> = {
      [ConversationState.GREETING]: "#10b981",
      [ConversationState.GENERAL_CHAT]: "#3b82f6",
      [ConversationState.PRODUCT_DISCOVERY]: "#8b5cf6",
      [ConversationState.RECOMMENDATION]: "#f59e0b",
      [ConversationState.COMPARISON]: "#ef4444",
      [ConversationState.CHECKOUT_ASSISTANCE]: "#06b6d4",
    };

    const stateLabels: Record<ConversationState, string> = {
      [ConversationState.GREETING]: t("chat.stateWelcome"),
      [ConversationState.GENERAL_CHAT]: t("chat.stateChatting"),
      [ConversationState.PRODUCT_DISCOVERY]: t("chat.stateExploring"),
      [ConversationState.RECOMMENDATION]: t("chat.stateRecommending"),
      [ConversationState.COMPARISON]: t("chat.stateComparing"),
      [ConversationState.CHECKOUT_ASSISTANCE]: t("chat.stateCheckout"),
    };

    return (
      <div
        style={{
          padding: "0.25rem 0.5rem",
          fontSize: "0.75rem",
          color: "white",
          background: stateColors[conversationState],
          borderRadius: "var(--pf-radius)",
          display: "inline-block",
        }}
      >
        {stateLabels[conversationState]}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
      }}
    >
      {/* State indicator bar */}
      <div
        style={{
          padding: "0.5rem 1rem",
          borderBottom: "1px solid hsl(var(--pf-border))",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {renderStateIndicator()}
        {insights.length > 0 && (
          <span
            style={{
              fontSize: "0.75rem",
              color: "hsl(var(--pf-muted-foreground))",
            }}
          >
            {insights.length} {t("chat.insightsGathered")}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "1rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10a37f",
                  animation: "pf-bounce 1.4s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10a37f",
                  animation: "pf-bounce 1.4s ease-in-out 0.2s infinite",
                }}
              />
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10a37f",
                  animation: "pf-bounce 1.4s ease-in-out 0.4s infinite",
                }}
              />
            </div>
            <p style={{ fontSize: "0.8rem", color: "#6e6e80", margin: 0 }}>
              {t("chat.thinking")}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "1rem",
          borderTop: "1px solid hsl(var(--pf-border))",
          display: "flex",
          gap: "0.5rem",
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder={
            conversationState === ConversationState.GENERAL_CHAT
              ? t("chat.placeholderGeneral")
              : t("chat.placeholder")
          }
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid #e5e5e7",
            borderRadius: "8px",
            background: "white",
            color: "#0d0d0d",
            fontSize: "14px",
            transition: "border-color 0.2s",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#10a37f";
            e.currentTarget.style.boxShadow =
              "0 0 0 3px rgba(16, 163, 127, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e5e5e7";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={{
            padding: "10px 20px",
            background:
              isLoading || !input.trim()
                ? "#e5e5e7"
                : "linear-gradient(135deg, #10a37f 0%, #0ea570 100%)",
            color: isLoading || !input.trim() ? "#6e6e80" : "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isLoading && input.trim()) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.07)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {t("chat.send")}
        </button>
      </div>
    </div>
  );
};
