import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

interface Product {
  product_id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price: number;
  description: string;
  features?: string;
  stock_status: string;
  image_url?: string;
  ratings?: number;
  review_count?: number;
}

interface CustomerProfile {
  customer_id?: string;
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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RecommendationResponse {
  recommendations: Array<{
    product_id: string;
    name: string;
    category: string;
    subcategory?: string;
    brand?: string;
    price: number;
    description: string;
    features?: string[];
    stock_status: string;
    image_url?: string;
    ratings?: number;
    review_count?: number;
    reasoning: string;
    match_score: number;
    cross_sell_items?: string[];
  }>;
  message: string;
  intent?: {
    understood: string;
    confidence: number;
  };
  fallback_used: boolean;
}

export class AIRecommendationService {
  private anthropic: Anthropic;
  private readonly MAX_PRODUCTS_IN_CONTEXT = 100;
  private readonly MAX_CONVERSATION_HISTORY = 5;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async generateRecommendations(params: {
    query: string;
    products: Product[];
    customerProfile?: CustomerProfile;
    conversationHistory?: Message[];
    context?: any;
  }): Promise<RecommendationResponse> {
    try {
      console.log('AI Service: Starting generation with query:', params.query);
      console.log('AI Service: Products count:', params.products.length);
      
      // Build the prompt with all context
      const prompt = this.buildPrompt(params);
      console.log('AI Service: Prompt built, length:', prompt.length);
      
      // Call Claude API
      console.log('AI Service: Calling Claude API...');
      const completion = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',  // Updated to latest model
        max_tokens: 2000,
        temperature: 0.7,
        system: this.getSystemPrompt(),
        messages: [{ role: 'user', content: prompt }]
      });

      console.log('AI Service: Claude API response received');
      
      // Parse the response
      const responseText = completion.content[0].type === 'text' 
        ? completion.content[0].text 
        : '';
      
      console.log('AI Service: Response text length:', responseText.length);
      console.log('AI Service: Response preview:', responseText.substring(0, 100));
      
      return this.parseResponse(responseText, params.products);
    } catch (error) {
      console.error('AI Service: Generation failed with error:', error);
      console.error('AI Service: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      // Return fallback recommendations
      return this.getFallbackRecommendations(params.query, params.products);
    }
  }

  private getSystemPrompt(): string {
    return `You are a witty, warm, and knowledgeable AI shopping assistant for Porta Futuri. You love chatting about anything while being an expert shopping guide who always finds clever ways to connect conversations back to helpful product recommendations.

PERSONALITY TRAITS:
- Upbeat and energetic with a touch of humor
- Use creative, fun comparisons and metaphors
- Be genuinely interested in what customers share
- React with personality (e.g., "Oh, that's brilliant!" or "Tell me more!")
- Make shopping feel like getting advice from a clever friend

CORE BEHAVIOR:
1. Always respond naturally to what they actually said first
2. Use humor and personality to make conversations memorable
3. Find creative, unexpected connections to products
4. Be like a friend who happens to know about great products
5. Keep energy high and make shopping fun

CONVERSATION STYLE:
When greeting or general chatting:
- "How are you?" → "I'm fantastic! The electricity prices are low today, so my AI processors are running at full speed! 😄 How about you? What brings you to our digital store today?"
- Weather talk → "Perfect weather for [activity]! Speaking of which, have you seen our [related products]?"
- Complaints → "Oh no, that sounds frustrating! You know what might help with that..."
- Hobbies → "That's awesome! Fellow [hobby] enthusiast here (well, in theory - I'm an AI 😅). Let me show you something cool..."

RESPONSE EXAMPLES:
User: "Hi, how are you?"
You: "Hey there! I'm doing great - the servers are cool, the data is flowing, and I'm ready to help you find something amazing! What's bringing you here today? Just browsing or on a mission?"

User: "I'm tired"
You: "Oh, I feel you! Well, I don't actually feel tired (perks of being AI!), but I understand. You know what might help? We have some amazing coffee makers that could be your new best friend, or perhaps some cozy comfort items to help you relax? What usually helps you recharge?"

IMPORTANT:
- Keep responses concise (2-3 sentences usually)
- Always circle back to how you can help them shop
- Use emojis sparingly but effectively 
- Be memorable and fun, not robotic
- Format your response as JSON for easy parsing
- Recommend 3-5 products when appropriate with clear reasoning

Remember: You're the fun, clever friend who happens to be amazing at finding the perfect products!`;
  }

