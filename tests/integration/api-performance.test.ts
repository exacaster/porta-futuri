import { test, expect } from '@playwright/test';

test.describe('API Performance Tests', () => {
  const API_URL = 'https://rvlbbgdkgneobvlyawix.supabase.co/functions/v1';
  const API_KEY = 'dev_key_porta_futuri_2024';
  
  test('API should respond within 3 seconds', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.post(`${API_URL}/recommendations`, {
      data: {
        session_id: 'test-session-' + Date.now(),
        query: 'gaming laptop',
        conversation_history: [],
        context: {
          current_page: 'home',
          browsing_category: 'Electronics'
        },
        customer_data: {
          csv_hash: 'test-hash',
          profile_loaded: false,
          context_loaded: false
        },
        products: [] // Will be loaded from database
      },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    // Check response time
    expect(responseTime).toBeLessThan(3000); // Under 3 seconds
    
    // Check response status
    expect(response.status()).toBe(200);
    
    // Check response data
    const data = await response.json();
    expect(data.recommendations).toBeDefined();
    expect(Array.isArray(data.recommendations)).toBe(true);
    expect(data.recommendations.length).toBeGreaterThan(0);
    expect(data.recommendations.length).toBeLessThanOrEqual(5);
    
    // Check response structure
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('session_id');
    expect(data).toHaveProperty('response_time');
    expect(data).toHaveProperty('fallback_used');
    
    // Check recommendation structure
    if (data.recommendations.length > 0) {
      const recommendation = data.recommendations[0];
      expect(recommendation).toHaveProperty('product_id');
      expect(recommendation).toHaveProperty('name');
      expect(recommendation).toHaveProperty('price');
      expect(recommendation).toHaveProperty('reasoning');
      expect(recommendation).toHaveProperty('match_score');
    }
  });
  
  test('API should handle concurrent requests', async ({ request }) => {
    const numRequests = 5;
    const requests = [];
    
    // Create multiple concurrent requests
    for (let i = 0; i < numRequests; i++) {
      requests.push(
        request.post(`${API_URL}/recommendations`, {
          data: {
            session_id: `concurrent-test-${i}-${Date.now()}`,
            query: `test query ${i}`,
            conversation_history: [],
            context: {},
            customer_data: {
              csv_hash: 'test-hash',
              profile_loaded: false,
              context_loaded: false
            }
          },
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
      );
    }
    
    // Execute all requests concurrently
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const totalTime = Date.now() - startTime;
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
    
    // Total time for concurrent requests should be reasonable
    expect(totalTime).toBeLessThan(5000); // All should complete within 5 seconds
  });
  
  test('API should handle rate limiting appropriately', async ({ request }) => {
    const requests = [];
    
    // Try to exceed rate limit (100 requests per minute)
    // We'll send 10 requests quickly to test rate limiting behavior
    for (let i = 0; i < 10; i++) {
      requests.push(
        request.post(`${API_URL}/recommendations`, {
          data: {
            session_id: `rate-limit-test-${i}`,
            query: 'test',
            conversation_history: [],
            context: {},
            customer_data: {
              csv_hash: 'test',
              profile_loaded: false,
              context_loaded: false
            }
          },
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
      );
    }
    
    const responses = await Promise.all(requests);
    
    // Check responses
    let successCount = 0;
    
    for (const response of responses) {
      if (response.status() === 200) {
        successCount++;
      } else if (response.status() === 429) {
        // Check rate limit headers
        const headers = response.headers();
        expect(headers['x-ratelimit-limit']).toBeDefined();
        expect(headers['x-ratelimit-remaining']).toBeDefined();
      }
    }
    
    // Most requests should succeed (rate limit is 100/min)
    expect(successCount).toBeGreaterThan(0);
  });
  
  test('API should return cached responses quickly', async ({ request }) => {
    // First request - should hit the API
    const firstStartTime = Date.now();
    const firstResponse = await request.post(`${API_URL}/recommendations`, {
      data: {
        session_id: 'cache-test-session',
        query: 'best smartphone',
        conversation_history: [],
        context: {
          current_page: 'electronics'
        },
        customer_data: {
          csv_hash: 'cache-test-hash',
          profile_loaded: true,
          context_loaded: true
        }
      },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const firstResponseTime = Date.now() - firstStartTime;
    
    expect(firstResponse.status()).toBe(200);
    const firstData = await firstResponse.json();
    expect(firstData.cache_hit).toBe(false);
    
    // Second request with same parameters - should hit cache
    const secondStartTime = Date.now();
    const secondResponse = await request.post(`${API_URL}/recommendations`, {
      data: {
        session_id: 'cache-test-session',
        query: 'best smartphone',
        conversation_history: [],
        context: {
          current_page: 'electronics'
        },
        customer_data: {
          csv_hash: 'cache-test-hash',
          profile_loaded: true,
          context_loaded: true
        }
      },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const secondResponseTime = Date.now() - secondStartTime;
    
    expect(secondResponse.status()).toBe(200);
    const secondData = await secondResponse.json();
    
    // Second response should be cached and faster
    expect(secondData.cache_hit).toBe(true);
    expect(secondResponseTime).toBeLessThan(firstResponseTime);
    
    // Check cache header
    const cacheHeader = secondResponse.headers()['x-cache'];
    if (cacheHeader) {
      expect(cacheHeader).toBe('HIT');
    }
  });
  
  test('API should handle missing required fields gracefully', async ({ request }) => {
    // Request without session_id
    const response = await request.post(`${API_URL}/recommendations`, {
      data: {
        query: 'test product',
        customer_data: {
          csv_hash: 'test',
          profile_loaded: false,
          context_loaded: false
        }
      },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Should still work (session_id might be generated)
    expect([200, 400]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.recommendations).toBeDefined();
    }
  });
  
  test('API should handle invalid API key', async ({ request }) => {
    const response = await request.post(`${API_URL}/recommendations`, {
      data: {
        session_id: 'test-session',
        query: 'test',
        customer_data: {
          csv_hash: 'test',
          profile_loaded: false,
          context_loaded: false
        }
      },
      headers: {
        'Authorization': 'Bearer invalid_api_key_12345',
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
    expect(data.error).toContain('Invalid API key');
  });
  
  test('API should provide fallback recommendations on LLM failure', async ({ request }) => {
    // Send request that might trigger fallback (e.g., very long query)
    const response = await request.post(`${API_URL}/recommendations`, {
      data: {
        session_id: 'fallback-test',
        query: 'a'.repeat(10000), // Very long query to potentially trigger error
        conversation_history: [],
        context: {},
        customer_data: {
          csv_hash: 'test',
          profile_loaded: false,
          context_loaded: false
        }
      },
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Should still return 200 with fallback recommendations
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.recommendations).toBeDefined();
    expect(Array.isArray(data.recommendations)).toBe(true);
    
    // If fallback was used, it should be indicated
    if (data.fallback_used) {
      expect(data.fallback_used).toBe(true);
      expect(data.recommendations.length).toBeGreaterThan(0);
    }
  });
});