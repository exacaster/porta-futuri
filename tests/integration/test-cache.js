#!/usr/bin/env node

const API_URL = 'http://127.0.0.1:54321/functions/v1/recommendations';
const API_KEY = 'test-api-key-123456789';

// Test data
const testPayload = {
  session_id: 'cache-test-session',
  query: 'test cache query',
  products: [
    {
      product_id: 'CACHE_TEST_1',
      name: 'Cache Test Product',
      category: 'Test',
      price: 99.99,
      stock_status: 'in_stock',
      ratings: 5.0
    }
  ],
  customer_data: {
    csv_hash: 'cache-test-hash',
    profile_loaded: true,
    context_loaded: false
  },
  context: {
    test: 'cache-verification'
  }
};

async function testCache() {
  console.log('🧪 Cache Test: Making two identical requests\n');
  
  // First request (should be MISS)
  console.log('Request 1: Expecting cache MISS...');
  const response1 = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testPayload)
  });
  
  const data1 = await response1.json();
  const cacheHeader1 = response1.headers.get('X-Cache');
  console.log(`✓ Response 1: X-Cache = ${cacheHeader1 || 'undefined'}`);
  console.log(`  cache_hit field = ${data1.cache_hit}`);
  console.log(`  response_time = ${data1.response_time}ms\n`);
  
  // Second request immediately (should be HIT)
  console.log('Request 2: Expecting cache HIT...');
  const response2 = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testPayload)
  });
  
  const data2 = await response2.json();
  const cacheHeader2 = response2.headers.get('X-Cache');
  console.log(`✓ Response 2: X-Cache = ${cacheHeader2 || 'undefined'}`);
  console.log(`  cache_hit field = ${data2.cache_hit}`);
  console.log(`  response_time = ${data2.response_time}ms\n`);
  
  // Verify cache worked
  if (cacheHeader2 === 'HIT' && data2.cache_hit === true) {
    console.log('✅ Cache is working correctly!');
    console.log(`   Second request was ${data1.response_time - data2.response_time}ms faster`);
  } else {
    console.log('❌ Cache not working as expected');
    console.log('   Expected X-Cache: HIT and cache_hit: true on second request');
  }
  
  // Verify response content is identical (except dynamic fields)
  const match = JSON.stringify(data1.recommendations) === JSON.stringify(data2.recommendations);
  console.log(`\n📊 Content match: ${match ? '✅ Identical' : '❌ Different'}`);
}

testCache().catch(console.error);