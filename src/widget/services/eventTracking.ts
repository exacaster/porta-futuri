import { ContextEvent, EventType } from '@shared/types/context.types';
import { CustomerProfile } from '../types/widget.types';

export interface BrowsingIntent {
  intent: string;
  confidence: number;
  signals: string[];
  suggestedMessage?: string;
}

export class EventTrackingService {
  private events: ContextEvent[] = [];
  private maxEvents = 50;
  private sessionId: string;
  private listeners: Set<(events: ContextEvent[]) => void> = new Set();
  private interactionCount = 0;
  private currentIntent: BrowsingIntent | null = null;
  private lastAIAnalysisTime = 0;
  
  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.loadFromStorage();
    this.setupListeners();
  }
  
  private setupListeners() {
    // Listen for postMessage events (for iframe scenarios)
    window.addEventListener('message', this.handleParentMessage);
    
    // Listen for custom events (for direct embedding)
    window.addEventListener('porta-futuri-page-view', this.handleCustomEvent as EventListener);
  }
  
  private handleParentMessage = (event: MessageEvent) => {
    if (event.data.type === 'porta-futuri-page-view') {
      this.trackPageView(event.data.url, event.data.title);
    }
  };
  
  private handleCustomEvent = (event: CustomEvent) => {
    if (event.detail?.url) {
      this.trackPageView(event.detail.url, event.detail.title);
    }
  };
  
  trackPageView(url: string, _title?: string) {
    const event: ContextEvent = {
      timestamp: new Date().toISOString(),
      event_type: 'page_view' as EventType,
      page_url: url,
      session_id: this.sessionId,
      category_viewed: this.extractCategoryFromUrl(url)
    };
    
    this.addEvent(event);
    this.interactionCount++;
  }
  
  trackProductView(productId: string, category?: string, price?: number) {
    const event: ContextEvent = {
      timestamp: new Date().toISOString(),
      event_type: 'product_view' as EventType,
      product_id: productId,
      category_viewed: category,
      price: price,
      session_id: this.sessionId,
      page_url: window.location.pathname
    };
    
    this.addEvent(event);
    this.interactionCount++;
  }
  
  trackSearch(query: string) {
    const event: ContextEvent = {
      timestamp: new Date().toISOString(),
      event_type: 'search' as EventType,
      search_query: query,
      session_id: this.sessionId,
      page_url: window.location.pathname
    };
    
    this.addEvent(event);
    this.interactionCount++;
  }
  
  trackCartAction(productId: string, action: 'add' | 'remove' | 'update_quantity', quantity?: number, price?: number) {
    const event: ContextEvent = {
      timestamp: new Date().toISOString(),
      event_type: 'cart_action' as EventType,
      product_id: productId,
      cart_action: action,
      quantity: quantity,
      price: price,
      session_id: this.sessionId,
      page_url: window.location.pathname
    };
    
    this.addEvent(event);
    this.interactionCount++;
  }
  
  private extractCategoryFromUrl(url: string): string | undefined {
    const match = url.match(/\/([^\/]+)\/[^\/]+$/);
    return match ? match[1] : undefined;
  }
  
  private addEvent(event: ContextEvent) {
    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }
    
    this.persist();
    this.notifyListeners();
  }
  
  private persist() {
    try {
      sessionStorage.setItem('porta_futuri_browsing_history', JSON.stringify(this.events));
    } catch (e) {
      console.warn('Failed to persist browsing history:', e);
    }
  }
  
  private loadFromStorage() {
    try {
      const stored = sessionStorage.getItem('porta_futuri_browsing_history');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load browsing history:', e);
    }
  }
  
  getEvents(): ContextEvent[] {
    return this.events;
  }
  
  clearHistory() {
    this.events = [];
    sessionStorage.removeItem('porta_futuri_browsing_history');
    this.notifyListeners();
  }
  
  addListener(listener: (events: ContextEvent[]) => void) {
    this.listeners.add(listener);
  }
  
  removeListener(listener: (events: ContextEvent[]) => void) {
    this.listeners.delete(listener);
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.events));
  }
  
  analyzeIntent(): BrowsingIntent | null {
    if (this.events.length < 3) return null;
    
    const categories = this.events
      .map(e => e.category_viewed)
      .filter(Boolean) as string[];
    
    const products = this.events
      .filter(e => e.event_type === 'product_view')
      .map(e => e.product_id)
      .filter(Boolean) as string[];
    
    const searches = this.events
      .filter(e => e.event_type === 'search')
      .map(e => e.search_query)
      .filter(Boolean) as string[];
    
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantCategory = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (categories.filter(c => c === 'smartphones').length >= 3) {
      return {
        intent: 'smartphone_shopping',
        confidence: 0.85,
        signals: [
          'Multiple smartphone views',
          'Category focus on smartphones',
          `${categories.filter(c => c === 'smartphones').length} smartphone-related pages viewed`
        ],
        suggestedMessage: "I noticed you're exploring our smartphone selection. Would you like help finding the perfect phone for your needs?"
      };
    }
    
    if (products.some(p => p?.toLowerCase().includes('iphone')) && products.length >= 2) {
      return {
        intent: 'iphone_interest',
        confidence: 0.90,
        signals: [
          'iPhone product views',
          'Apple ecosystem interest',
          `${products.filter(p => p?.toLowerCase().includes('iphone')).length} iPhone products viewed`
        ],
        suggestedMessage: "Looking at iPhones? I can help you compare models and find the best deal!"
      };
    }
    
    if (categories.filter(c => c === 'electronics').length >= 3) {
      return {
        intent: 'electronics_browsing',
        confidence: 0.75,
        signals: [
          'Multiple electronics category views',
          'General electronics interest',
          `${categories.filter(c => c === 'electronics').length} electronics pages viewed`
        ],
        suggestedMessage: "I see you're browsing our electronics. Can I help you find something specific?"
      };
    }
    
    if (searches.length >= 2) {
      const lastSearch = searches[0];
      return {
        intent: 'active_searching',
        confidence: 0.80,
        signals: [
          'Multiple search queries',
          `Recent search: "${lastSearch}"`,
          `${searches.length} searches performed`
        ],
        suggestedMessage: `Still searching for "${lastSearch}"? Let me help you find exactly what you're looking for!`
      };
    }
    
    const cartActions = this.events.filter(e => e.event_type === 'cart_action');
    if (cartActions.length >= 2) {
      return {
        intent: 'purchase_consideration',
        confidence: 0.85,
        signals: [
          'Multiple cart interactions',
          'Purchase intent detected',
          `${cartActions.filter(e => e.cart_action === 'add').length} items added to cart`
        ],
        suggestedMessage: "Building your cart? I can suggest complementary items or help you find better deals!"
      };
    }
    
    if (dominantCategory && dominantCategory[1] >= 3) {
      return {
        intent: 'category_exploration',
        confidence: 0.70,
        signals: [
          `Focus on ${dominantCategory[0]}`,
          `${dominantCategory[1]} views in this category`,
          'Category-specific browsing pattern'
        ],
        suggestedMessage: `Exploring ${dominantCategory[0]}? I can recommend our top-rated products in this category!`
      };
    }
    
    return null;
  }

  getInteractionCount(): number {
    return this.interactionCount;
  }

  async analyzeIntentWithAI(
    apiKey: string,
    customerProfile?: CustomerProfile
  ): Promise<BrowsingIntent | null> {
    console.log('[AI Intent] Starting analysis. Interaction count:', this.interactionCount);
    
    // Only analyze after 3-5 interactions
    if (this.interactionCount < 3) {
      console.log('[AI Intent] Not enough interactions yet (need 3, have', this.interactionCount, ')');
      return this.currentIntent; // Return cached intent
    }
    
    // Analyze every 3 interactions
    if (this.interactionCount % 3 !== 0) {
      console.log('[AI Intent] Not at 3-interaction interval');
      return this.currentIntent;
    }

    // Prevent too frequent API calls (minimum 30 seconds between calls)
    const now = Date.now();
    if (now - this.lastAIAnalysisTime < 30000) {
      console.log('[AI Intent] Too soon since last analysis (wait 30s)');
      return this.currentIntent;
    }

    try {
      // Get the Supabase URL from environment or widget config
      const supabaseUrl = (window as any).PortaFuturi?.supabaseUrl || 
                         (window as any).env?.REACT_APP_SUPABASE_URL || 
                         'https://rvlbbgdkgneobvlyawix.supabase.co';
      
      const API_URL = `${supabaseUrl}/functions/v1/intent-analysis`;
      
      console.log('Calling AI intent analysis API:', API_URL);
      console.log('Interaction count:', this.interactionCount);
      console.log('Events to analyze:', this.events.length);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          browsing_history: this.events,
          customer_profile: customerProfile,
          interaction_count: this.interactionCount,
        }),
      });

      if (!response.ok) {
        console.error('AI intent analysis failed:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        
        // Fall back to rule-based analysis
        return this.analyzeIntent();
      }

      const data = await response.json();
      console.log('AI intent analysis successful:', data);

      // Format the response for the UI
      const formattedIntent: BrowsingIntent = {
        intent: data.intent.primary_interest,
        confidence: data.intent.confidence,
        signals: data.intent.behavioral_signals || [],
        suggestedMessage: data.intent.customer_message
      };

      // Cache the intent
      this.currentIntent = formattedIntent;
      this.lastAIAnalysisTime = now;

      return formattedIntent;
    } catch (error) {
      console.error('AI intent analysis error:', error);
      // Fall back to rule-based analysis
      return this.analyzeIntent();
    }
  }
  
  destroy() {
    window.removeEventListener('message', this.handleParentMessage);
    window.removeEventListener('porta-futuri-page-view', this.handleCustomEvent as EventListener);
    this.listeners.clear();
  }
}