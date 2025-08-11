#!/usr/bin/env node

const API_URL = 'http://127.0.0.1:54321/functions/v1/recommendations';
const API_KEY = 'test-api-key-123456789';

// Test data
const sampleProducts = [
  {
    product_id: 'PROD001',
    name: 'Wireless Headphones',
    category: 'Electronics',
    price: 149.99,
    description: 'Premium noise-cancelling headphones',
    stock_status: 'in_stock',
    ratings: 4.5
  },
  {
    product_id: 'PROD002',
    name: 'Smart Watch',
    category: 'Electronics',
    price: 299.99,
    description: 'Fitness tracking smartwatch',
    stock_status: 'in_stock',
    ratings: 4.7
  },
  {
    product_id: 'PROD003',
    name: 'Coffee Maker',
    category: 'Home & Kitchen',
    price: 89.99,
    description: 'Programmable coffee maker',
    stock_status: 'in_stock',
    ratings: 4.2
  },
  {
    product_id: 'PROD004',
    name: 'Running Shoes',
    category: 'Sports',
    price: 129.99,
    description: 'Lightweight running shoes',
    stock_status: 'out_of_stock',
    ratings: 4.6
  },
  {
    product_id: 'PROD005',
    name: 'Yoga Mat',
    category: 'Sports',
    price: 39.99,
    description: 'Non-slip yoga mat',
    stock_status: 'in_stock',
    ratings: 4.3
  }
];

const sampleCustomerProfile = {
  customer_id: 'CUST123',
  name: 'John Doe',
  preferences: ['Electronics', 'Sports'],
  recent_views: ['PROD001', 'PROD004']
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to make API requests
async function makeRequest(testName, options = {}) {
  console.log(`\n${colors.cyan}Testing: ${testName}${colors.reset}`);
  console.log(`${colors.blue}Request:${colors.reset}`, JSON.stringify(options.body || {}, null, 2));
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey || API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(options.body || {})
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    console.log(`${colors.blue}Status:${colors.reset} ${response.status}`);
    console.log(`${colors.blue}Response Time:${colors.reset} ${responseTime}ms`);
    console.log(`${colors.blue}Headers:${colors.reset}`);
    console.log('  X-RateLimit-Limit:', response.headers.get('X-RateLimit-Limit'));
    console.log('  X-RateLimit-Remaining:', response.headers.get('X-RateLimit-Remaining'));
    console.log('  X-Cache:', response.headers.get('X-Cache'));
    console.log(`${colors.blue}Response:${colors.reset}`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`${colors.green}✓ Test passed${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Test failed with status ${response.status}${colors.reset}`);
    }
    
    return { response, data, responseTime };
  } catch (error) {
    console.log(`${colors.red}✗ Test failed with error: ${error.message}${colors.reset}`);
    return { error, responseTime: Date.now() - startTime };
  }
}

