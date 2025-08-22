import { CustomerInsight } from "@shared/types/conversation.types";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface ExtractedData {
  preferences: string[];
  needs: string[];
  concerns: string[];
  interests: string[];
  priceRange?: [number, number];
  urgency?: "immediate" | "researching" | "browsing";
  sentiment: "positive" | "neutral" | "negative";
}

export class InsightExtractor {
  private insights: CustomerInsight[] = [];

  // Pattern definitions for extracting different types of insights
  private readonly PREFERENCE_PATTERNS = [
    /i (?:love|like|prefer|enjoy|adore) (?:the |a |an )?(\w+(?:\s+\w+)?)/gi,
    /(\w+(?:\s+\w+)?) (?:is|are) (?:my |our )?favorite/gi,
    /i'm (?:really |very |super )?(?:into|interested in|passionate about) (\w+(?:\s+\w+)?)/gi,
    /i (?:always |usually |often )(?:go for|choose|pick|buy) (\w+(?:\s+\w+)?)/gi,
    /i (?:tend to |typically )(?:like|prefer) (\w+(?:\s+\w+)?)/gi,
  ];

  private readonly NEED_PATTERNS = [
    /i (?:need|require|must have|have to get) (?:a |an |some )?(\w+(?:\s+\w+)?)/gi,
    /(?:looking|searching) for (?:a |an |some )?(\w+(?:\s+\w+)?)/gi,
    /(?:trying|want) to (?:find|get|buy) (?:a |an |some )?(\w+(?:\s+\w+)?)/gi,
    /do you (?:have|sell|offer) (?:any |some )?(\w+(?:\s+\w+)?)/gi,
    /i'm (?:in the market for|shopping for) (?:a |an |some )?(\w+(?:\s+\w+)?)/gi,
  ];

  private readonly CONCERN_PATTERNS = [
    /(?:worried|concerned) about (\w+(?:\s+\w+)?)/gi,
    /(\w+(?:\s+\w+)?) is (?:important|crucial|essential) (?:to|for) me/gi,
    /i (?:care about|value|prioritize) (\w+(?:\s+\w+)?)/gi,
    /(?:budget|price|cost|expensive|cheap|affordable)/gi,
    /(?:quality|durability|reliability|warranty)/gi,
  ];

  private readonly INTEREST_PATTERNS = [
    /i (?:enjoy|like) (\w+ing)/gi,
    /my (?:hobby|hobbies) (?:is|are|include) (\w+(?:\s+\w+)?)/gi,
    /i'm (?:a |an )?(\w+(?:\s+\w+)?) (?:enthusiast|fan|lover)/gi,
    /i (?:collect|play|do|practice) (\w+(?:\s+\w+)?)/gi,
  ];

  private readonly URGENCY_INDICATORS = {
    immediate: [
      "asap",
      "urgent",
      "immediately",
      "today",
      "right now",
      "emergency",
    ],
    researching: [
      "considering",
      "thinking about",
      "researching",
      "comparing",
      "exploring",
    ],
    browsing: [
      "just looking",
      "browsing",
      "curious",
      "wondering",
      "interested",
    ],
  };

  extractFromConversation(messages: Message[]): CustomerInsight[] {
    this.insights = [];
    const extractedData: ExtractedData = {
      preferences: [],
      needs: [],
      concerns: [],
      interests: [],
      sentiment: "neutral",
    };

    // Process each message
    messages.forEach((msg) => {
      if (msg.role === "user") {
        this.extractFromMessage(msg.content, extractedData);
      }
    });

    // Extract price range if mentioned
    const priceRange = this.extractPriceRange(messages);
    if (priceRange) {
      this.addInsight("concern", "price_range", 0.8, "explicit", {
        min: priceRange[0],
        max: priceRange[1],
      });
    }

    // Determine urgency
    const urgency = this.determineUrgency(messages);
    if (urgency) {
      this.addInsight("need", `urgency_${urgency}`, 0.7, "inferred");
    }

    // Analyze overall sentiment
    const sentiment = this.analyzeSentiment(messages);
    this.addInsight("preference", `sentiment_${sentiment}`, 0.6, "inferred");

    return this.insights;
  }

