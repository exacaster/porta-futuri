import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.15.0';

interface ContextEvent {
  timestamp: string;
  event_type: 'page_view' | 'product_view' | 'search' | 'cart_action' | 'purchase' | 'interaction';
  session_id: string;
  product_id?: string;
  category_viewed?: string;
  search_query?: string;
  cart_action?: 'add' | 'remove' | 'update_quantity';
  url?: string;
  page_url?: string;
  page_duration?: number;
  quantity?: number;
  price?: number;
  referrer?: string;
  device_type?: string;
}

interface CustomerProfile {
  customer_id?: string;
  cdp_data?: {
    cdp_available: boolean;
    last_updated?: string;
    version?: number;
    fallback_reason?: string;
    fields?: Record<string, {
      value: any;
      type: string;
      display_name?: string;
    }>;
    [key: string]: any;
  };
  age_group?: string;
  gender?: string;
  location?: string;
  purchase_history?: string;
  preferences?: string;
  lifetime_value?: number;
  segment?: string;
  last_purchase_date?: string;
  engagement_score?: number;
  [key: string]: any;
}

interface IntentAnalysisResponse {
  intent: {
    primary_interest: string;
    confidence: number;
    behavioral_signals: string[];
    customer_message: string;
    raw_analysis: string;
  };
  timestamp: string;
  session_id: string;
}

interface IntentAnalysisParams {
  browsingHistory: ContextEvent[];
  customerProfile?: CustomerProfile;
  interactionCount: number;
  sessionId: string;
}

