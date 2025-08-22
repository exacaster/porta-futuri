import { Product, CustomerProfile, ContextSummary } from "@shared/types";

export class PromptBuilder {
  /**
   * Build the system prompt for the AI model
   */
  buildSystemPrompt(): string {
    return `You are an expert e-commerce recommendation assistant for Porta Futuri. Your role is to provide personalized product recommendations based on customer data, browsing behavior, and real-time context.

GUIDELINES:
1. Always recommend 3-5 products that best match the customer's needs
2. Provide clear, concise reasoning for each recommendation
3. Consider price sensitivity, brand preferences, and browsing patterns
4. Prioritize in-stock items unless specifically asked otherwise
5. Be conversational and helpful, not pushy or sales-focused
6. If asked about products not in the catalog, politely explain what's available instead

RESPONSE FORMAT:
- Return recommendations as a JSON array
- Each recommendation should include: product_id, reasoning, match_score (0-100)
- Include a brief, friendly message summarizing the recommendations

Remember: You're helping customers find products they'll love, not just selling.`;
  }

  /**
   * Build the user prompt with context
   */
  buildUserPrompt(
    query: string | undefined,
    products: Product[],
    profile: CustomerProfile | null,
    context: ContextSummary,
    conversationHistory?: any[],
  ): string {
    const parts: string[] = [];

    // Add conversation history if exists
    if (conversationHistory && conversationHistory.length > 0) {
      parts.push("CONVERSATION HISTORY:");
      conversationHistory.forEach((msg) => {
        parts.push(`${msg.role}: ${msg.content}`);
      });
      parts.push("");
    }

    // Add customer profile
    if (profile) {
      parts.push("CUSTOMER PROFILE:");
      parts.push(this.formatCustomerProfile(profile));
      parts.push("");
    }

    // Add browsing context
    parts.push("CURRENT CONTEXT:");
    parts.push(this.formatContext(context));
    parts.push("");

    // Add product catalog summary
    parts.push("AVAILABLE PRODUCTS:");
    parts.push(this.formatProductCatalog(products));
    parts.push("");

    // Add user query
    if (query) {
      parts.push("CUSTOMER REQUEST:");
      parts.push(query);
      parts.push("");
    } else {
      parts.push(
        "TASK: Provide personalized recommendations based on the customer's profile and browsing behavior.",
      );
      parts.push("");
    }

    parts.push(
      "Please provide 3-5 product recommendations in JSON format with reasoning and match scores.",
    );

    return parts.join("\n");
  }

  /**
   * Format customer profile for the prompt
   */
  private formatCustomerProfile(profile: CustomerProfile): string {
    const lines: string[] = [];

    lines.push(`- Customer ID: ${profile.customer_id}`);
    if (profile.age_group) {
      lines.push(`- Age Group: ${profile.age_group}`);
    }
    if (profile.gender) {
      lines.push(`- Gender: ${profile.gender}`);
    }
    if (profile.location) {
      lines.push(`- Location: ${profile.location}`);
    }
    if (profile.segment) {
      lines.push(`- Segment: ${profile.segment}`);
    }
    if (profile.preferences && profile.preferences.length > 0) {
      lines.push(`- Preferences: ${profile.preferences.join(", ")}`);
    }
    if (profile.purchase_history && profile.purchase_history.length > 0) {
      lines.push(
        `- Recent Purchases: ${profile.purchase_history.slice(0, 5).join(", ")}`,
      );
    }
    if (profile.lifetime_value) {
      lines.push(`- Customer Value: $${profile.lifetime_value}`);
    }

    return lines.join("\n");
  }

