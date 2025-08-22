#!/usr/bin/env node

/**
 * Test CDP integration for customer HH_9139599
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rvlbbgdkgneobvlyawix.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTM1MTIsImV4cCI6MjA3MDQ2OTUxMn0.hz5d5bKI5kxLVAz9SohS4wz-Qufc8em_aQPTVJF7GhA';
const API_KEY = 'demo-api-key';
const CUSTOMER_ID = 'HH_9139599';

async function testCDPFetch() {
  console.log('Testing CDP fetch for customer:', CUSTOMER_ID);
  console.log('Using Supabase URL:', SUPABASE_URL);
  console.log('---');

  try {
    const url = `${SUPABASE_URL}/functions/v1/cdp-proxy`;
    const body = {
      action: 'fetch',
      customer_id: CUSTOMER_ID
    };

    console.log('Request URL:', url);
    console.log('Request Body:', JSON.stringify(body, null, 2));
    console.log('---');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('---');

    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
    console.log('---');

    if (data.cdp_available) {
      console.log('✅ CDP is available');
      console.log('Fields returned:', data.fields ? Object.keys(data.fields).length : 0);
      
      if (data.fields) {
        console.log('\nField Details:');
        for (const [key, field] of Object.entries(data.fields)) {
          console.log(`  - ${key}:`);
          console.log(`    Display Name: ${field.display_name}`);
          console.log(`    Type: ${field.type}`);
          console.log(`    Value: ${field.value}`);
        }
      }
    } else {
      console.log('❌ CDP not available');
      console.log('Fallback reason:', data.fallback_reason);
    }

  } catch (error) {
    console.error('Error testing CDP:', error);
  }
}

// Run the test
testCDPFetch();