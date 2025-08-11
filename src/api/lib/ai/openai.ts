import OpenAI from 'openai';
import { Product, Recommendation } from '@shared/types';
import { promptBuilder } from './promptBuilder';

export class OpenAIService {
  private client: OpenAI | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  /**
   * Check if OpenAI service is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Get product recommendations using GPT-4
   */
  async getRecommendations(
    query: string | undefined,
    products: Product[],
    profile: any,
    context: any,
    conversationHistory?: any[]
  ): Promise<{ recommendations: Recommendation[]; message: string }> {
    if (!this.client) {
      throw new Error('OpenAI service not configured');
    }

    const systemPrompt = promptBuilder.buildSystemPrompt();
    const userPrompt = promptBuilder.buildUserPrompt(
      query,
      products,
      profile,
      context,
      conversationHistory
    );

    return this.withRetry(async () => {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const responseText = response.choices[0]?.message?.content || '';
      
      // Parse the response
      const { recommendations, message } = promptBuilder.parseRecommendationResponse(responseText);

      // Enrich recommendations with product data
      const enrichedRecommendations = this.enrichRecommendations(recommendations, products);

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
    conversationHistory?: any[]
  ): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      throw new Error('OpenAI service not configured');
    }

    const systemPrompt = promptBuilder.buildSystemPrompt();
    const userPrompt = promptBuilder.buildUserPrompt(
      query,
      products,
      profile,
      context,
      conversationHistory
    );

    const stream = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Enrich recommendation data with full product details
   */
  private enrichRecommendations(
    recommendations: any[],
    products: Product[]
  ): Recommendation[] {
    const productMap = new Map(products.map(p => [p.product_id, p]));
    
    return recommendations
      .map(rec => {
        const product = productMap.get(rec.product_id);
        if (!product) {return null;}

        return {
          ...product,
          reasoning: rec.reasoning || 'Recommended based on your preferences',
          match_score: rec.match_score || 75,
          position: rec.position
        } as Recommendation;
      })
      .filter((rec): rec is Recommendation => rec !== null);
  }

  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES
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
    
    throw lastError || new Error('Max retries exceeded');
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get token count using tiktoken estimation
   */
  estimateTokens(text: string): number {
    // Rough estimate for GPT-4: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if we should fallback to this service
   */
  shouldFallback(error: any): boolean {
    // Fallback on rate limits, timeouts, or service errors
    const errorStatus = error?.status || error?.response?.status;
    return errorStatus === 429 || errorStatus === 503 || errorStatus === 504;
  }
}

export const openAIService = new OpenAIService();