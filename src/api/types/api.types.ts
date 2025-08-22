import {
  Product,
  Recommendation,
  CustomerProfile,
  ContextEvent,
} from "@shared/types";

// Request/Response types for API endpoints
export interface RecommendationRequest {
  session_id: string;
  query?: string;
  conversation_history?: ConversationMessage[];
  context: {
    current_page?: string;
    cart_items?: string[];
    wishlist_items?: string[];
    browsing_category?: string;
    session_duration?: number;
    previous_searches?: string[];
  };
  customer_data: {
    csv_hash: string;
    profile_loaded: boolean;
    context_loaded: boolean;
  };
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  message: string;
  session_id: string;
  response_time: number;
  cache_hit: boolean;
  fallback_used: boolean;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ProfileUpdateRequest {
  session_id: string;
  profile: Partial<CustomerProfile>;
  events?: ContextEvent[];
}

export interface ProfileUpdateResponse {
  success: boolean;
  profile: CustomerProfile;
  updated_at: string;
}

export interface WidgetConfigRequest {
  api_key: string;
}

export interface WidgetConfigResponse {
  theme: {
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
    border_radius?: string;
    dark_mode?: boolean;
  };
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  features: {
    chat: boolean;
    profile: boolean;
    analytics: boolean;
  };
  custom_css?: string;
}

export interface CSVUploadRequest {
  session_id: string;
  file_type: "products" | "customer" | "context";
  data: string; // Base64 encoded CSV content
}

export interface CSVUploadResponse {
  success: boolean;
  file_type: string;
  rows_processed: number;
  processing_time: number;
  errors?: string[];
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  retry_after?: number; // For rate limiting
}

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  services: {
    database: boolean;
    ai_primary: boolean;
    ai_fallback: boolean;
    cache: boolean;
  };
}

// API Headers
export interface ApiHeaders {
  Authorization: string; // Bearer token
  "X-Session-ID": string;
  "X-Request-ID"?: string;
  "X-Client-Version"?: string;
  "Content-Type": "application/json";
}

// Rate limit response headers
export interface RateLimitHeaders {
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
}

// WebSocket message types for real-time features
export interface WebSocketMessage {
  type:
    | "profile_update"
    | "context_update"
    | "recommendation"
    | "ping"
    | "pong";
  payload: any;
  timestamp: string;
}

export interface WebSocketProfileUpdate {
  type: "profile_update";
  payload: {
    profile: CustomerProfile;
    changes: string[];
  };
  timestamp: string;
}

export interface WebSocketContextUpdate {
  type: "context_update";
  payload: {
    event: ContextEvent;
    summary: {
      total_events: number;
      recent_categories: string[];
      intent_signal: "browsing" | "comparing" | "purchasing";
    };
  };
  timestamp: string;
}

// Batch operations
export interface BatchRecommendationRequest {
  requests: RecommendationRequest[];
  priority?: "normal" | "high";
}

export interface BatchRecommendationResponse {
  results: RecommendationResponse[];
  batch_id: string;
  processing_time: number;
}

// Analytics event types
export interface AnalyticsEvent {
  event_type:
    | "widget_loaded"
    | "recommendation_requested"
    | "recommendation_clicked"
    | "profile_viewed"
    | "chat_initiated";
  session_id: string;
  timestamp: string;
  properties?: Record<string, any>;
}

// CSV parsing types
export interface CSVParseResult<T> {
  data: T[];
  errors: CSVParseError[];
  meta: {
    fields: string[];
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
  };
}

export interface CSVParseError {
  type:
    | "FieldMismatch"
    | "InvalidValue"
    | "MissingRequiredField"
    | "TooManyFields";
  code: string;
  message: string;
  row: number;
  field?: string;
}

// Static fallback data
export interface StaticRecommendation {
  category: string;
  products: Product[];
  message: string;
}

// API Error codes
export enum ApiErrorCode {
  INVALID_API_KEY = "INVALID_API_KEY",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  INVALID_CSV_FORMAT = "INVALID_CSV_FORMAT",
  CSV_TOO_LARGE = "CSV_TOO_LARGE",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

// Utility type for API responses
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ErrorResponse };
