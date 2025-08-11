export type EventType = 'page_view' | 'search' | 'cart_action' | 'purchase' | 'wishlist_action' | 'product_view' | 'filter_applied';
export type CartAction = 'add' | 'remove' | 'update_quantity';
export type WishlistAction = 'add' | 'remove';

export interface ContextEvent {
  timestamp: string;
  event_type: EventType;
  product_id?: string;
  category_viewed?: string;
  search_query?: string;
  cart_action?: CartAction;
  wishlist_action?: WishlistAction;
  session_id: string;
  page_url?: string;
  referrer?: string;
  device_type?: string;
  quantity?: number;
  price?: number;
  filters_applied?: Record<string, any>;
}

export interface RealTimeContext {
  current_page?: string;
  cart_items?: string[];
  wishlist_items?: string[];
  browsing_category?: string;
  session_duration?: number;
  previous_searches?: string[];
  pages_viewed?: number;
  time_on_site?: number;
  bounce_rate?: number;
  device_info?: DeviceInfo;
  location_data?: LocationData;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  screen_resolution?: string;
}

export interface LocationData {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  language?: string;
}

export interface BrowsingBehavior {
  session_id: string;
  total_events: number;
  unique_products_viewed: number;
  categories_browsed: string[];
  search_queries: string[];
  cart_additions: number;
  cart_removals: number;
  average_time_per_page?: number;
  engagement_score?: number;
}

export interface ContextSummary {
  recent_events: ContextEvent[];
  behavior: BrowsingBehavior;
  real_time: RealTimeContext;
  intent_signals: IntentSignals;
}

export interface IntentSignals {
  purchase_intent: 'low' | 'medium' | 'high';
  browsing_pattern: 'exploring' | 'comparing' | 'ready_to_buy';
  price_sensitivity: boolean;
  brand_loyalty: boolean;
  urgency_indicators: string[];
}

export const isValidContextEvent = (data: any): data is ContextEvent => {
  return (
    typeof data === 'object' &&
    typeof data.timestamp === 'string' &&
    typeof data.event_type === 'string' &&
    typeof data.session_id === 'string' &&
    ['page_view', 'search', 'cart_action', 'purchase', 'wishlist_action', 'product_view', 'filter_applied'].includes(data.event_type)
  );
};

export const sanitizeContextEvent = (raw: any): ContextEvent => {
  const event: ContextEvent = {
    timestamp: String(raw.timestamp || new Date().toISOString()),
    event_type: raw.event_type as EventType || 'page_view',
    session_id: String(raw.session_id || ''),
  };

  if (raw.product_id) {event.product_id = String(raw.product_id);}
  if (raw.category_viewed) {event.category_viewed = String(raw.category_viewed);}
  if (raw.search_query) {event.search_query = String(raw.search_query);}
  if (raw.cart_action) {event.cart_action = raw.cart_action as CartAction;}
  if (raw.wishlist_action) {event.wishlist_action = raw.wishlist_action as WishlistAction;}
  if (raw.page_url) {event.page_url = String(raw.page_url);}
  if (raw.referrer) {event.referrer = String(raw.referrer);}
  if (raw.device_type) {event.device_type = String(raw.device_type);}
  if (raw.quantity !== undefined) {event.quantity = Number(raw.quantity);}
  if (raw.price !== undefined) {event.price = Number(raw.price);}
  if (raw.filters_applied) {event.filters_applied = raw.filters_applied;}

  return event;
};

export const analyzeContext = (events: ContextEvent[]): BrowsingBehavior => {
  const uniqueProducts = new Set<string>();
  const categories = new Set<string>();
  const searches = new Set<string>();
  let cartAdditions = 0;
  let cartRemovals = 0;

  events.forEach(event => {
    if (event.product_id) {uniqueProducts.add(event.product_id);}
    if (event.category_viewed) {categories.add(event.category_viewed);}
    if (event.search_query) {searches.add(event.search_query);}
    if (event.cart_action === 'add') {cartAdditions++;}
    if (event.cart_action === 'remove') {cartRemovals++;}
  });

  return {
    session_id: events[0]?.session_id || '',
    total_events: events.length,
    unique_products_viewed: uniqueProducts.size,
    categories_browsed: Array.from(categories),
    search_queries: Array.from(searches),
    cart_additions: cartAdditions,
    cart_removals: cartRemovals,
  };
};