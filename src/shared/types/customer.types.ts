export interface CustomerProfile {
  customer_id: string;
  age_group?: string;
  gender?: string;
  location?: string;
  purchase_history?: string[];
  preferences?: string[];
  lifetime_value?: number;
  segment?: string;
  created_at?: string;
  last_active?: string;
  cdp_data?: CDPCustomerData;
}

export interface CDPCustomerData {
  cdp_available: boolean;
  current_phone?: string;
  subscriptions?: {
    netflix: boolean;
    hbo: boolean;
    amazon_prime: boolean;
    mobile_count: number;
    home_count: number;
  };
  mobile_revenue?: number;
  last_updated?: string;
  version?: number;
  fallback_reason?: string;
  raw_data?: Record<string, any>;
}

export interface CustomerSegment {
  segment_id: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  customer_count?: number;
}

export interface CustomerPreferences {
  favorite_categories?: string[];
  favorite_brands?: string[];
  price_sensitivity?: 'low' | 'medium' | 'high';
  quality_preference?: 'budget' | 'standard' | 'premium';
  sustainability_conscious?: boolean;
  tech_savvy?: boolean;
  style_preference?: string[];
}

export interface CustomerActivity {
  timestamp: string;
  action: string;
  details?: Record<string, any>;
}

export interface CustomerSession {
  session_id: string;
  customer_id: string;
  start_time: string;
  end_time?: string;
  page_views: number;
  interactions: number;
  device_type?: string;
  browser?: string;
}

export const isValidCustomerProfile = (data: any): data is CustomerProfile => {
  return (
    typeof data === 'object' &&
    typeof data.customer_id === 'string' &&
    data.customer_id.length > 0
  );
};

export const sanitizeCustomerProfile = (raw: any): CustomerProfile => {
  const profile: CustomerProfile = {
    customer_id: String(raw.customer_id || ''),
  };

  if (raw.age_group) {profile.age_group = String(raw.age_group);}
  if (raw.gender) {profile.gender = String(raw.gender);}
  if (raw.location) {profile.location = String(raw.location);}
  if (Array.isArray(raw.purchase_history)) {
    profile.purchase_history = raw.purchase_history.map(String);
  }
  if (Array.isArray(raw.preferences)) {
    profile.preferences = raw.preferences.map(String);
  }
  if (raw.lifetime_value !== undefined) {
    profile.lifetime_value = Number(raw.lifetime_value) || 0;
  }
  if (raw.segment) {profile.segment = String(raw.segment);}
  if (raw.created_at) {profile.created_at = String(raw.created_at);}
  if (raw.last_active) {profile.last_active = String(raw.last_active);}

  return profile;
};

export const enrichCustomerProfile = (
  profile: CustomerProfile,
  preferences?: CustomerPreferences
): CustomerProfile & { preferences_detail?: CustomerPreferences } => {
  return {
    ...profile,
    preferences_detail: preferences,
  };
};