// Simple in-memory cache for intent results
const intentCache = new Map<string, { result: IntentAnalysisResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class AIIntentService {
  private gemini: GoogleGenAI;

  constructor(apiKey: string) {
    this.gemini = new GoogleGenAI({ apiKey });
  }

  async analyzeIntent(params: IntentAnalysisParams): Promise<IntentAnalysisResponse> {
    // Check cache first
    const cacheKey = this.getCacheKey(params);
    const cached = intentCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached intent analysis');
      return cached.result;
    }

    try {
      console.log('Starting AI intent analysis for session:', params.sessionId);
      console.log('Interaction count:', params.interactionCount);
      console.log('Events to analyze:', params.browsingHistory.length);

      // Build the sophisticated prompt
      const prompt = this.buildIntentPrompt(params);
      console.log('Prompt built, length:', prompt.length);

      // Call Gemini API
      const result = await this.gemini.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.7,
          }
        }
      });

      console.log('Gemini response received');
      const responseText = result.text || '';
      
      // Parse the response
      const intentResponse = this.parseIntentResponse(responseText, params.sessionId);
      
      // Cache the result
      intentCache.set(cacheKey, {
        result: intentResponse,
        timestamp: Date.now()
      });

      // Clean old cache entries
      this.cleanCache();

      return intentResponse;
    } catch (error) {
      console.error('AI Intent analysis failed:', error);
      // Return a fallback analysis
      return this.getFallbackIntentAnalysis(params);
    }
  }

  private buildIntentPrompt(params: IntentAnalysisParams): string {
    const { browsingHistory, customerProfile, interactionCount } = params;

    return `You are an expert e-commerce behavior analyst. Analyze the following customer browsing session and provide insights about their shopping intent.

CUSTOMER PROFILE:
${this.formatCustomerProfile(customerProfile)}

BROWSING HISTORY (Most Recent First):
${this.formatBrowsingHistory(browsingHistory)}

SESSION METRICS:
- Total Interactions: ${interactionCount}
- Session Duration: ${this.calculateSessionDuration(browsingHistory)} minutes
- Unique Categories Viewed: ${this.getUniqueCategories(browsingHistory).length}
- Products Viewed: ${browsingHistory.filter(e => e.event_type === 'product_view').length}
- Searches Performed: ${browsingHistory.filter(e => e.event_type === 'search').length}
- Cart Actions: ${browsingHistory.filter(e => e.event_type === 'cart_action').length}

ANALYSIS INSTRUCTIONS:
1. Identify the PRIMARY shopping intent based on the browsing pattern
2. Calculate confidence level (0.0-1.0) based on pattern clarity
3. List 3-5 specific behavioral signals that indicate this intent
4. Create a customer-friendly message that:
   - Starts with "Based on..." to be transparent about the analysis
   - Shows understanding of their specific interests
   - Is helpful without being pushy
   - Uses natural, conversational language
   - Is 1-2 sentences maximum

IMPORTANT GUIDELINES:
- Focus on ACTUAL products/categories viewed, not assumptions
- Consider the TIME between actions (rapid clicks vs. deliberate browsing)
- Look for patterns: repeated category visits, price comparisons, feature focus
- Identify shopping stage: exploring, comparing, or ready to purchase
- Be specific about products/brands when confidence is high
- Be general about categories when pattern is unclear
- Look for intent indicators:
  * Multiple views of same product = high purchase intent
  * Viewing similar products = comparison shopping
  * Price filter usage = budget conscious
  * Quick browsing = exploring/discovery
  * Long page durations = serious consideration
  * Cart additions = purchase readiness

RESPONSE FORMAT (JSON):
{
  "primary_interest": "Clear, specific description of what they're looking for",
  "confidence": 0.0-1.0,
  "behavioral_signals": [
    "Specific signal 1",
    "Specific signal 2",
    "Specific signal 3"
  ],
  "customer_message": "Based on [specific observation], I see you're interested in [specific intent]. [Helpful follow-up]",
  "raw_analysis": "Detailed analysis for internal use"
}

Examples of good customer messages:
- "Based on your multiple views of iPhone 15 models, I see you're comparing Apple's latest phones. Would you like to see a side-by-side comparison?"
- "Based on your searches for 'gaming laptop' and views of high-performance models, I can help you find the perfect gaming machine within your budget."
- "Based on your browsing in the smartphone category, you seem to be exploring upgrade options. What features matter most to you?"
- "Based on viewing the same product 3 times today, you seem really interested in the Samsung Galaxy S24. Any questions I can answer about it?"
- "Based on adding and removing items from your cart, I sense you're weighing your options. Need help deciding?"

Return ONLY valid JSON, no additional text or markdown.`;
  }

  private formatCustomerProfile(profile?: CustomerProfile): string {
    if (!profile) {
      return 'No customer profile available';
    }

    const lines: string[] = [];
    
    if (profile.customer_id) {
      lines.push(`- Customer ID: ${profile.customer_id}`);
    }

    // Handle CDP data if present
    if (profile.cdp_data?.fields) {
      Object.entries(profile.cdp_data.fields).forEach(([key, fieldData]) => {
        if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
          const displayName = fieldData.display_name || this.humanizeFieldName(key);
          if (fieldData.value !== null && fieldData.value !== undefined) {
            lines.push(`- ${displayName}: ${fieldData.value}`);
          }
        }
      });
    } else {
      // Fallback to legacy fields
      if (profile.age_group) lines.push(`- Age Group: ${profile.age_group}`);
      if (profile.gender) lines.push(`- Gender: ${profile.gender}`);
      if (profile.location) lines.push(`- Location: ${profile.location}`);
      if (profile.preferences) lines.push(`- Preferences: ${profile.preferences}`);
      if (profile.segment) lines.push(`- Customer Segment: ${profile.segment}`);
    }

    return lines.length > 0 ? lines.join('\n') : 'Basic profile only';
  }

  private formatBrowsingHistory(events: ContextEvent[]): string {
    // Sort by timestamp (most recent first)
    const sortedEvents = [...events].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return sortedEvents.slice(0, 20).map((event, index) => {
      const time = new Date(event.timestamp);
      const timeStr = time.toLocaleTimeString();
      
      let description = `${index + 1}. [${timeStr}] `;
      
      switch (event.event_type) {
        case 'page_view':
          description += `Viewed page: ${event.page_url || event.url || 'unknown'}`;
          if (event.category_viewed) {
            description += ` (Category: ${event.category_viewed})`;
          }
          if (event.page_duration) {
            description += ` - Duration: ${event.page_duration}s`;
          }
          break;
        
        case 'product_view':
          description += `Viewed product: ${event.product_id}`;
          if (event.category_viewed) {
            description += ` in ${event.category_viewed}`;
          }
          if (event.price) {
            description += ` ($${event.price})`;
          }
          break;
        
        case 'search':
          description += `Searched for: "${event.search_query}"`;
          break;
        
        case 'cart_action':
          description += `Cart: ${event.cart_action} ${event.product_id}`;
          if (event.quantity) {
            description += ` (qty: ${event.quantity})`;
          }
          if (event.price) {
            description += ` ($${event.price})`;
          }
          break;
        
        case 'purchase':
          description += `Purchased: ${event.product_id}`;
          break;
        
        default:
          description += `${event.event_type}: ${JSON.stringify(event)}`;
      }
      
      return description;
    }).join('\n');
  }

  private calculateSessionDuration(events: ContextEvent[]): number {
    if (events.length < 2) return 0;
    
    const timestamps = events.map(e => new Date(e.timestamp).getTime());
    const duration = Math.max(...timestamps) - Math.min(...timestamps);
    return Math.round(duration / 60000); // Convert to minutes
  }

  private getUniqueCategories(events: ContextEvent[]): string[] {
    const categories = new Set<string>();
    events.forEach(e => {
      if (e.category_viewed) {
        categories.add(e.category_viewed);
      }
    });
    return Array.from(categories);
  }

  private humanizeFieldName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private parseIntentResponse(responseText: string, sessionId: string): IntentAnalysisResponse {
    try {
      // Clean the response text
      let cleanedResponse = responseText;
      cleanedResponse = cleanedResponse.replace(/```json\s*/gi, '');
      cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
      
      // Extract JSON
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        intent: {
          primary_interest: parsed.primary_interest || 'General browsing',
          confidence: parsed.confidence || 0.5,
          behavioral_signals: parsed.behavioral_signals || [],
          customer_message: parsed.customer_message || 'Based on your browsing, I can help you find what you need.',
          raw_analysis: parsed.raw_analysis || responseText
        },
        timestamp: new Date().toISOString(),
        session_id: sessionId
      };
    } catch (error) {
      console.error('Failed to parse intent response:', error);
      throw error;
    }
  }

  private getFallbackIntentAnalysis(params: IntentAnalysisParams): IntentAnalysisResponse {
    const { browsingHistory, sessionId } = params;
    
    // Simple fallback analysis based on most common patterns
    const categories = this.getUniqueCategories(browsingHistory);
    const productViews = browsingHistory.filter(e => e.event_type === 'product_view');
    const searches = browsingHistory.filter(e => e.event_type === 'search');
    const cartActions = browsingHistory.filter(e => e.event_type === 'cart_action');
    
    let primaryInterest = 'General browsing';
    let confidence = 0.3;
    let customerMessage = 'Based on your browsing, I can help you find what you need.';
    const signals: string[] = [];

    if (cartActions.length > 0) {
      primaryInterest = 'Purchase consideration';
      confidence = 0.7;
      customerMessage = 'Based on your cart activity, you seem close to making a decision. Any questions?';
      signals.push(`${cartActions.length} cart interactions`);
    } else if (searches.length > 0) {
      const lastSearch = searches[0].search_query;
      primaryInterest = `Searching for ${lastSearch}`;
      confidence = 0.6;
      customerMessage = `Based on your search for "${lastSearch}", let me help you find the perfect match.`;
      signals.push(`${searches.length} searches performed`);
    } else if (productViews.length >= 2) {
      primaryInterest = 'Product comparison';
      confidence = 0.5;
      customerMessage = 'Based on the products you\'ve viewed, I can help you compare options.';
      signals.push(`${productViews.length} products viewed`);
    } else if (categories.length > 0) {
      primaryInterest = `Browsing ${categories[0]}`;
      confidence = 0.4;
      customerMessage = `Based on your interest in ${categories[0]}, here are some recommendations.`;
      signals.push(`Focus on ${categories[0]} category`);
    }

    // Add more signals
    if (browsingHistory.length > 0) {
      signals.push(`${browsingHistory.length} total interactions`);
    }
    if (categories.length > 1) {
      signals.push(`Viewed ${categories.length} different categories`);
    }

    return {
      intent: {
        primary_interest: primaryInterest,
        confidence: confidence,
        behavioral_signals: signals,
        customer_message: customerMessage,
        raw_analysis: 'Fallback analysis used due to AI service unavailability'
      },
      timestamp: new Date().toISOString(),
      session_id: sessionId
    };
  }

  private getCacheKey(params: IntentAnalysisParams): string {
    // Create a cache key based on session and event count
    const eventTypes = params.browsingHistory
      .map(e => e.event_type)
      .sort()
      .join(',');
    return `${params.sessionId}_${params.browsingHistory.length}_${eventTypes}`;
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of intentCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        intentCache.delete(key);
      }
    }
  }
}