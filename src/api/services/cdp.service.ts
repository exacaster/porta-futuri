import { createClient } from '@supabase/supabase-js';

export interface CDPCustomerData {
  customer_id: string;
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

export interface CDPIntegrationConfig {
  workspace_id: string;
  resource_id: string;
  api_url: string;
  bearer_token?: string;
}

export interface ExacasterResponse {
  userIdType: string;
  userId: string;
  dt: string;
  has_amazon_prime: number;
  has_hbo: number;
  has_netflix: number;
  home_subscriptions_count_daily: number;
  mobile_subscriptions_count_daily: number;
  mobile_subscriptions_revenue: number;
  current_phone: string;
  version: number;
  [key: string]: any;
}

export class CDPService {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, { data: CDPCustomerData; timestamp: number }>();
  private supabase: ReturnType<typeof createClient>;
  
  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  async fetchCustomer360(customerId: string): Promise<CDPCustomerData | null> {
    try {
      // Check cache first
      const cached = this.cache.get(customerId);
      if (cached && Date.now() - cached.timestamp < CDPService.CACHE_TTL) {
        console.log(`CDP: Cache hit for customer ${customerId}`);
        return cached.data;
      }

      // Get active integration
      const integration = await this.getActiveIntegration();
      if (!integration) {
        console.log('CDP: No active integration found');
        return {
          customer_id: customerId,
          cdp_available: false,
          fallback_reason: 'No active CDP integration configured'
        };
      }

      // Decrypt credentials
      let credentials: { bearer_token?: string } = {};
      if (integration.credentials_encrypted) {
        try {
          // In production, use proper decryption
          credentials = JSON.parse(atob(integration.credentials_encrypted));
        } catch (err) {
          console.error('CDP: Failed to decrypt credentials', err);
          return {
            customer_id: customerId,
            cdp_available: false,
            fallback_reason: 'Failed to decrypt CDP credentials'
          };
        }
      }

      // Build API URL
      const url = this.buildUrl(integration.config, customerId);
      console.log(`CDP: Fetching customer data from ${url}`);

      // Make API call with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.bearer_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;

      // Log request
      await this.logRequest(
        integration.id,
        customerId,
        url,
        response.status,
        responseTime,
        response.ok ? null : `HTTP ${response.status}`
      );

      if (!response.ok) {
        console.error(`CDP: API returned ${response.status}`);
        
        // Update integration status if authentication failed
        if (response.status === 401) {
          await this.deactivateIntegration(integration.id, 'Invalid credentials');
        }
        
        return {
          customer_id: customerId,
          cdp_available: false,
          fallback_reason: `CDP API returned ${response.status}`
        };
      }

      const rawData = await response.json();
      
      // Handle array response (Exacaster returns array)
      const customerData = Array.isArray(rawData) ? rawData[0] : rawData;
      
      if (!customerData) {
        return {
          customer_id: customerId,
          cdp_available: false,
          fallback_reason: 'Customer not found in CDP'
        };
      }

      // Transform and cache response
      const transformedData = this.transformResponse(customerData);
      this.cache.set(customerId, {
        data: transformedData,
        timestamp: Date.now()
      });

      console.log(`CDP: Successfully fetched data for ${customerId} in ${responseTime}ms`);
      return transformedData;

    } catch (error: any) {
      console.error('CDP: Error fetching customer data', error);
      
      const errorMessage = error.name === 'AbortError' 
        ? 'CDP request timeout (>2s)' 
        : error.message;
      
      // Log error
      if (error.name === 'AbortError') {
        await this.logRequest(
          null,
          customerId,
          '',
          0,
          2000,
          errorMessage
        );
      }
      
      return {
        customer_id: customerId,
        cdp_available: false,
        fallback_reason: errorMessage
      };
    }
  }

  private async getActiveIntegration(): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('cdp_integrations')
      .select('*')
      .eq('is_active', true)
      .eq('provider', 'exacaster')
      .single();

    if (error || !data) {
      console.error('CDP: Failed to get active integration', error);
      return null;
    }

    return data;
  }

  private buildUrl(config: any, customerId: string): string {
    const baseUrl = config.api_url || 'https://customer360.exacaster.com/courier/api/v1';
    const workspaceId = config.workspace_id;
    const resourceId = config.resource_id;

    return `${baseUrl}/workspaces/${workspaceId}/resources/${resourceId}?userId=${encodeURIComponent(customerId)}&page=0&size=1`;
  }

  private transformResponse(raw: ExacasterResponse): CDPCustomerData {
    return {
      customer_id: raw.userId || raw.userIdType,
      cdp_available: true,
      current_phone: raw.current_phone,
      subscriptions: {
        netflix: Boolean(raw.has_netflix),
        hbo: Boolean(raw.has_hbo),
        amazon_prime: Boolean(raw.has_amazon_prime),
        mobile_count: raw.mobile_subscriptions_count_daily || 0,
        home_count: raw.home_subscriptions_count_daily || 0
      },
      mobile_revenue: raw.mobile_subscriptions_revenue,
      last_updated: raw.dt,
      version: raw.version,
      raw_data: raw // Keep raw data for debugging/future use
    };
  }

  private async logRequest(
    integrationId: string | null,
    customerId: string,
    requestUrl: string,
    responseStatus: number,
    responseTimeMs: number,
    errorMessage: string | null
  ): Promise<void> {
    try {
      await this.supabase
        .from('cdp_request_logs')
        .insert({
          integration_id: integrationId,
          customer_id: customerId,
          request_url: requestUrl,
          response_status: responseStatus,
          response_time_ms: responseTimeMs,
          error_message: errorMessage
        });
    } catch (err) {
      console.error('CDP: Failed to log request', err);
    }
  }

  private async deactivateIntegration(integrationId: string, reason: string): Promise<void> {
    try {
      await this.supabase
        .from('cdp_integrations')
        .update({
          is_active: false,
          test_status: 'failed',
          last_error: reason,
          last_tested_at: new Date().toISOString()
        })
        .eq('id', integrationId);
      
      console.log(`CDP: Deactivated integration ${integrationId} - ${reason}`);
    } catch (err) {
      console.error('CDP: Failed to deactivate integration', err);
    }
  }

  // Test method for integration testing
  async testConnection(config: CDPIntegrationConfig): Promise<{ success: boolean; message: string }> {
    try {
      const testCustomerId = 'TEST_USER_123';
      const url = `${config.api_url}/workspaces/${config.workspace_id}/resources/${config.resource_id}?userId=${testCustomerId}&page=0&size=1`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.bearer_token}`,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);

      if (response.status === 401) {
        return {
          success: false,
          message: 'Invalid credentials - please check your bearer token'
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          message: 'Invalid workspace or resource ID'
        };
      }

      if (!response.ok) {
        return {
          success: false,
          message: `API returned status ${response.status}`
        };
      }

      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timeout - API took too long to respond'
        };
      }
      
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  // Clear cache for a specific customer or all customers
  clearCache(customerId?: string): void {
    if (customerId) {
      this.cache.delete(customerId);
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}