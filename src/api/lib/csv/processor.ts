import {
  Product,
  CustomerProfile,
  ContextEvent,
  sanitizeProduct,
  sanitizeCustomerProfile,
  sanitizeContextEvent,
  analyzeContext,
  BrowsingBehavior,
  ContextSummary,
  IntentSignals,
} from "@shared/types";

export class ServerCSVProcessor {
  private readonly MAX_PRODUCTS = 10000;
  private readonly MAX_CONTEXT_EVENTS = 500;
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Process products from parsed CSV data
   */
  processProducts(data: any[]): { products: Product[]; errors: string[] } {
    const products: Product[] = [];
    const errors: string[] = [];
    let processedCount = 0;

    for (const row of data) {
      processedCount++;

      if (products.length >= this.MAX_PRODUCTS) {
        errors.push(
          `Product limit (${this.MAX_PRODUCTS}) reached. Processed ${processedCount} rows.`,
        );
        break;
      }

      // Skip invalid rows
      if (
        !row.product_id ||
        !row.name ||
        !row.category ||
        row.price === undefined
      ) {
        errors.push(`Row ${processedCount}: Missing required fields`);
        continue;
      }

      try {
        const product = sanitizeProduct(row);
        products.push(product);
      } catch (error) {
        errors.push(
          `Row ${processedCount}: ${error instanceof Error ? error.message : "Invalid product data"}`,
        );
      }
    }

    return { products, errors };
  }

