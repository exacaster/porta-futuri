import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Database types
export interface Database {
  public: {
    Tables: {
      api_keys: {
        Row: {
          id: string;
          key: string;
          name: string;
          domain: string | null;
          rate_limit: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_used_at: string | null;
          usage_count: number;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          domain?: string | null;
          rate_limit?: number;
          is_active?: boolean;
        };
        Update: {
          key?: string;
          name?: string;
          domain?: string | null;
          rate_limit?: number;
          is_active?: boolean;
          last_used_at?: string | null;
          usage_count?: number;
        };
      };
      sessions: {
        Row: {
          id: string;
          api_key_id: string;
          session_id: string;
          customer_data: any;
          product_catalog_hash: string | null;
          context_data: any;
          recommendations_cache: any;
          created_at: string;
          updated_at: string;
          expires_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          api_key_id: string;
          session_id: string;
          customer_data?: any;
          product_catalog_hash?: string | null;
          context_data?: any;
          recommendations_cache?: any;
          expires_at?: string;
        };
        Update: {
          customer_data?: any;
          product_catalog_hash?: string | null;
          context_data?: any;
          recommendations_cache?: any;
          updated_at?: string;
          expires_at?: string;
          is_active?: boolean;
        };
      };
      rate_limits: {
        Row: {
          id: string;
          api_key_id: string;
          minute_bucket: string;
          request_count: number;
        };
        Insert: {
          id?: string;
          api_key_id: string;
          minute_bucket: string;
          request_count?: number;
        };
        Update: {
          request_count?: number;
        };
      };
      recommendation_logs: {
        Row: {
          id: string;
          session_id: string;
          query: string | null;
          recommendations: any;
          response_time_ms: number | null;
          cache_hit: boolean;
          fallback_used: boolean;
          clicked_product_ids: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          query?: string | null;
          recommendations: any;
          response_time_ms?: number | null;
          cache_hit?: boolean;
          fallback_used?: boolean;
          clicked_product_ids?: string[] | null;
        };
        Update: {
          clicked_product_ids?: string[] | null;
        };
      };
      widget_configs: {
        Row: {
          id: string;
          api_key_id: string;
          theme: any;
          position: string;
          features: any;
          custom_css: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          api_key_id: string;
          theme?: any;
          position?: string;
          features?: any;
          custom_css?: string | null;
        };
        Update: {
          theme?: any;
          position?: string;
          features?: any;
          custom_css?: string | null;
        };
      };
      csv_uploads: {
        Row: {
          id: string;
          session_id: string;
          file_type: "products" | "customer" | "context";
          file_hash: string;
          row_count: number | null;
          file_size_bytes: number | null;
          processing_time_ms: number | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          file_type: "products" | "customer" | "context";
          file_hash: string;
          row_count?: number | null;
          file_size_bytes?: number | null;
          processing_time_ms?: number | null;
          error_message?: string | null;
        };
        Update: {
          row_count?: number | null;
          processing_time_ms?: number | null;
          error_message?: string | null;
        };
      };
    };
  };
}

// Singleton Supabase client
let supabaseClient: SupabaseClient<Database> | null = null;

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "x-application-name": "porta-futuri-api",
        },
      },
    });
  }

  return supabaseClient;
};

// Database helper functions
export class DatabaseService {
  private client: SupabaseClient<Database>;

  constructor() {
    this.client = getSupabaseClient();
  }

  async validateApiKey(
    key: string,
  ): Promise<{ isValid: boolean; apiKeyId?: string; rateLimit?: number }> {
    const { data, error } = await this.client
      .from("api_keys")
      .select("id, rate_limit, domain, usage_count")
      .eq("key", key)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return { isValid: false };
    }

    // Update last used timestamp
    await this.client
      .from("api_keys")
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: data.usage_count + 1,
      })
      .eq("id", data.id);

    return {
      isValid: true,
      apiKeyId: data.id,
      rateLimit: data.rate_limit,
    };
  }

  async checkRateLimit(apiKeyId: string, limit: number): Promise<boolean> {
    const currentMinute = new Date();
    currentMinute.setSeconds(0, 0);

    const { data } = await this.client
      .from("rate_limits")
      .select("request_count")
      .eq("api_key_id", apiKeyId)
      .eq("minute_bucket", currentMinute.toISOString())
      .single();

    if (!data) {
      // Create new rate limit record
      await this.client.from("rate_limits").insert({
        api_key_id: apiKeyId,
        minute_bucket: currentMinute.toISOString(),
        request_count: 1,
      });
      return true;
    }

    if (data.request_count >= limit) {
      return false;
    }

    // Increment counter
    await this.client
      .from("rate_limits")
      .update({ request_count: data.request_count + 1 })
      .eq("api_key_id", apiKeyId)
      .eq("minute_bucket", currentMinute.toISOString());

    return true;
  }

  async createSession(apiKeyId: string, sessionId: string): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const { data, error } = await this.client
      .from("sessions")
      .insert({
        api_key_id: apiKeyId,
        session_id: sessionId,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data.id;
  }

  async getSession(sessionId: string): Promise<any> {
    const { data, error } = await this.client
      .from("sessions")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if session expired
    if (new Date(data.expires_at) < new Date()) {
      await this.client
        .from("sessions")
        .update({ is_active: false })
        .eq("id", data.id);
      return null;
    }

    return data;
  }

  async updateSession(sessionId: string, updates: any): Promise<void> {
    const { error } = await this.client
      .from("sessions")
      .update(updates)
      .eq("session_id", sessionId)
      .eq("is_active", true);

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  async logRecommendation(
    sessionId: string,
    query: string | null,
    recommendations: any,
    responseTime: number,
    cacheHit: boolean,
    fallbackUsed: boolean,
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return;
    }

    await this.client.from("recommendation_logs").insert({
      session_id: session.id,
      query,
      recommendations,
      response_time_ms: responseTime,
      cache_hit: cacheHit,
      fallback_used: fallbackUsed,
    });
  }

  async getWidgetConfig(apiKeyId: string): Promise<any> {
    const { data } = await this.client
      .from("widget_configs")
      .select("*")
      .eq("api_key_id", apiKeyId)
      .single();

    return (
      data || {
        theme: {},
        position: "bottom-right",
        features: { chat: true, profile: true },
        custom_css: null,
      }
    );
  }

  async logCsvUpload(
    sessionId: string,
    fileType: "products" | "customer" | "context",
    fileHash: string,
    rowCount: number,
    fileSizeBytes: number,
    processingTimeMs: number,
    errorMessage?: string,
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return;
    }

    await this.client.from("csv_uploads").insert({
      session_id: session.id,
      file_type: fileType,
      file_hash: fileHash,
      row_count: rowCount,
      file_size_bytes: fileSizeBytes,
      processing_time_ms: processingTimeMs,
      error_message: errorMessage,
    });
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.client
      .from("sessions")
      .update({ is_active: false })
      .lt("expires_at", new Date().toISOString())
      .eq("is_active", true);
  }
}

export const db = new DatabaseService();
