import Anthropic from "@anthropic-ai/sdk";
import {
  Product,
  Recommendation,
  ConversationContext,
  ConversationState,
} from "@shared/types";
import { promptBuilder } from "./promptBuilder";
import {
  buildConversationalPrompt,
  getBridgeProducts,
} from "./prompts/conversational.prompts";
import { InsightExtractor } from "./insightExtractor";

export class ClaudeService {
  private client: Anthropic | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // Start with 1 second

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({
        apiKey: apiKey,
      });
    }
  }

  /**
   * Check if Claude service is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Get product recommendations using Claude
   */
  async getRecommendations(
    query: string | undefined,
    products: Product[],
    profile: any,
    context: any,
    conversationHistory?: any[],
  ): Promise<{ recommendations: Recommendation[]; message: string }> {
    if (!this.client) {
      throw new Error("Claude service not configured");
    }

    const systemPrompt = promptBuilder.buildSystemPrompt();
    const userPrompt = promptBuilder.buildUserPrompt(
      query,
      products,
      profile,
      context,
      conversationHistory,
    );

    return this.withRetry(async () => {
      const response = await this.client!.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      // Extract text from response
      const responseText = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");

      // Parse the response
      const { recommendations, message } =
        promptBuilder.parseRecommendationResponse(responseText);

      // Enrich recommendations with product data
      const enrichedRecommendations = this.enrichRecommendations(
        recommendations,
        products,
      );

      return { recommendations: enrichedRecommendations, message };
    });
  }

  /**
   * Get streaming recommendations (for real-time chat)
   */
  async *getStreamingRecommendations(
    query: string,
    products: Product[],
    profile: any,
    context: any,
    conversationHistory?: any[],
  ): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error("Claude service not configured");
    }

    const systemPrompt = promptBuilder.buildSystemPrompt();
    const userPrompt = promptBuilder.buildUserPrompt(
      query,
      products,
      profile,
      context,
      conversationHistory,
    );

    const stream = await this.client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        yield chunk.delta.text;
      }
    }
  }

  /**
   * Enrich recommendation data with full product details
   */
  private enrichRecommendations(
    recommendations: any[],
    products: Product[],
  ): Recommendation[] {
    const productMap = new Map(products.map((p) => [p.product_id, p]));

    return recommendations
      .map((rec) => {
        const product = productMap.get(rec.product_id);
        if (!product) {
          return null;
        }

        return {
          ...product,
          reasoning: rec.reasoning || "Recommended based on your preferences",
          match_score: rec.match_score || 75,
          position: rec.position,
        } as Recommendation;
      })
      .filter((rec): rec is Recommendation => rec !== null);
  }

  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on non-retryable errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (i < retries - 1) {
          const delay = this.RETRY_DELAY * Math.pow(2, i);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: any): boolean {
    // Don't retry on authentication errors or invalid requests
    if (error?.status === 401 || error?.status === 400) {
      return true;
    }
    return false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get conversational recommendations with natural dialogue
   */
  async getConversationalRecommendations(
    query: string,
    products: Product[],
    profile: any,
    context: any,
    conversationHistory: any[],
    conversationContext: ConversationContext,
    redirectPrompt?: string,
  ): Promise<{
    response: string;
    recommendations?: Recommendation[];
    nextState: ConversationState;
    bridgeProducts?: string[];
  }> {
    if (!this.client) {
      throw new Error("Claude service not configured");
    }

    // Extract insights from conversation
    const insightExtractor = new InsightExtractor();
    const insights =
      insightExtractor.extractFromConversation(conversationHistory);

    // Build conversational system prompt
    const systemPrompt = buildConversationalPrompt(
      conversationContext.currentState.toString(),
      conversationContext,
      insights,
      conversationContext.topicStack[conversationContext.topicStack.length - 1]
        ?.subject,
    );

    // Build user prompt with conversation context
    let userPrompt = promptBuilder.buildUserPrompt(
      query,
      products,
      profile,
      context,
      conversationHistory,
    );

    // Add redirect instruction if needed
    if (redirectPrompt) {
      userPrompt += `\n\nIMPORTANT: Naturally incorporate this transition into your response: "${redirectPrompt}"\n`;
    }

    // Add conversation state guidance
    userPrompt += this.getStateGuidance(conversationContext.currentState);

    return this.withRetry(async () => {
      const response = await this.client!.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1500,
        temperature: 0.8, // Slightly higher for more natural conversation
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      // Extract text from response
      const responseText = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");

      // Parse conversational response
      const parsed = this.parseConversationalResponse(
        responseText,
        conversationContext,
      );

      // Get bridge products if transitioning topics
      const bridgeProducts =
        conversationContext.topicStack.length > 0
          ? getBridgeProducts(
              conversationContext.topicStack[
                conversationContext.topicStack.length - 1
              ].subject,
            )
          : [];

      return {
        ...parsed,
        bridgeProducts,
      };
    });
  }

  /**
   * Parse conversational response with state awareness
   */
  private parseConversationalResponse(
    response: string,
    context: ConversationContext,
  ): {
    response: string;
    recommendations?: Recommendation[];
    nextState: ConversationState;
  } {
    // Try to extract structured data if present
    const jsonMatch = response.match(/```json([\s\S]*?)```/);
    let recommendations: Recommendation[] | undefined;
    let cleanResponse = response;

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.recommendations) {
          recommendations = data.recommendations;
        }
        // Remove JSON from response
        cleanResponse = response.replace(/```json[\s\S]*?```/, "").trim();
      } catch (e) {
        // JSON parsing failed, continue with plain response
      }
    }

    // Determine next state based on response content
    let nextState = context.currentState;

    if (
      cleanResponse.toLowerCase().includes("recommendation") ||
      recommendations
    ) {
      nextState = ConversationState.RECOMMENDATION;
    } else if (
      cleanResponse.toLowerCase().includes("compare") ||
      cleanResponse.toLowerCase().includes("difference")
    ) {
      nextState = ConversationState.COMPARISON;
    } else if (
      cleanResponse.toLowerCase().includes("checkout") ||
      cleanResponse.toLowerCase().includes("purchase")
    ) {
      nextState = ConversationState.CHECKOUT_ASSISTANCE;
    } else if (context.generalTurns >= 2) {
      nextState = ConversationState.PRODUCT_DISCOVERY;
    }

    return {
      response: cleanResponse,
      recommendations,
      nextState,
    };
  }

  /**
   * Get state-specific guidance for the AI
   */
  private getStateGuidance(state: ConversationState): string {
    const guidance: Record<ConversationState, string> = {
      [ConversationState.GREETING]:
        "\n\nBe welcoming and ask how you can help today.",
      [ConversationState.GENERAL_CHAT]:
        "\n\nEngage naturally but look for opportunities to help with shopping.",
      [ConversationState.PRODUCT_DISCOVERY]:
        "\n\nHelp explore product options based on their needs.",
      [ConversationState.RECOMMENDATION]:
        "\n\nProvide specific product recommendations with clear reasoning.",
      [ConversationState.COMPARISON]:
        "\n\nHelp compare products clearly and objectively.",
      [ConversationState.CHECKOUT_ASSISTANCE]:
        "\n\nGuide through the purchase process helpfully.",
    };

    return guidance[state] || "";
  }

  /**
   * Get token count estimate for a prompt
   */
  estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Optimize prompt to reduce tokens
   */
  optimizePrompt(prompt: string, maxTokens: number = 3000): string {
    const estimated = this.estimateTokens(prompt);

    if (estimated <= maxTokens) {
      return prompt;
    }

    // Truncate prompt intelligently
    // Priority: Keep query, recent context, trim product list
    const lines = prompt.split("\n");
    const priorityLines: string[] = [];
    const productLines: string[] = [];
    let inProductSection = false;

    for (const line of lines) {
      if (line.includes("AVAILABLE PRODUCTS:")) {
        inProductSection = true;
      } else if (line.includes("CUSTOMER REQUEST:") || line.includes("TASK:")) {
        inProductSection = false;
      }

      if (inProductSection) {
        productLines.push(line);
      } else {
        priorityLines.push(line);
      }
    }

    // Keep priority lines and trim product lines
    const maxProductTokens =
      maxTokens - this.estimateTokens(priorityLines.join("\n"));
    const trimmedProductLines = this.trimToTokenLimit(
      productLines,
      maxProductTokens,
    );

    return [
      ...priorityLines.slice(0, -1),
      ...trimmedProductLines,
      priorityLines[priorityLines.length - 1],
    ].join("\n");
  }

  /**
   * Trim lines to fit within token limit
   */
  private trimToTokenLimit(lines: string[], maxTokens: number): string[] {
    const result: string[] = [];
    let currentTokens = 0;

    for (const line of lines) {
      const lineTokens = this.estimateTokens(line);
      if (currentTokens + lineTokens > maxTokens) {
        break;
      }
      result.push(line);
      currentTokens += lineTokens;
    }

    return result;
  }
}

export const claudeService = new ClaudeService();