// Sleep helper
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log(`${colors.yellow}=================================`);
  console.log(`Backend Function Tests`);
  console.log(`API URL: ${API_URL}`);
  console.log(`==================================${colors.reset}`);

  // Test 1: Missing API Key
  await makeRequest('1. Missing API Key', {
    apiKey: '',
    body: {
      session_id: 'test-session-1',
      products: sampleProducts
    }
  });

  // Test 2: Invalid API Key
  await makeRequest('2. Invalid API Key', {
    apiKey: 'invalid-key-123',
    body: {
      session_id: 'test-session-2',
      products: sampleProducts
    }
  });

  // Test 3: Valid Request with Products
  const test3 = await makeRequest('3. Valid Request with Products', {
    body: {
      session_id: 'test-session-3',
      query: 'wireless headphones',
      products: sampleProducts,
      customer_profile: sampleCustomerProfile,
      customer_data: {
        csv_hash: 'test-hash-123',
        profile_loaded: true,
        context_loaded: false
      },
      context: {
        page: 'product-listing',
        category: 'Electronics'
      }
    }
  });

  // Test 4: Request without query (browse mode)
  await makeRequest('4. Browse Mode (no query)', {
    body: {
      session_id: 'test-session-4',
      products: sampleProducts,
      customer_data: {
        csv_hash: 'test-hash-456',
        profile_loaded: false,
        context_loaded: false
      },
      context: {}
    }
  });

  // Test 5: Cache Hit Test (repeat previous request)
  console.log(`\n${colors.yellow}Waiting 2 seconds before cache test...${colors.reset}`);
  await sleep(2000);
  
  await makeRequest('5. Cache Hit Test (repeat of test 3)', {
    body: {
      session_id: 'test-session-3',
      query: 'wireless headphones',
      products: sampleProducts,
      customer_profile: sampleCustomerProfile,
      customer_data: {
        csv_hash: 'test-hash-123',
        profile_loaded: true,
        context_loaded: false
      },
      context: {
        page: 'product-listing',
        category: 'Electronics'
      }
    }
  });

  // Test 6: Empty Products Array
  await makeRequest('6. Empty Products Array', {
    body: {
      session_id: 'test-session-5',
      products: [],
      customer_data: {
        csv_hash: 'empty-hash',
        profile_loaded: false,
        context_loaded: false
      },
      context: {}
    }
  });

  // Test 7: Session Persistence
  const sessionId = 'persistent-session-' + Date.now();
  await makeRequest('7a. Create Session', {
    body: {
      session_id: sessionId,
      products: sampleProducts.slice(0, 2),
      customer_data: {
        csv_hash: 'session-hash',
        profile_loaded: true,
        context_loaded: true
      }
    }
  });

  await makeRequest('7b. Use Same Session', {
    body: {
      session_id: sessionId,
      query: 'update my recommendations',
      products: sampleProducts,
      customer_data: {
        csv_hash: 'session-hash',
        profile_loaded: true,
        context_loaded: true
      }
    }
  });

  // Test 8: Rate Limiting
  console.log(`\n${colors.yellow}Testing Rate Limiting (sending 5 rapid requests)...${colors.reset}`);
  const rateLimitPromises = [];
  for (let i = 0; i < 5; i++) {
    rateLimitPromises.push(
      makeRequest(`8. Rate Limit Test ${i + 1}`, {
        body: {
          session_id: `rate-limit-test-${i}`,
          products: sampleProducts.slice(0, 1),
          customer_data: {
            csv_hash: 'rate-limit-hash',
            profile_loaded: false,
            context_loaded: false
          }
        }
      })
    );
  }
  await Promise.all(rateLimitPromises);

  // Test 9: Malformed Request
  await makeRequest('9. Malformed Request (invalid JSON structure)', {
    body: {
      invalid_field: 'test',
      // Missing required fields
    }
  });

  // Test 10: Performance Test
  console.log(`\n${colors.yellow}Performance Test: Checking response times...${colors.reset}`);
  const perfResults = [];
  for (let i = 0; i < 3; i++) {
    const result = await makeRequest(`10. Performance Test ${i + 1}`, {
      body: {
        session_id: `perf-test-${i}`,
        products: sampleProducts,
        customer_data: {
          csv_hash: `perf-hash-${i}`,
          profile_loaded: true,
          context_loaded: true
        }
      }
    });
    if (result.responseTime) {
      perfResults.push(result.responseTime);
    }
    await sleep(1000); // Wait between requests
  }

  if (perfResults.length > 0) {
    const avgTime = perfResults.reduce((a, b) => a + b, 0) / perfResults.length;
    const maxTime = Math.max(...perfResults);
    console.log(`\n${colors.cyan}Performance Summary:${colors.reset}`);
    console.log(`  Average Response Time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Max Response Time: ${maxTime}ms`);
    console.log(`  P95 Target: <3000ms - ${maxTime < 3000 ? colors.green + '✓ PASS' : colors.red + '✗ FAIL'}${colors.reset}`);
  }

  console.log(`\n${colors.yellow}=================================`);
  console.log(`Tests Complete!`);
  console.log(`==================================${colors.reset}`);
}

// Run tests
runTests().catch(console.error);