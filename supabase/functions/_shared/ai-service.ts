import { GoogleGenAI } from 'https://esm.sh/@google/genai@1.15.0';

interface Product {
  product_id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price: number;
  description: string;
  features?: string | string[];  // Can be either string or array
  stock_status: string;
  image_url?: string;
  ratings?: number;
  review_count?: number;
  comments?: Array<{  // User reviews/comments
    user_id?: string;
    user_name?: string;
    rating?: number;
    comment: string;
    date?: string;
  }>;
  [key: string]: any;  // Allow additional dynamic fields
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
  private gemini: GoogleGenAI;
  private readonly MAX_CONVERSATION_HISTORY = 5;

  constructor(apiKey: string) {
    this.gemini = new GoogleGenAI({ apiKey });
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
      
      // Log the full prompt being sent to Gemini
      console.log('========== FULL PROMPT SENT TO GEMINI ==========');
      console.log('SYSTEM PROMPT:');
      console.log(this.getSystemPrompt());
      console.log('\n========== USER PROMPT ==========');
      console.log(prompt);
      console.log('========== END OF PROMPT ==========');
      console.log('Total prompt length:', prompt.length, 'characters');
      
      // Call Gemini API with configuration
      console.log('AI Service: Calling Gemini API...');
      
      // Combine system prompt and user prompt for Gemini
      const fullPrompt = `${this.getSystemPrompt()}\n\n${prompt}`;
      
      const result = await this.gemini.models.generateContent({
        model: 'gemini-2.0-flash-001',  // Using Gemini 2.0 Flash
        contents: fullPrompt,
        config: {
          generationConfig: {
            maxOutputTokens: 100000,  // Match Claude's token limit
            temperature: 0.7,
          }
        }
      });

      console.log('AI Service: Gemini API response received');
      
      // Parse the response
      const responseText = result.text || '';
      
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

    // Add complete product catalog (all products with full details)
    const catalogText = this.formatCompleteProductCatalog(params.products);
    parts.push(`\nComplete Product Catalog (${params.products.length} total products):\n${catalogText}`);

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

  // Removed selectRelevantProducts - we now include all products in the prompt

  private formatCompleteProductCatalog(products: Product[]): string {
    // Temporarily limit to avoid rate limits - will increase as tier goes up
    const MAX_PRODUCTS_FOR_RATE_LIMIT = 50; // Start small to avoid acceleration limits
    const productsToInclude = products.slice(0, MAX_PRODUCTS_FOR_RATE_LIMIT);
    
    console.log(`Including ${productsToInclude.length} of ${products.length} products due to rate limits`);
    
    return productsToInclude.map(p => {
      const lines: string[] = [];
      lines.push(`Product ID: ${p.product_id}`);
      lines.push(`  Name: ${p.name}`);
      lines.push(`  Category: ${p.category}`);
      if (p.subcategory) lines.push(`  Subcategory: ${p.subcategory}`);
      if (p.brand) lines.push(`  Brand: ${p.brand}`);
      lines.push(`  Price: $${p.price}`);
      lines.push(`  Description: ${p.description}`); // Full description, no truncation
      
      // Handle features (can be string or array)
      if (p.features) {
        if (Array.isArray(p.features)) {
          lines.push(`  Features: ${p.features.join(', ')}`);
        } else {
          lines.push(`  Features: ${p.features}`);
        }
      }
      
      lines.push(`  Stock Status: ${p.stock_status}`);
      if (p.image_url) lines.push(`  Image URL: ${p.image_url}`);
      if (p.ratings !== undefined) lines.push(`  Rating: ${p.ratings}/5`);
      if (p.review_count !== undefined) lines.push(`  Number of Reviews: ${p.review_count}`);
      
      // Include user comments/reviews if available
      if (p.comments && p.comments.length > 0) {
        lines.push(`  Customer Reviews (${p.comments.length} total):`);
        p.comments.forEach((comment, idx) => {
          lines.push(`    Review ${idx + 1}:`);
          if (comment.user_name) lines.push(`      Customer: ${comment.user_name}`);
          if (comment.rating !== undefined) lines.push(`      Rating: ${comment.rating}/5`);
          lines.push(`      Comment: ${comment.comment}`);
          if (comment.date) lines.push(`      Date: ${comment.date}`);
        });
      }
      
      // Add any additional fields that might exist (excluding already processed ones)
      Object.keys(p).forEach(key => {
        if (!['product_id', 'name', 'category', 'subcategory', 'brand', 'price', 
              'description', 'features', 'stock_status', 'image_url', 'ratings', 
              'review_count', 'comments'].includes(key)) {
          const value = p[key];
          if (value !== null && value !== undefined && typeof value !== 'object') {
            lines.push(`  ${this.humanizeFieldName(key)}: ${value}`);
          }
        }
      });
      
      return lines.join('\n');
    }).join('\n\n');
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
            features: Array.isArray(product.features) ? product.features : product.features ? [product.features] : undefined,
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
        features: Array.isArray(p.features) ? p.features : p.features ? [p.features] : undefined,
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
        features: Array.isArray(p.features) ? p.features : p.features ? [p.features] : undefined,
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