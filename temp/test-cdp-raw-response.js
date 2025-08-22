#!/usr/bin/env node

/**
 * Test CDP integration to see raw response structure
 */

const SUPABASE_URL = 'https://rvlbbgdkgneobvlyawix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTM1MTIsImV4cCI6MjA3MDQ2OTUxMn0.hz5d5bKI5kxLVAz9SohS4wz-Qufc8em_aQPTVJF7GhA';

// Test directly against Exacaster API
const EXACASTER_URL = 'https://customer360.exacaster.com/courier/api/v1';
const WORKSPACE_ID = '03f088d5-8c23-48ef-a18d-21303e1c9551';
const RESOURCE_ID = '5f88e457-5419-482f-9e48-a982c93e30c6';
const BEARER_TOKEN = 'dGhpcyBpcyBub3QgYSByZWFsIHRva2VuLCBpdCBzaG91bGQgYmUgc2V0IGluIHN1cGFiYXNlIGRhc2hib2FyZA==';

async function testDirectExacaster() {
  console.log('Testing direct Exacaster API call for HH_9139599...');
  
  try {
    const url = `${EXACASTER_URL}/workspaces/${WORKSPACE_ID}/resources/${RESOURCE_ID}?userId=HH_9139599&page=0&size=1`;
    
    console.log('Request URL:', url);
    console.log('---');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Buffer.from(BEARER_TOKEN, 'base64').toString()}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Raw Exacaster Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('Error:', await response.text());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testSupabaseCDP() {
  console.log('\n=================\n');
  console.log('Testing Supabase CDP Proxy for HH_9139599...');
  
  try {
    const url = `${SUPABASE_URL}/functions/v1/cdp-proxy`;
    const body = {
      action: 'fetch',
      customer_id: 'HH_9139599'
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'demo-api-key',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Supabase CDP Response:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\nFields that should be displayed:');
      const expectedFields = [
        'customer_bbi_current_offer_price_sum_daily',
        'customer_has_bbi_fiber_available',
        'customer_has_iptv_available',
        'customer_tv_current_offer_price_sum_daily',
        'has_amazon_prime',
        'has_hbo',
        'has_netflix',
        'home_subscriptions_count_daily',
        'mobile_subscriptions_count_daily',
        'mobile_subscriptions_revenue'
      ];
      
      for (const field of expectedFields) {
        const value = data[field] || data.subscriptions?.[field] || 'NOT FOUND';
        console.log(`- ${field}: ${value}`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run both tests
(async () => {
  await testSupabaseCDP();
})();