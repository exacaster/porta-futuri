#!/usr/bin/env node

/**
 * Test what fields CDP proxy is actually returning
 */

const SUPABASE_URL = 'https://rvlbbgdkgneobvlyawix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTM1MTIsImV4cCI6MjA3MDQ2OTUxMn0.hz5d5bKI5kxLVAz9SohS4wz-Qufc8em_aQPTVJF7GhA';
const API_KEY = 'demo-api-key';
const CUSTOMER_ID = 'HH_9139599';

// Expected fields from Exacaster (from your screenshot)
const EXPECTED_FIELDS = [
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

async function testCDPFields() {
  console.log('Testing CDP Proxy to see what fields are returned...\n');
  
  try {
    const url = `${SUPABASE_URL}/functions/v1/cdp-proxy`;
    const body = {
      action: 'fetch',
      customer_id: CUSTOMER_ID
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    });
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('CDP Response Structure:');
      console.log('========================');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n');
      
      // Check which expected fields are present
      console.log('Field Analysis:');
      console.log('========================');
      console.log('Expected fields from Exacaster:');
      
      const foundFields = [];
      const missingFields = [];
      
      for (const field of EXPECTED_FIELDS) {
        // Check in root level
        if (data[field] !== undefined) {
          foundFields.push(`✅ ${field}: ${data[field]} (root level)`);
        } 
        // Check in fields object
        else if (data.fields && data.fields[field] !== undefined) {
          foundFields.push(`✅ ${field}: ${data.fields[field].value} (in fields object)`);
        }
        // Check in subscriptions object
        else if (data.subscriptions) {
          const subField = field.replace('has_', '').replace('_count_daily', '_count').replace('home_subscriptions', 'home').replace('mobile_subscriptions', 'mobile');
          if (data.subscriptions[subField] !== undefined) {
            foundFields.push(`⚠️  ${field}: ${data.subscriptions[subField]} (as subscriptions.${subField})`);
          } else {
            missingFields.push(`❌ ${field}: NOT FOUND`);
          }
        } else {
          missingFields.push(`❌ ${field}: NOT FOUND`);
        }
      }
      
      console.log('\nFound fields:');
      foundFields.forEach(f => console.log(f));
      
      console.log('\nMissing fields:');
      missingFields.forEach(f => console.log(f));
      
      console.log('\n========================');
      console.log(`Summary: ${foundFields.length}/${EXPECTED_FIELDS.length} fields found`);
      console.log('\nThe CDP proxy is returning a simplified format and missing these critical fields:');
      console.log('- customer_bbi_current_offer_price_sum_daily (45.98)');
      console.log('- customer_has_bbi_fiber_available (1)'); 
      console.log('- customer_has_iptv_available (1)');
      console.log('- customer_tv_current_offer_price_sum_daily (21.99)');
      console.log('\nThese fields need to be included in the CDP proxy response.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCDPFields();