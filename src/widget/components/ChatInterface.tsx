import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Product, CustomerProfile, ContextEvent, ConversationState, Topic } from '@shared/types';
import { ConversationManager } from '../services/conversation/ConversationManager';
import { useConversation } from '../hooks/useConversation';
import { GREETING_PROMPTS } from '@/api/lib/ai/prompts/conversational.prompts';

interface ChatInterfaceProps {
  apiKey: string;
  apiUrl?: string;
  products: Product[];
  customerProfile: CustomerProfile | null;
  contextEvents: ContextEvent[];
  onFileUpload?: (files: { products?: File; customer?: File; context?: File }) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  recommendations?: Product[];
  isRedirect?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  apiKey,
  apiUrl = '/api/v1/recommendations',
  products,
  customerProfile,
  contextEvents,
  onFileUpload: _onFileUpload,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  
  const conversationManager = useRef<ConversationManager>(new ConversationManager(sessionId));
  const {
    conversationState,
    context,
    insights,
    updateState,
    addInsight,
    addTopic,
    updateShoppingIntent,
    incrementRedirectAttempts
  } = useConversation(sessionId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize with greeting
  useEffect(() => {
    const greetingMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: GREETING_PROMPTS[Math.floor(Math.random() * GREETING_PROMPTS.length)],
      timestamp: new Date()
    };
    setMessages([greetingMessage]);
  }, []);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) {return;}

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Analyze message
      const analysis = conversationManager.current.analyzeMessage(userMessage);
      const nextState = conversationManager.current.determineNextState(analysis);
      
      // Extract insights
      const messageInsights = conversationManager.current.extractInsights(userMessage);
      messageInsights.forEach(insight => addInsight(insight));
      
      // Update conversation state
      updateState(nextState);
      
      // Add topic to stack
      if (analysis.topic) {
        const topic: Topic = {
          id: `topic-${Date.now()}`,
          type: analysis.intent === 'shopping' ? 'shopping' : 'general',
          subject: analysis.topic,
          timestamp: new Date(),
          messages: 1,
          keywords: analysis.entities
        };
        addTopic(topic);
      }
      
      // Update shopping intent if detected
      if (analysis.intent === 'shopping' || analysis.intent === 'mixed') {
        updateShoppingIntent({
          identified: true,
          category: analysis.category,
          confidence: analysis.confidence
        });
      }
      
      // Check if we should redirect
      let redirectPrompt = '';
      if (analysis.shouldRedirect && conversationManager.current.shouldRedirect()) {
        redirectPrompt = conversationManager.current.generateRedirectPrompt();
        incrementRedirectAttempts();
      }
      
      // Build request payload
      const requestPayload = {
        session_id: sessionId,
        query: userMessage,
        conversation_history: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        context: {
          current_page: window.location.pathname,
          browsing_category: analysis.category,
          session_duration: Math.floor((Date.now() - (context?.startTime.getTime() || Date.now())) / 1000),
          conversation_state: nextState,
          insights: insights
        },
        customer_data: {
          csv_hash: customerProfile ? btoa(JSON.stringify(customerProfile)).substring(0, 16) : '',
          profile_loaded: !!customerProfile,
          context_loaded: contextEvents.length > 0
        },
        products,
        customer_profile: customerProfile,
        context_events: contextEvents,
        redirect_prompt: redirectPrompt
      };
      
      // Make API call
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add assistant response
      const assistantMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.message || data.response,
        timestamp: new Date(),
        recommendations: data.recommendations,
        isRedirect: !!redirectPrompt
      };
      setMessages(prev => [...prev, assistantMsg]);
      
      // Update conversation context based on response
      if (data.nextState) {
        updateState(data.nextState as ConversationState);
      }
      
      // Update conversation manager context
      conversationManager.current.updateContext(nextState, {
        id: `topic-${Date.now()}`,
        type: analysis.intent === 'shopping' ? 'shopping' : 'general',
        subject: analysis.topic || 'general',
        timestamp: new Date(),
        messages: 1
      });
      
    } catch (error) {
      console.error('Error in conversation:', error);
      
      // Fallback response
      const fallbackMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an issue. Let me try to help you anyway. What kind of products are you interested in?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMsg]);
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
    incrementRedirectAttempts
  ]);
  
  const renderMessage = (msg: Message) => {
    if (msg.role === 'system') {
      return (
        <div
          key={msg.id}
          style={{
            textAlign: 'center',
            padding: '0.5rem',
            color: 'hsl(var(--pf-muted-foreground))',
            fontSize: '0.9rem',
            fontStyle: 'italic'
          }}
        >
          {msg.content}
        </div>
      );
    }
    
    return (
      <div key={msg.id} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
        marginBottom: '0.5rem',
        width: '100%'
      }}>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--pf-radius)',
            background: msg.role === 'user' 
              ? '#3b82f6'  // Solid blue background for user messages
              : msg.isRedirect 
                ? 'hsl(var(--pf-accent))'
                : 'hsl(var(--pf-secondary))',
            color: msg.role === 'user' 
              ? '#ffffff'  // White text for user messages
              : 'hsl(var(--pf-foreground))',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '70%',
            minWidth: '100px',
            boxSizing: 'border-box',
          }}
        >
          {msg.content}
        </div>
        
        {/* Render recommendations if present */}
        {msg.recommendations && msg.recommendations.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.5rem',
            marginTop: '0.5rem',
            marginBottom: '1rem'
          }}>
            {msg.recommendations.slice(0, 3).map((product, idx) => (
              <div
                key={`${msg.id}-rec-${idx}`}
                style={{
                  border: '1px solid hsl(var(--pf-border))',
                  borderRadius: 'calc(var(--pf-radius) - 2px)',
                  background: 'hsl(var(--pf-card))',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={() => {
                  // Handle product click
                }}
              >
                {/* Product Image */}
                {product.image_url && (
                  <div style={{
                    width: '100%',
                    height: '150px',
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
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
                  <div style={{
                    width: '100%',
                    height: '150px',
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: '#ccc'
                  }}>
                    📦
                  </div>
                )}
                
                {/* Product Details */}
                <div style={{ padding: '0.75rem' }}>
                  <h4 style={{ 
                    fontSize: '0.9rem', 
                    marginBottom: '0.25rem',
                    fontWeight: '600',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {product.name}
                  </h4>
                  <p style={{ 
                    fontSize: '1rem', 
                    color: 'hsl(var(--pf-primary))',
                    fontWeight: 'bold',
                    marginTop: '0.25rem'
                  }}>
                    ${product.price}
                  </p>
                  {product.category && (
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: 'hsl(var(--pf-muted-foreground))',
                      marginTop: '0.25rem'
                    }}>
                      {product.category}
                    </p>
                  )}
                  {'reasoning' in product && (product as any).reasoning && (
                    <p style={{ 
                      fontSize: '0.75rem', 
                      marginTop: '0.5rem',
                      color: 'hsl(var(--pf-muted-foreground))',
                      fontStyle: 'italic',
                      lineHeight: '1.3'
                    }}>
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
      [ConversationState.GREETING]: '#10b981',
      [ConversationState.GENERAL_CHAT]: '#3b82f6',
      [ConversationState.PRODUCT_DISCOVERY]: '#8b5cf6',
      [ConversationState.RECOMMENDATION]: '#f59e0b',
      [ConversationState.COMPARISON]: '#ef4444',
      [ConversationState.CHECKOUT_ASSISTANCE]: '#06b6d4'
    };
    
    const stateLabels: Record<ConversationState, string> = {
      [ConversationState.GREETING]: 'Welcome',
      [ConversationState.GENERAL_CHAT]: 'Chatting',
      [ConversationState.PRODUCT_DISCOVERY]: 'Exploring',
      [ConversationState.RECOMMENDATION]: 'Recommending',
      [ConversationState.COMPARISON]: 'Comparing',
      [ConversationState.CHECKOUT_ASSISTANCE]: 'Checkout'
    };
    
    return (
      <div style={{
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
        color: 'white',
        background: stateColors[conversationState],
        borderRadius: 'var(--pf-radius)',
        display: 'inline-block'
      }}>
        {stateLabels[conversationState]}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      position: 'relative'
    }}>
      {/* State indicator bar */}
      <div style={{
        padding: '0.5rem 1rem',
        borderBottom: '1px solid hsl(var(--pf-border))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        {renderStateIndicator()}
        {insights.length > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--pf-muted-foreground))' }}>
            {insights.length} insights gathered
          </span>
        )}
      </div>
      
      {/* Messages */}
      <div style={{ 
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: 'auto', 
        overflowX: 'hidden',
        padding: '1rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {messages.map(renderMessage)}
        {isLoading && (
          <div style={{ textAlign: 'center' }}>
            <span className="pf-spinner" style={{ width: '20px', height: '20px' }}></span>
            <p style={{ fontSize: '0.8rem', color: 'hsl(var(--pf-muted-foreground))' }}>
              Thinking...
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ 
        padding: '1rem', 
        borderTop: '1px solid hsl(var(--pf-border))',
        display: 'flex',
        gap: '0.5rem',
        flexShrink: 0
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={
            conversationState === ConversationState.GENERAL_CHAT 
              ? "Chat about anything or ask for product recommendations..."
              : "Ask me anything or tell me what you're looking for..."
          }
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.5rem',
            border: '1px solid hsl(var(--pf-border))',
            borderRadius: 'calc(var(--pf-radius) - 2px)',
            background: 'hsl(var(--pf-background))',
            color: 'hsl(var(--pf-foreground))',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="pf-btn-primary"
          style={{ padding: '0.5rem 1rem' }}
        >
          Send
        </button>
      </div>
    </div>
  );
};