  /**
   * Process customer profile from parsed CSV data
   */
  processCustomerProfile(data: any[]): {
    profile: CustomerProfile | null;
    errors: string[];
  } {
    const errors: string[] = [];

    if (data.length === 0) {
      errors.push("No customer data found in CSV");
      return { profile: null, errors };
    }

    const row = data[0]; // Only process first row for customer profile

    if (!row.customer_id) {
      errors.push("customer_id is required");
      return { profile: null, errors };
    }

    try {
      const profile = sanitizeCustomerProfile(row);
      return { profile, errors };
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : "Failed to parse customer profile",
      );
      return { profile: null, errors };
    }
  }

  /**
   * Process context events from parsed CSV data
   */
  processContextEvents(data: any[]): {
    events: ContextEvent[];
    summary: ContextSummary;
    errors: string[];
  } {
    const events: ContextEvent[] = [];
    const errors: string[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let processedCount = 0;

    for (const row of data) {
      processedCount++;

      if (events.length >= this.MAX_CONTEXT_EVENTS) {
        break;
      }

      if (!row.timestamp || !row.event_type) {
        errors.push(`Row ${processedCount}: Missing required fields`);
        continue;
      }

      try {
        // Add default session_id if missing
        if (!row.session_id) {
          row.session_id = "default_session";
        }

        const event = sanitizeContextEvent(row);

        // Filter old events
        const eventDate = new Date(event.timestamp);
        if (eventDate < thirtyDaysAgo) {
          continue;
        }

        events.push(event);
      } catch (error) {
        errors.push(
          `Row ${processedCount}: ${error instanceof Error ? error.message : "Invalid event data"}`,
        );
      }
    }

    // Sort by timestamp (most recent first)
    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Analyze context to create summary
    const summary = this.createContextSummary(events);

    return { events, summary, errors };
  }

  /**
   * Create a summary of context events
   */
  private createContextSummary(events: ContextEvent[]): ContextSummary {
    const behavior = analyzeContext(events);

    // Extract real-time context
    const cartItems = new Set<string>();
    const wishlistItems = new Set<string>();
    const searches: string[] = [];
    const categories = new Set<string>();

    events.forEach((event) => {
      if (event.cart_action === "add" && event.product_id) {
        cartItems.add(event.product_id);
      }
      if (event.cart_action === "remove" && event.product_id) {
        cartItems.delete(event.product_id);
      }
      if (event.wishlist_action === "add" && event.product_id) {
        wishlistItems.add(event.product_id);
      }
      if (event.search_query) {
        searches.push(event.search_query);
      }
      if (event.category_viewed) {
        categories.add(event.category_viewed);
      }
    });

    // Calculate intent signals
    const intentSignals = this.analyzeIntentSignals(events, behavior);

    return {
      recent_events: events.slice(0, 10), // Last 10 events
      behavior,
      real_time: {
        cart_items: Array.from(cartItems),
        wishlist_items: Array.from(wishlistItems),
        previous_searches: searches.slice(0, 5),
        browsing_category: Array.from(categories)[0],
        pages_viewed: events.filter((e) => e.event_type === "page_view").length,
      },
      intent_signals: intentSignals,
    };
  }

  /**
   * Analyze user intent from browsing behavior
   */
  private analyzeIntentSignals(
    events: ContextEvent[],
    behavior: BrowsingBehavior,
  ): IntentSignals {
    const recentEvents = events.slice(0, 20);

    // Calculate purchase intent
    let purchaseIntentScore = 0;
    if (behavior.cart_additions > 0) {
      purchaseIntentScore += 3;
    }
    if (behavior.cart_removals > behavior.cart_additions * 0.5) {
      purchaseIntentScore -= 1;
    }
    if (recentEvents.some((e) => e.event_type === "purchase")) {
      purchaseIntentScore += 5;
    }
    if (behavior.unique_products_viewed > 5) {
      purchaseIntentScore += 2;
    }

    const purchaseIntent: "low" | "medium" | "high" =
      purchaseIntentScore >= 5
        ? "high"
        : purchaseIntentScore >= 2
          ? "medium"
          : "low";

    // Determine browsing pattern
    const hasComparedProducts =
      behavior.unique_products_viewed > 3 &&
      behavior.categories_browsed.length <= 2;
    const hasAddedToCart = behavior.cart_additions > 0;

    const browsingPattern: "exploring" | "comparing" | "ready_to_buy" =
      hasAddedToCart
        ? "ready_to_buy"
        : hasComparedProducts
          ? "comparing"
          : "exploring";

    // Check price sensitivity
    const priceSensitivity = recentEvents.some(
      (e) =>
        e.filters_applied &&
        (e.filters_applied.price_min !== undefined ||
          e.filters_applied.price_max !== undefined),
    );

    // Check brand loyalty
    const viewedProducts = recentEvents
      .filter((e) => e.product_id)
      .map((e) => e.product_id);
    const brandLoyalty =
      viewedProducts.length > 3 &&
      new Set(viewedProducts).size < viewedProducts.length * 0.5;

    // Identify urgency indicators
    const urgencyIndicators: string[] = [];
    if (behavior.cart_additions > 2) {
      urgencyIndicators.push("multiple_cart_additions");
    }
    if (
      recentEvents.filter((e) => e.event_type === "product_view").length > 5
    ) {
      urgencyIndicators.push("intensive_browsing");
    }
    if (behavior.search_queries.length > 3) {
      urgencyIndicators.push("multiple_searches");
    }

    return {
      purchase_intent: purchaseIntent,
      browsing_pattern: browsingPattern,
      price_sensitivity: priceSensitivity,
      brand_loyalty: brandLoyalty,
      urgency_indicators: urgencyIndicators,
    };
  }

  /**
   * Combine all CSV data into a unified context
   */
  combineDataSources(
    products: Product[],
    profile: CustomerProfile | null,
    contextSummary: ContextSummary,
  ): {
    enrichedProfile: any;
    productCategories: string[];
    priceRange: { min: number; max: number };
    recommendationContext: any;
  } {
    // Extract product metadata
    const productCategories = [...new Set(products.map((p) => p.category))];
    const prices = products.map((p) => p.price).filter((p) => p > 0);
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };

    // Enrich profile with context
    const enrichedProfile = {
      ...profile,
      recent_behavior: contextSummary.behavior,
      intent_signals: contextSummary.intent_signals,
      real_time_context: contextSummary.real_time,
    };

    // Create recommendation context
    const recommendationContext = {
      customer: enrichedProfile,
      available_products: products.length,
      product_categories: productCategories,
      price_range: priceRange,
      session_context: {
        cart_items: contextSummary.real_time.cart_items,
        wishlist_items: contextSummary.real_time.wishlist_items,
        recent_searches: contextSummary.real_time.previous_searches,
        browsing_pattern: contextSummary.intent_signals.browsing_pattern,
        purchase_intent: contextSummary.intent_signals.purchase_intent,
      },
    };

    return {
      enrichedProfile,
      productCategories,
      priceRange,
      recommendationContext,
    };
  }

  /**
   * Validate file size
   */
  validateFileSize(sizeInBytes: number): { valid: boolean; error?: string } {
    if (sizeInBytes > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${Math.round(sizeInBytes / 1024 / 1024)}MB) exceeds maximum allowed size (${this.MAX_FILE_SIZE / 1024 / 1024}MB)`,
      };
    }
    return { valid: true };
  }
}

export const serverCSVProcessor = new ServerCSVProcessor();
