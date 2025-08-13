#!/usr/bin/env node

/**
 * CDP Connection Test Script
 * 
 * This script tests the CDP integration directly
 * Run with: node test-cdp-connection.js
 */

const SUPABASE_URL = 'https://rvlbbgdkgneobvlyawix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTM1MTIsImV4cCI6MjA3MDQ2OTUxMn0.hz5d5bKI5kxLVAz9SohS4wz-Qufc8em_aQPTVJF7GhA';

// Configuration - Update these with your actual Exacaster credentials
const CDP_CONFIG = {
  workspace_id: '765',  // Your actual workspace ID
  resource_id: 'customer_metrics',  // Your actual resource ID
  api_url: 'https://customer360.exacaster.com/courier/api/v1',
  bearer_token: 'YOUR_ACTUAL_BEARER_TOKEN'  // Replace with your actual token
};

async function testCDPConnection() {
  console.log('🔍 Testing CDP Connection...\n');
  console.log('Configuration:');
  console.log(`  Workspace ID: ${CDP_CONFIG.workspace_id}`);
  console.log(`  Resource ID: ${CDP_CONFIG.resource_id}`);
  console.log(`  API URL: ${CDP_CONFIG.api_url}`);
  console.log(`  Bearer Token: ${CDP_CONFIG.bearer_token.substring(0, 10)}...`);
  console.log('\n');

  try {
    // Test via Supabase Edge Function
    console.log('1️⃣ Testing via Supabase Edge Function...');
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/cdp-proxy`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'test',
        config: CDP_CONFIG
      })
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('✅ Connection successful!\n');
    } else {
      console.log(`❌ Connection failed: ${data.message}\n`);
    }

    // If you want to test direct Exacaster API (uncomment below)
    /*
    console.log('2️⃣ Testing direct Exacaster API...');
    const directUrl = `${CDP_CONFIG.api_url}/workspaces/${CDP_CONFIG.workspace_id}/resources/${CDP_CONFIG.resource_id}?userId=TEST_USER&page=0&size=1`;
    
    const directResponse = await fetch(directUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CDP_CONFIG.bearer_token}`,
        'Accept': 'application/json'
      }
    });

    console.log('Direct API Status:', directResponse.status);
    
    if (directResponse.ok) {
      const directData = await directResponse.json();
      console.log('Direct API Response:', JSON.stringify(directData, null, 2));
      console.log('✅ Direct API connection successful!\n');
    } else {
      console.log(`❌ Direct API failed with status: ${directResponse.status}\n`);
    }
    */

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Instructions
console.log('='.repeat(60));
console.log('CDP Connection Test Script');
console.log('='.repeat(60));
console.log('\n📝 Instructions:');
console.log('1. Edit this file and replace YOUR_ACTUAL_BEARER_TOKEN with your Exacaster token');
console.log('2. Update workspace_id and resource_id if needed');
console.log('3. Run: node test-cdp-connection.js');
console.log('4. Check the output to see if connection is successful');
console.log('\n');

// Check if bearer token was updated
if (CDP_CONFIG.bearer_token === 'YOUR_ACTUAL_BEARER_TOKEN') {
  console.log('⚠️  Warning: Please update the bearer_token before running the test!\n');
  console.log('Edit this file and replace YOUR_ACTUAL_BEARER_TOKEN with your actual token.\n');
  process.exit(1);
}

// Run the test
testCDPConnection();