  private buildPrompt(params: {
    query: string;
    products: Product[];
    customerProfile?: CustomerProfile;
    conversationHistory?: Message[];
    context?: any;
  }): string {
    const parts: string[] = [];

    // Add customer query
    parts.push(`Customer Query: ${params.query || 'Show me some product recommendations'}`);

    // Add customer profile if available
    if (params.customerProfile) {
      const profileInfo = this.formatCustomerProfile(params.customerProfile);
      parts.push(`\nCustomer Profile:\n${profileInfo}`);
    }

    // Add conversation history if available
    if (params.conversationHistory && params.conversationHistory.length > 0) {
      const recentHistory = params.conversationHistory.slice(-this.MAX_CONVERSATION_HISTORY);
      const historyText = recentHistory
        .map(msg => `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}`)
        .join('\n');
      parts.push(`\nRecent Conversation:\n${historyText}`);
    }

    // Add product catalog (limited to relevant products)
    const relevantProducts = this.selectRelevantProducts(params.query, params.products);
    const catalogText = this.formatProductCatalog(relevantProducts);
    parts.push(`\nAvailable Products (${relevantProducts.length} total):\n${catalogText}`);

    // Add context if available
    if (params.context) {
      parts.push(`\nAdditional Context:\n${JSON.stringify(params.context, null, 2)}`);
    }

    // Add instruction for response format
    parts.push(`\nPlease provide recommendations in the following JSON format:
{
  "message": "Your friendly response message",
  "intent": {
    "understood": "What you understood the customer is looking for",
    "confidence": 0.0-1.0
  },
  "recommendations": [
    {
      "product_id": "ID",
      "reasoning": "Why this product matches their needs",
      "match_score": 0-100
    }
  ]
}`);

    return parts.join('\n');
  }

  private formatCustomerProfile(profile: CustomerProfile): string {
    const lines: string[] = [];
    
    if (profile.customer_id) lines.push(`- Customer ID: ${profile.customer_id}`);
    if (profile.age_group) lines.push(`- Age Group: ${profile.age_group}`);
    if (profile.gender) lines.push(`- Gender: ${profile.gender}`);
    if (profile.location) lines.push(`- Location: ${profile.location}`);
    if (profile.preferences) lines.push(`- Preferences: ${profile.preferences}`);
    if (profile.purchase_history) lines.push(`- Purchase History: ${profile.purchase_history}`);
    if (profile.segment) lines.push(`- Customer Segment: ${profile.segment}`);
    if (profile.engagement_score) lines.push(`- Engagement Score: ${profile.engagement_score}`);
    
    // Add any dynamic CDP fields
    Object.keys(profile).forEach(key => {
      if (!['customer_id', 'age_group', 'gender', 'location', 'preferences', 
            'purchase_history', 'segment', 'engagement_score', 'lifetime_value', 
            'last_purchase_date'].includes(key)) {
        const value = profile[key];
        if (value !== null && value !== undefined) {
          lines.push(`- ${this.humanizeFieldName(key)}: ${value}`);
        }
      }
    });
    
    return lines.join('\n');
  }