  private extractFromMessage(content: string, data: ExtractedData): void {
    // Extract preferences
    this.PREFERENCE_PATTERNS.forEach((pattern) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach((match) => {
        const value = this.cleanExtractedValue(match[1] || match[2]);
        if (value && !data.preferences.includes(value)) {
          data.preferences.push(value);
          this.addInsight("preference", value, 0.8, "explicit");
        }
      });
    });

    // Extract needs
    this.NEED_PATTERNS.forEach((pattern) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach((match) => {
        const value = this.cleanExtractedValue(match[1]);
        if (value && !data.needs.includes(value)) {
          data.needs.push(value);
          this.addInsight("need", value, 0.9, "explicit");
        }
      });
    });

    // Extract concerns
    this.CONCERN_PATTERNS.forEach((pattern) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach((match) => {
        const value = this.cleanExtractedValue(match[1] || match[0]);
        if (value && !data.concerns.includes(value)) {
          data.concerns.push(value);
          this.addInsight("concern", value, 0.7, "explicit");
        }
      });
    });

    // Extract interests
    this.INTEREST_PATTERNS.forEach((pattern) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach((match) => {
        const value = this.cleanExtractedValue(match[1]);
        if (value && !data.interests.includes(value)) {
          data.interests.push(value);
          this.addInsight("interest", value, 0.7, "inferred");
        }
      });
    });

    // Check for price sensitivity
    if (/budget|cheap|affordable|expensive|cost/i.test(content)) {
      this.addInsight("concern", "price_sensitive", 0.7, "inferred");
    }

    // Check for quality focus
    if (/quality|durable|reliable|last|sturdy|well-made/i.test(content)) {
      this.addInsight("preference", "quality_focused", 0.7, "inferred");
    }

    // Check for brand preferences
    const brandPattern =
      /\b(Apple|Samsung|Nike|Adidas|Sony|LG|Dell|HP|Lenovo|Microsoft|Amazon|Google)\b/gi;
    const brands = content.match(brandPattern);
    if (brands) {
      brands.forEach((brand) => {
        this.addInsight(
          "preference",
          `brand_${brand.toLowerCase()}`,
          0.8,
          "explicit",
        );
      });
    }
  }

  private extractPriceRange(messages: Message[]): [number, number] | null {
    let minPrice = Infinity;
    let maxPrice = 0;
    let hasPriceInfo = false;

    messages.forEach((msg) => {
      if (msg.role === "user") {
        // Check for price range patterns
        const rangeMatch = msg.content.match(
          /\$?(\d+(?:\.\d{2})?) ?(?:-|to) ?\$?(\d+(?:\.\d{2})?)/,
        );
        if (rangeMatch) {
          minPrice = Math.min(minPrice, parseFloat(rangeMatch[1]));
          maxPrice = Math.max(maxPrice, parseFloat(rangeMatch[2]));
          hasPriceInfo = true;
        }

        // Check for maximum price
        const maxMatch = msg.content.match(
          /(?:under|below|less than|max|maximum) \$?(\d+(?:\.\d{2})?)/i,
        );
        if (maxMatch) {
          maxPrice = Math.max(maxPrice, parseFloat(maxMatch[1]));
          if (minPrice === Infinity) {
            minPrice = 0;
          }
          hasPriceInfo = true;
        }

        // Check for minimum price
        const minMatch = msg.content.match(
          /(?:over|above|more than|min|minimum) \$?(\d+(?:\.\d{2})?)/i,
        );
        if (minMatch) {
          minPrice = Math.min(minPrice, parseFloat(minMatch[1]));
          hasPriceInfo = true;
        }
      }
    });

    if (hasPriceInfo) {
      return [
        minPrice === Infinity ? 0 : minPrice,
        maxPrice === 0 ? 10000 : maxPrice,
      ];
    }

    return null;
  }

  private determineUrgency(
    messages: Message[],
  ): "immediate" | "researching" | "browsing" | null {
    const combinedText = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content.toLowerCase())
      .join(" ");

    for (const [urgency, indicators] of Object.entries(
      this.URGENCY_INDICATORS,
    )) {
      if (indicators.some((indicator) => combinedText.includes(indicator))) {
        return urgency as "immediate" | "researching" | "browsing";
      }
    }

    return null;
  }

  private analyzeSentiment(
    messages: Message[],
  ): "positive" | "neutral" | "negative" {
    const positiveWords = [
      "love",
      "great",
      "excellent",
      "amazing",
      "wonderful",
      "perfect",
      "fantastic",
      "awesome",
    ];
    const negativeWords = [
      "hate",
      "bad",
      "terrible",
      "awful",
      "horrible",
      "worst",
      "disappointing",
      "frustrated",
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    messages.forEach((msg) => {
      if (msg.role === "user") {
        const lowerContent = msg.content.toLowerCase();
        positiveCount += positiveWords.filter((word) =>
          lowerContent.includes(word),
        ).length;
        negativeCount += negativeWords.filter((word) =>
          lowerContent.includes(word),
        ).length;
      }
    });

    if (positiveCount > negativeCount * 2) {
      return "positive";
    }
    if (negativeCount > positiveCount * 2) {
      return "negative";
    }
    return "neutral";
  }

  private cleanExtractedValue(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    // Remove common words that don't add value
    const stopWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
    ];
    const cleaned = value
      .trim()
      .toLowerCase()
      .split(" ")
      .filter((word) => !stopWords.includes(word))
      .join(" ");

    // Return null if the cleaned value is too short or just numbers
    if (cleaned.length < 2 || /^\d+$/.test(cleaned)) {
      return null;
    }

    return cleaned;
  }

  private addInsight(
    type: "preference" | "need" | "concern" | "interest",
    value: string,
    confidence: number,
    source: "explicit" | "inferred",
    metadata?: Record<string, any>,
  ): void {
    // Check if we already have this insight
    const existingInsight = this.insights.find(
      (i) => i.type === type && i.value === value,
    );

    if (!existingInsight) {
      this.insights.push({
        id: this.generateId(),
        type,
        value,
        confidence,
        timestamp: new Date(),
        source,
        ...metadata,
      });
    } else if (existingInsight.confidence < confidence) {
      // Update confidence if new extraction has higher confidence
      existingInsight.confidence = confidence;
    }
  }

  private generateId(): string {
    return `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public method to get insights summary
  getInsightsSummary(): {
    topPreferences: string[];
    primaryNeeds: string[];
    keyConcerns: string[];
    interests: string[];
    priceRange?: [number, number];
    urgency?: string;
    sentiment: string;
  } {
    const preferences = this.insights
      .filter((i) => i.type === "preference")
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((i) => i.value);

    const needs = this.insights
      .filter((i) => i.type === "need")
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map((i) => i.value);

    const concerns = this.insights
      .filter((i) => i.type === "concern")
      .map((i) => i.value);

    const interests = this.insights
      .filter((i) => i.type === "interest")
      .map((i) => i.value);

    const urgencyInsight = this.insights.find((i) =>
      i.value.startsWith("urgency_"),
    );
    const sentimentInsight = this.insights.find((i) =>
      i.value.startsWith("sentiment_"),
    );

    // Extract price range from concerns
    const priceRangeInsight = this.insights.find(
      (i) => i.value === "price_range",
    );
    let priceRange: [number, number] | undefined;
    if (priceRangeInsight && "metadata" in priceRangeInsight) {
      const metadata = priceRangeInsight as any;
      if (metadata.min !== undefined && metadata.max !== undefined) {
        priceRange = [metadata.min, metadata.max];
      }
    }

    return {
      topPreferences: preferences,
      primaryNeeds: needs,
      keyConcerns: concerns,
      interests,
      priceRange,
      urgency: urgencyInsight
        ? urgencyInsight.value.replace("urgency_", "")
        : undefined,
      sentiment: sentimentInsight
        ? sentimentInsight.value.replace("sentiment_", "")
        : "neutral",
    };
  }

  // Method to merge insights from multiple extraction sessions
  mergeInsights(newInsights: CustomerInsight[]): CustomerInsight[] {
    const mergedMap = new Map<string, CustomerInsight>();

    // Add existing insights
    this.insights.forEach((insight) => {
      const key = `${insight.type}-${insight.value}`;
      mergedMap.set(key, insight);
    });

    // Merge new insights
    newInsights.forEach((insight) => {
      const key = `${insight.type}-${insight.value}`;
      const existing = mergedMap.get(key);

      if (!existing || existing.confidence < insight.confidence) {
        mergedMap.set(key, insight);
      }
    });

    this.insights = Array.from(mergedMap.values());
    return this.insights;
  }
}
