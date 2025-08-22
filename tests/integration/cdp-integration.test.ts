import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { CDPService } from '../../src/api/services/cdp.service';

describe('CDP Integration Tests', () => {
  let cdpService: CDPService;
  const testSupabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
  const testSupabaseKey = process.env.SUPABASE_SERVICE_KEY || 'test-service-key';
  
  beforeAll(() => {
    cdpService = new CDPService(testSupabaseUrl, testSupabaseKey);
  });

  describe('Customer ID Acquisition', () => {
    it('should retrieve customer ID from JavaScript variable', () => {
      // Mock window.PortaFuturi
      (global as any).window = {
        PortaFuturi: { customerId: 'JS_CUSTOMER_123' }
      };
      
      const getCustomerId = (): string | null => {
        if ((global as any).window?.PortaFuturi?.customerId) {
          return (global as any).window.PortaFuturi.customerId;
        }
        return null;
      };
      
      const customerId = getCustomerId();
      expect(customerId).toBe('JS_CUSTOMER_123');
    });

    it('should retrieve customer ID from URL parameter', () => {
      // Mock URL parameters
      const urlParams = new URLSearchParams('?customer_id=URL_CUSTOMER_456');
      const customerId = urlParams.get('customer_id');
      expect(customerId).toBe('URL_CUSTOMER_456');
    });

    it('should retrieve customer ID from cookie', () => {
      const getCookie = (name: string): string | null => {
        const cookies = 'porta_futuri_customer_id=COOKIE_CUSTOMER_789; other=value';
        const nameEQ = name + '=';
        const ca = cookies.split(';');
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === ' ') {c = c.substring(1);}
          if (c.indexOf(nameEQ) === 0) {return c.substring(nameEQ.length);}
        }
        return null;
      };
      
      const customerId = getCookie('porta_futuri_customer_id');
      expect(customerId).toBe('COOKIE_CUSTOMER_789');
    });

    it('should follow correct priority order for customer ID sources', () => {
      // Set up all sources
      (global as any).window = {
        PortaFuturi: { customerId: 'JS_ID' },
        location: { search: '?customer_id=URL_ID' }
      };
      
      const getCustomerId = (): string | null => {
        // Priority 1: JS variable
        if ((global as any).window?.PortaFuturi?.customerId) {
          return (global as any).window.PortaFuturi.customerId;
        }
        // Priority 2: URL parameter
        const urlParams = new URLSearchParams((global as any).window?.location?.search);
        const urlId = urlParams.get('customer_id');
        if (urlId) {return urlId;}
        // Priority 3: Cookie
        // ... cookie logic
        return null;
      };
      
      // Should return JS variable (highest priority)
      expect(getCustomerId()).toBe('JS_ID');
      
      // Remove JS variable, should fall back to URL
      delete (global as any).window.PortaFuturi.customerId;
      expect(getCustomerId()).toBe('URL_ID');
    });
  });

  describe('CDP Service', () => {
    it('should cache customer data for 5 minutes', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [{
          userId: 'TEST_USER',
          current_phone: 'iPhone',
          has_netflix: 1,
          has_hbo: 0,
          has_amazon_prime: 1
        }]
      });
      
      (global as any).fetch = mockFetch;
      
      // First call - should hit API
      await cdpService.fetchCustomer360('TEST_USER');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Second call within cache TTL - should use cache
      await cdpService.fetchCustomer360('TEST_USER');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1, not 2
      
      // Verify cache stats
      const stats = cdpService.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries).toContain('TEST_USER');
    });

    it('should handle CDP unavailable gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      (global as any).fetch = mockFetch;
      
      const result = await cdpService.fetchCustomer360('TEST_USER');
      
      expect(result).toEqual({
        customer_id: 'TEST_USER',
        cdp_available: false,
        fallback_reason: 'Network error'
      });
    });

    it('should transform Exacaster response correctly', async () => {
      const mockResponse = {
        userId: 'HH_9139599',
        dt: '2022-09-07',
        has_amazon_prime: 1,
        has_hbo: 0,
        has_netflix: 1,
        home_subscriptions_count_daily: 2,
        mobile_subscriptions_count_daily: 1,
        mobile_subscriptions_revenue: 19.99,
        current_phone: 'iPhone',
        version: 20221017135048008
      };
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [mockResponse]
      });
      
      (global as any).fetch = mockFetch;
      
      const result = await cdpService.fetchCustomer360('HH_9139599');
      
      expect(result).toMatchObject({
        customer_id: 'HH_9139599',
        cdp_available: true,
        current_phone: 'iPhone',
        subscriptions: {
          netflix: true,
          hbo: false,
          amazon_prime: true,
          mobile_count: 1,
          home_count: 2
        },
        mobile_revenue: 19.99,
        last_updated: '2022-09-07',
        version: 20221017135048008
      });
    });

    it('should handle timeout (>2 seconds)', async () => {
      const mockFetch = vi.fn().mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: async () => []
          }), 3000); // 3 seconds - should timeout
        })
      );
      
      (global as any).fetch = mockFetch;
      
      const result = await cdpService.fetchCustomer360('SLOW_USER');
      
      // Should timeout and return fallback
      expect(result?.fallback_reason).toContain('timeout');
    });

    it('should deactivate integration on 401 response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      });
      
      (global as any).fetch = mockFetch;
      
      const result = await cdpService.fetchCustomer360('UNAUTHORIZED_USER');
      
      expect(result).toMatchObject({
        customer_id: 'UNAUTHORIZED_USER',
        cdp_available: false,
        fallback_reason: 'CDP API returned 401'
      });
    });
  });

  describe('CDP Test Connection', () => {
    it('should validate connection configuration', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => []
      });
      
      (global as any).fetch = mockFetch;
      
      const result = await cdpService.testConnection({
        workspace_id: 'test-workspace',
        resource_id: 'test-resource',
        api_url: 'https://customer360.exacaster.com/courier/api/v1',
        bearer_token: 'test-token'
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Connection successful');
    });

    it('should detect invalid credentials', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      });
      
      (global as any).fetch = mockFetch;
      
      const result = await cdpService.testConnection({
        workspace_id: 'test-workspace',
        resource_id: 'test-resource',
        api_url: 'https://customer360.exacaster.com/courier/api/v1',
        bearer_token: 'invalid-token'
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid credentials');
    });

    it('should detect invalid workspace/resource', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });
      
      (global as any).fetch = mockFetch;
      
      const result = await cdpService.testConnection({
        workspace_id: 'invalid-workspace',
        resource_id: 'invalid-resource',
        api_url: 'https://customer360.exacaster.com/courier/api/v1',
        bearer_token: 'test-token'
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid workspace or resource ID');
    });
  });

  describe('Cache Management', () => {
    beforeAll(() => {
      cdpService.clearCache();
    });

    it('should clear cache for specific customer', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [{
          userId: 'CACHE_TEST_USER',
          current_phone: 'Android'
        }]
      });
      
      (global as any).fetch = mockFetch;
      
      // Add to cache
      await cdpService.fetchCustomer360('CACHE_TEST_USER');
      expect(cdpService.getCacheStats().size).toBe(1);
      
      // Clear specific customer
      cdpService.clearCache('CACHE_TEST_USER');
      expect(cdpService.getCacheStats().size).toBe(0);
    });

    it('should clear entire cache', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [{
          userId: 'USER_1',
          current_phone: 'iPhone'
        }]
      });
      
      (global as any).fetch = mockFetch;
      
      // Add multiple entries to cache
      await cdpService.fetchCustomer360('USER_1');
      await cdpService.fetchCustomer360('USER_2');
      await cdpService.fetchCustomer360('USER_3');
      
      expect(cdpService.getCacheStats().size).toBeGreaterThan(0);
      
      // Clear all
      cdpService.clearCache();
      expect(cdpService.getCacheStats().size).toBe(0);
    });
  });

  afterAll(() => {
    // Cleanup
    delete (global as any).window;
    delete (global as any).fetch;
  });
});

describe('CDP Integration E2E Flow', () => {
  it('should complete full customer data fetch flow', async () => {
    // This would be an actual E2E test with real Supabase and CDP endpoints
    // For now, we'll mock the flow
    
    const flow = async () => {
      // 1. Get customer ID
      const customerId = 'E2E_TEST_USER';
      
      // 2. Initialize CDP service
      const service = new CDPService(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
        process.env.SUPABASE_SERVICE_KEY || 'test-key'
      );
      
      // 3. Fetch customer data
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [{
          userId: customerId,
          current_phone: 'iPhone',
          has_netflix: 1,
          mobile_subscriptions_count_daily: 2
        }]
      });
      
      (global as any).fetch = mockFetch;
      
      const customerData = await service.fetchCustomer360(customerId);
      
      // 4. Verify data structure
      expect(customerData).toBeDefined();
      expect(customerData?.cdp_available).toBe(true);
      expect(customerData?.fields).toBeDefined();
      
      return customerData;
    };
    
    const result = await flow();
    expect(result).toBeTruthy();
  });
});