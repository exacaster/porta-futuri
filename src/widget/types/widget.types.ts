/**
 * Type definitions for the Porta Futuri widget
 */

export interface WidgetConfig {
  apiKey: string;
  apiUrl?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "relative" | string;
  containerId?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  data?: {
    productCatalogUrl?: string;
    customerProfileUrl?: string;
    contextUrl?: string;
    products?: any[]; // Use any[] to avoid conflicts with shared types
  };
}

export interface CDPResponse {
  cdp_available: boolean;
  customer_id?: string;
  last_updated?: string;
  version?: number;
  fields?: Record<string, FieldValue>;
  response_time_ms?: number;
  fallback_reason?: string;
  error?: string;
}

export interface FieldValue {
  value: string | number | boolean | null;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  display_name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  brand?: string;
  stock_quantity?: number;
  image_url?: string;
  attributes?: Record<string, string | number | boolean>;
  rating?: number;
  review_count?: number;
  comments?: ProductComment[];
}

export interface ProductComment {
  author: string;
  rating: number;
  text: string;
  date?: string;
}

export interface CustomerProfile {
  customer_id: string;
  age_group?: string;
  gender?: string;
  location?: string;
  preferences?: string[];
  lifetime_value?: number;
  segment?: string;
  cdp_data?: CDPResponse;
}

export interface ContextEvent {
  timestamp: string;
  event_type: 'page_view' | 'search' | 'cart_action' | 'purchase' | 'interaction';
  session_id: string;
  product_id?: string;
  category_viewed?: string;
  search_query?: string;
  cart_action?: 'add' | 'remove' | 'update';
  url?: string;
  page_duration?: number;
}

export interface TrackingEvent {
  event_type: string;
  event_category?: string;
  event_label?: string;
  event_value?: number;
  timestamp?: string;
  response_time?: number;
  load_time?: number;
  custom_dimensions?: Record<string, string | number | boolean>;
  [key: string]: any; // Allow additional properties
}

export interface CSVParseResult<T> {
  data: T[];
  errors: CSVParseError[];
}

export interface CSVParseError {
  row?: number;
  field?: string;
  message: string;
}