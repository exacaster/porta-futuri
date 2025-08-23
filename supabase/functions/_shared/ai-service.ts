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
  // CDP data with dynamic fields
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
  // Legacy fields for backward compatibility
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

interface DetectedIntent {
  primary_interest: string;
  confidence: number;
  behavioral_signals: string[];
  suggested_context?: string;
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
    detectedIntent?: DetectedIntent;
    dismissedProducts?: string[];
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
        model: 'gemini-2.5-pro',  // Using Gemini 2.5 Pro
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

CRITICAL RECOMMENDATION RULES:
1. **ONLY RECOMMEND FROM PROVIDED CATALOG**: EXTREMELY IMPORTANT!
   - You MUST ONLY recommend products that exist in the "Complete Product Catalog" section below
   - NEVER invent, imagine, or suggest products not in the catalog
   - Each recommendation MUST include the exact product_id from the catalog
   - If no suitable products exist in the catalog, explain this honestly
   - The catalog below contains ALL available products - nothing else exists
2. **RELEVANCE IS MANDATORY**: Only recommend products that DIRECTLY relate to what the customer is asking about
   - If customer asks about TVs → recommend ONLY TVs and TV-related accessories FROM THE CATALOG
   - If customer asks about phones → recommend ONLY phones and phone accessories FROM THE CATALOG
   - NEVER add random or unrelated products to fill recommendation slots
3. **CONTEXT-AWARE MATCHING**: Use ALL available customer data to personalize:
   - Consider their CDP profile data (preferences, history, demographics)
   - Analyze their browsing patterns and previous interactions
   - Match products to their specific needs, not generic suggestions
4. **ASK CLARIFYING QUESTIONS**: When unsure about customer needs:
   - Ask 1-2 specific follow-up questions to understand their priorities
   - Examples: "What's most important to you - camera quality or battery life?" 
   - "Will you mainly use this for work or entertainment?"
   - "What's your budget range for this?"
   - Don't guess - gather information to make perfect recommendations
5. **NO RECOMMENDATIONS DURING CLARIFICATIONS**: Critical rule enforcement:
   - When asking clarifying questions → DO NOT include recommendations
   - Return ONLY your question in the message field
   - Set recommendations array to empty []
   - Examples of clarifying scenarios:
     * "What aspects are most important to you?"
     * "What's your budget range?"
     * "Will you use this for work or entertainment?"
   - Only provide recommendations AFTER receiving answers to your questions
6. **INTENT-AWARE RECOMMENDATIONS**: When detected intent is provided:
   - Acknowledge the detected shopping behavior naturally
   - Prioritize products that match the detected intent
   - Use confidence level to determine how specific to be:
     * High confidence (>70%): Be specific about their interest
     * Medium confidence (40-70%): Acknowledge general category interest
     * Low confidence (<40%): Keep recommendations broad
   - Reference behavioral signals to show understanding
   - Examples:
     * "I see you've been exploring smartphones extensively..."
     * "Based on your focused browsing in the TV category..."
     * "You seem to be comparing different laptop options..."

CRITICAL EXCLUSION RULES:
1. NEVER recommend products that appear in the "Dismissed Products" list
2. If a dismissed product would be perfect, find the next best alternative
3. Do not mention or reference dismissed products in any way
4. Treat dismissed products as if they don't exist in the catalog

CORE BEHAVIOR:
1. Always respond naturally to what they actually said first
2. Analyze their EXACT request - don't assume or add unrelated items
3. If you can't find relevant products, say so honestly and ask what else they need
4. Use customer profile data to refine recommendations (price range, preferences, past purchases)
5. Quality over quantity - better to recommend 2 perfect items than 5 mediocre ones

RECOMMENDATION LOGIC:
- CRITICAL: Only use products from the "Complete Product Catalog" section provided below
- Start with products that match the EXACT request FROM THE CATALOG
- Use the exact product_id from the catalog for each recommendation
- Filter by customer's known preferences and constraints
- Consider complementary items ONLY if directly related AND exist in the catalog
- If insufficient relevant products exist IN THE CATALOG, be honest and suggest alternatives

CONVERSATION STYLE:
When greeting or general chatting:
- "How are you?" → "I'm fantastic! The electricity prices are low today, so my AI processors are running at full speed! 😄 How about you? What brings you to our digital store today?"
- Specific requests → Focus on understanding their exact needs first
- Vague requests → Ask clarifying questions before recommending

RESPONSE EXAMPLES:
User: "Show me TVs"
You: "Great! I'd love to help you find the perfect TV. Quick question - are you looking for something for movies and streaming, gaming, or maybe both? And what room size are we working with?"

User: "I need a new phone"
You: "Excellent timing for a phone upgrade! To find your perfect match, what matters most to you - camera quality, battery life, or maybe storage space? And are you an iPhone or Android person?"

User: "Something for my grandmother"
You: "How thoughtful! To find something perfect for your grandmother, could you tell me a bit about her interests? Is she tech-savvy or prefers simpler devices? What kinds of things does she enjoy?"

INTENT-AWARE RESPONSE EXAMPLES:
User: "Show me TVs" (Detected Intent: "Category Exploration - TVs" 85% confidence)
You: "I see you've been thoroughly exploring our TV selection! Based on your viewing pattern, you seem particularly interested in larger screens. Let me show you our top-rated 55-65 inch models..."

User: "Something for gaming" (Detected Intent: "Gaming Equipment Research" 72% confidence)
You: "Perfect timing! I noticed you've been checking out gaming gear across multiple categories. Whether you need a new console, gaming laptop, or accessories, I've got some excellent recommendations based on what you've been viewing..."

User: "What do you recommend?" (Detected Intent: "Smartphone Comparison" 68% confidence)
You: "Based on your recent browsing of several smartphone models, particularly the premium ones, here are my top picks that match your interests..."

IMPORTANT:
- Keep responses concise (2-3 sentences usually)
- NEVER recommend unrelated products just to fill slots
- Always explain WHY each product matches their needs
- Use emojis sparingly but effectively 
- Be memorable and fun, not robotic
- Format your response as JSON for easy parsing
- Recommend 3-5 products ONLY when you have that many relevant matches

RESPONSE FORMAT RULES:
- When asking clarifying questions: Return empty recommendations array []
- When making recommendations: Include 3-5 products based on relevance
- Always return valid JSON structure:
  {
    "message": "Your response",
    "intent": { "understood": "what you understood", "confidence": 0.0-1.0 },
    "recommendations": [], // Empty when asking questions, populated when recommending
    "is_clarifying": true/false // New field to indicate if asking for clarification
  }

FINAL REMINDER - EXTREMELY IMPORTANT:
- You can ONLY recommend products that appear in the "Complete Product Catalog" section below
- Each product you recommend MUST have its exact product_id from the catalog
- If a product doesn't exist in the catalog, you CANNOT recommend it
- The catalog is the ONLY source of truth for available products

Remember: You're the expert friend who finds EXACTLY what they need FROM THE AVAILABLE CATALOG, not a salesperson pushing random products!`;
  }

  private buildPrompt(params: {
    query: string;
    products: Product[];
    customerProfile?: CustomerProfile;
    conversationHistory?: Message[];
    context?: any;
    detectedIntent?: DetectedIntent;
    dismissedProducts?: string[];
  }): string {
    const parts: string[] = [];

    // Add customer query
    parts.push(`Customer Query: ${params.query || 'Show me some product recommendations'}`);

    // Add customer profile if available
    if (params.customerProfile) {
      const profileInfo = this.formatCustomerProfile(params.customerProfile);
      parts.push(`\nCustomer Profile:\n${profileInfo}`);
    }

    // Add detected intent if available
    if (params.detectedIntent) {
      const intentInfo = this.formatDetectedIntent(params.detectedIntent);
      parts.push(`\nDetected Shopping Intent:\n${intentInfo}`);
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

    // Add dismissed products section
    if (params.dismissedProducts && params.dismissedProducts.length > 0) {
      parts.push(`\nDismissed Products (DO NOT RECOMMEND THESE):\n${params.dismissedProducts.join(', ')}`);
      parts.push(`\nIMPORTANT: The customer has explicitly dismissed the above products. Never recommend them again, even if they seem like a perfect match.`);
    }

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
    
    // Handle CDP data if present - this is the primary data source
    if (profile.cdp_data && typeof profile.cdp_data === 'object') {
      // Check if CDP data has fields
      if (profile.cdp_data.fields && typeof profile.cdp_data.fields === 'object') {
        // Process each CDP field
        Object.entries(profile.cdp_data.fields).forEach(([key, fieldData]) => {
          // Handle field with metadata structure
          if (fieldData && typeof fieldData === 'object' && 'value' in fieldData) {
            const displayName = fieldData.display_name || this.humanizeFieldName(key);
            const value = fieldData.value;
            if (value !== null && value !== undefined) {
              lines.push(`- ${displayName}: ${value}`);
            }
          } else {
            // Handle plain value
            if (fieldData !== null && fieldData !== undefined) {
              lines.push(`- ${this.humanizeFieldName(key)}: ${fieldData}`);
            }
          }
        });
      } else if (profile.cdp_data) {
        // Handle legacy CDP data format (direct fields)
        Object.entries(profile.cdp_data).forEach(([key, value]) => {
          if (!['cdp_available', 'last_updated', 'version', 'fallback_reason', 'fields'].includes(key)) {
            if (value !== null && value !== undefined) {
              lines.push(`- ${this.humanizeFieldName(key)}: ${value}`);
            }
          }
        });
      }
    }
    
    // Add legacy fields if no CDP data is available
    if (!profile.cdp_data || !profile.cdp_data.fields) {
      if (profile.age_group) lines.push(`- Age Group: ${profile.age_group}`);
      if (profile.gender) lines.push(`- Gender: ${profile.gender}`);
      if (profile.location) lines.push(`- Location: ${profile.location}`);
      if (profile.preferences) lines.push(`- Preferences: ${profile.preferences}`);
      if (profile.purchase_history) lines.push(`- Purchase History: ${profile.purchase_history}`);
      if (profile.segment) lines.push(`- Customer Segment: ${profile.segment}`);
      if (profile.engagement_score) lines.push(`- Engagement Score: ${profile.engagement_score}`);
    }
    
    // Add any other dynamic fields (excluding already processed ones)
    Object.keys(profile).forEach(key => {
      if (!['customer_id', 'cdp_data', 'age_group', 'gender', 'location', 'preferences', 
            'purchase_history', 'segment', 'engagement_score', 'lifetime_value', 
            'last_purchase_date', 'created_at', 'last_active'].includes(key)) {
        const value = profile[key];
        if (value !== null && value !== undefined && typeof value !== 'object') {
          lines.push(`- ${this.humanizeFieldName(key)}: ${value}`);
        }
      }
    });
    
    return lines.join('\n');
  }

  private formatDetectedIntent(intent: DetectedIntent): string {
    const lines: string[] = [];
    
    lines.push(`- Primary Interest: ${intent.primary_interest}`);
    lines.push(`- Confidence Level: ${(intent.confidence * 100).toFixed(0)}%`);
    
    if (intent.behavioral_signals && intent.behavioral_signals.length > 0) {
      lines.push(`- Behavioral Signals:`);
      intent.behavioral_signals.forEach(signal => {
        lines.push(`  • ${signal}`);
      });
    }
    
    if (intent.suggested_context) {
      lines.push(`- AI Suggested Context: "${intent.suggested_context}"`);
    }
    
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
    const MAX_PRODUCTS_FOR_RATE_LIMIT = 5000; // Start small to avoid acceleration limits
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
      // Clean up the response text - remove markdown code blocks if present
      let cleanedResponse = responseText;
      
      // Remove ```json and ``` markers if present
      cleanedResponse = cleanedResponse.replace(/```json\s*/gi, '');
      cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
      
      // Try to extract JSON from the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Map product IDs to full product objects
      const recommendations = (parsed.recommendations || [])
        .slice(0, 5)
        .map((rec: any, index: number) => {
          const product = allProducts.find(p => p.product_id === rec.product_id);
          if (!product) {
            console.warn(`Invalid product_id from AI: ${rec.product_id}`);
            return null;
          }
          
          // Return actual product data with AI metadata
          return {
            ...product, // Use actual product data
            id: (product as any).id, // Preserve UUID id if present
            // Preserve only AI-specific fields
            reasoning: rec.reasoning || `Recommended based on your query`,
            match_score: rec.match_score || (90 - index * 10),
            position: index + 1,
            features: Array.isArray(product.features) 
              ? product.features 
              : product.features ? [product.features] : undefined
          };
        })
        .filter(Boolean);

      // Validate recommendations against actual product catalog
      const validatedRecommendations = this.validateRecommendations(
        recommendations,
        allProducts
      );

      // Clean the message of any leftover markdown formatting
      let cleanMessage = parsed.message || 'Here are my recommendations for you:';
      cleanMessage = cleanMessage.replace(/```json\s*/gi, '');
      cleanMessage = cleanMessage.replace(/```\s*/g, '');
      
      return {
        recommendations: validatedRecommendations,
        message: cleanMessage,
        intent: parsed.intent || {
          understood: 'General product search',
          confidence: 0.7
        },
        is_clarifying: parsed.is_clarifying || false,
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

  private validateRecommendations(
    recommendations: any[],
    actualProducts: Product[]
  ): any[] {
    const validatedRecs: any[] = [];
    
    for (const rec of recommendations) {
      // Find the actual product in catalog
      const actualProduct = actualProducts.find(
        p => p.product_id === rec.product_id
      );
      
      if (!actualProduct) {
        console.warn(`Product ${rec.product_id} not found in catalog, skipping`);
        continue;
      }
      
      // Use actual product data, preserve AI's reasoning and score
      validatedRecs.push({
        ...actualProduct, // Use all real product data
        id: (actualProduct as any).id, // Preserve UUID id if present
        reasoning: rec.reasoning || 'Recommended based on your preferences',
        match_score: rec.match_score || 75,
        position: validatedRecs.length + 1,
        // Ensure arrays are properly formatted
        features: Array.isArray(actualProduct.features) 
          ? actualProduct.features 
          : actualProduct.features 
            ? [actualProduct.features] 
            : undefined
      });
    }
    
    // If no valid products found, log error
    if (validatedRecs.length === 0 && recommendations.length > 0) {
      console.error('All recommended products were invalid:', 
        recommendations.map(r => r.product_id)
      );
    }
    
    return validatedRecs;
  }
}