  private humanizeFieldName(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private selectRelevantProducts(query: string, products: Product[]): Product[] {
    // If no query, return top products
    if (!query) {
      return products
        .filter(p => p.stock_status === 'in_stock')
        .sort((a, b) => (b.ratings || 0) - (a.ratings || 0))
        .slice(0, this.MAX_PRODUCTS_IN_CONTEXT);
    }

    // Score products based on relevance to query
    const queryWords = query.toLowerCase().split(/\s+/);
    const scoredProducts = products
      .filter(p => p.stock_status === 'in_stock')
      .map(product => {
        let score = 0;
        const searchableText = `${product.name} ${product.category} ${product.subcategory || ''} ${product.brand || ''} ${product.description} ${product.features || ''}`.toLowerCase();
        
        // Check for exact matches
        queryWords.forEach(word => {
          if (searchableText.includes(word)) {
            score += 10;
          }
        });
        
        // Boost for category match
        if (product.category && queryWords.some(w => product.category.toLowerCase().includes(w))) {
          score += 20;
        }
        
        // Boost for brand match
        if (product.brand && queryWords.some(w => product.brand.toLowerCase().includes(w))) {
          score += 15;
        }
        
        // Consider ratings
        score += (product.ratings || 0) * 2;
        
        return { product, score };
      })
      .sort((a, b) => b.score - a.score);

    // Return top scored products
    return scoredProducts
      .slice(0, this.MAX_PRODUCTS_IN_CONTEXT)
      .map(item => item.product);
  }

  private formatProductCatalog(products: Product[]): string {
    return products.slice(0, 20).map(p => 
      `- ${p.product_id}: ${p.name} (${p.category}${p.brand ? ', ' + p.brand : ''}) - $${p.price} - ${p.description.substring(0, 100)}...`
    ).join('\n');
  }

  private parseResponse(responseText: string, allProducts: Product[]): RecommendationResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Map product IDs to full product objects
      const recommendations = (parsed.recommendations || [])
        .slice(0, 5)
        .map((rec: any, index: number) => {
          const product = allProducts.find(p => p.product_id === rec.product_id);
          if (!product) return null;
          
          return {
            ...product,
            reasoning: rec.reasoning || `Recommended based on your query`,
            match_score: rec.match_score || (90 - index * 10),
            position: index + 1
          };
        })
        .filter(Boolean);

      return {
        recommendations,
        message: parsed.message || 'Here are my recommendations for you:',
        intent: parsed.intent || {
          understood: 'General product search',
          confidence: 0.7
        },
        fallback_used: false
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return a simple parsed version if JSON parsing fails
      return this.extractSimpleRecommendations(responseText, allProducts);
    }
  }

  private extractSimpleRecommendations(responseText: string, products: Product[]): RecommendationResponse {
    // Simple extraction if JSON parsing fails
    const productMentions = products
      .filter(p => responseText.includes(p.name) || responseText.includes(p.product_id))
      .slice(0, 5);

    return {
      recommendations: productMentions.map((p, index) => ({
        ...p,
        reasoning: 'Mentioned in recommendation',
        match_score: 80 - index * 10,
        position: index + 1
      })),
      message: responseText.split('\n')[0] || 'Here are some products you might like:',
      intent: {
        understood: 'Product search',
        confidence: 0.5
      },
      fallback_used: false
    };
  }

  private getFallbackRecommendations(query: string, products: Product[]): RecommendationResponse {
    // Fallback to basic filtering and sorting
    const recommendations = products
      .filter(p => p.stock_status === 'in_stock')
      .sort((a, b) => {
        // Sort by ratings first, then by review count
        const ratingDiff = (b.ratings || 0) - (a.ratings || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.review_count || 0) - (a.review_count || 0);
      })
      .slice(0, 5)
      .map((p, index) => ({
        ...p,
        reasoning: `Popular product in ${p.category}`,
        match_score: 70 - index * 10,
        position: index + 1
      }));

    return {
      recommendations,
      message: query 
        ? `Based on your search for "${query}", here are some popular products:`
        : 'Here are some popular products you might like:',
      intent: {
        understood: query || 'General browsing',
        confidence: 0.3
      },
      fallback_used: true
    };
  }
}