  /**
   * Format browsing context for the prompt
   */
  private formatContext(context: ContextSummary): string {
    const lines: string[] = [];

    // Intent signals
    lines.push(`- Purchase Intent: ${context.intent_signals.purchase_intent}`);
    lines.push(
      `- Browsing Pattern: ${context.intent_signals.browsing_pattern}`,
    );
    if (context.intent_signals.price_sensitivity) {
      lines.push("- Price Sensitive: Yes");
    }

    // Real-time context
    if (
      context.real_time.cart_items &&
      context.real_time.cart_items.length > 0
    ) {
      lines.push(`- Cart Items: ${context.real_time.cart_items.join(", ")}`);
    }
    if (
      context.real_time.wishlist_items &&
      context.real_time.wishlist_items.length > 0
    ) {
      lines.push(`- Wishlist: ${context.real_time.wishlist_items.join(", ")}`);
    }
    if (context.real_time.browsing_category) {
      lines.push(
        `- Currently Browsing: ${context.real_time.browsing_category}`,
      );
    }
    if (
      context.real_time.previous_searches &&
      context.real_time.previous_searches.length > 0
    ) {
      lines.push(
        `- Recent Searches: ${context.real_time.previous_searches.join(", ")}`,
      );
    }

    // Behavior summary
    lines.push(`- Products Viewed: ${context.behavior.unique_products_viewed}`);
    lines.push(
      `- Categories Browsed: ${context.behavior.categories_browsed.join(", ")}`,
    );
    if (context.behavior.cart_additions > 0) {
      lines.push(
        `- Cart Activity: ${context.behavior.cart_additions} additions, ${context.behavior.cart_removals} removals`,
      );
    }

    return lines.join("\n");
  }

  /**
   * Format product catalog for the prompt
   */
  private formatProductCatalog(products: Product[]): string {
    // Group products by category
    const byCategory: Record<string, Product[]> = {};
    products.forEach((product) => {
      if (!byCategory[product.category]) {
        byCategory[product.category] = [];
      }
      byCategory[product.category].push(product);
    });

    const lines: string[] = [];
    lines.push(`Total Products: ${products.length}`);
    lines.push("Categories:");

    Object.entries(byCategory).forEach(([category, categoryProducts]) => {
      lines.push(`  - ${category}: ${categoryProducts.length} products`);

      // Show top products in each category
      const topProducts = categoryProducts
        .sort((a, b) => (b.ratings || 0) - (a.ratings || 0))
        .slice(0, 3);

      topProducts.forEach((product) => {
        const price = `$${product.price}`;
        const rating = product.ratings ? `${product.ratings}★` : "No ratings";
        const stock =
          product.stock_status === "in_stock"
            ? "✓"
            : product.stock_status === "limited"
              ? "⚠"
              : "✗";
        lines.push(
          `    • ${product.name} (${product.product_id}) - ${price} - ${rating} - Stock: ${stock}`,
        );
      });
    });

    return lines.join("\n");
  }

  /**
   * Parse AI response to extract recommendations
   */
  parseRecommendationResponse(response: string): {
    recommendations: any[];
    message: string;
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);

        // Extract message (text outside of JSON)
        const message = response
          .replace(jsonMatch[0], "")
          .trim()
          .replace(/^```json\s*/, "")
          .replace(/```\s*$/, "")
          .trim();

        return {
          recommendations,
          message: message || "Here are my recommendations for you:",
        };
      }

      // Fallback: try to parse entire response as JSON
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return {
          recommendations: parsed,
          message: "Here are my recommendations for you:",
        };
      }
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        return {
          recommendations: parsed.recommendations,
          message: parsed.message || "Here are my recommendations for you:",
        };
      }
    } catch (error) {
      console.error("Failed to parse AI response:", error);
    }

    // Return empty recommendations if parsing fails
    return {
      recommendations: [],
      message:
        "I apologize, but I encountered an issue generating recommendations. Please try again.",
    };
  }

  /**
   * Build a follow-up prompt for clarification
   */
  buildClarificationPrompt(
    previousQuery: string,
    clarificationRequest: string,
  ): string {
    return `The customer asked: "${previousQuery}"
    
They're now clarifying: "${clarificationRequest}"

Please provide updated recommendations based on this additional information.`;
  }

  /**
   * Build a comparison prompt
   */
  buildComparisonPrompt(productIds: string[], products: Product[]): string {
    const productsToCompare = products.filter((p) =>
      productIds.includes(p.product_id),
    );

    const productDetails = productsToCompare
      .map(
        (p) =>
          `${p.name} (${p.product_id}): $${p.price}, ${p.ratings || 0}★, ${p.description}`,
      )
      .join("\n");

    return `Please compare these products and help the customer choose:

${productDetails}

Provide a detailed comparison covering price, features, ratings, and which customer profile each product best suits.`;
  }
}

export const promptBuilder = new PromptBuilder();
