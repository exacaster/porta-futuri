import { createClient } from '@supabase/supabase-js';

// Use the correct Supabase project
const SUPABASE_URL = 'https://rvlbbgdkgneobvlyawix.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg5MzUxMiwiZXhwIjoyMDcwNDY5NTEyfQ.hck8AJa6DDDnxYB9_oTSh8k--KDzg33Ocf1rjM1O-c8';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTM1MTIsImV4cCI6MjA3MDQ2OTUxMn0.YN9EE0G_xCcrTt3TakvQZy0N29hQHQ0GaUx4EGWwh-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testCDPWidget() {
  console.log('=== Testing CDP Proxy 401 Issue ===\n');
  
  // 1. Check API keys
  console.log('1. Checking API Keys in database...');
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('key, domain, is_active')
    .eq('is_active', true);
  
  if (!apiKeys || apiKeys.length === 0) {
    console.log('❌ No active API keys found! This is the problem.');
    console.log('The widget is sending an X-API-Key header but there are no valid keys in the database.');
    console.log('\nFix: Add an API key to the database.');
    return;
  }
  
  console.log('✅ Found active API keys:', apiKeys.length);
  const testApiKey = apiKeys[0].key;
  console.log('Using API key:', testApiKey.substring(0, 20) + '...');
  
  // 2. Test CDP proxy with API key (like widget does)
  console.log('\n2. Testing CDP proxy with API key (simulating widget call)...');
  
  const cdpProxyUrl = `${SUPABASE_URL}/functions/v1/cdp-proxy`;
  
  // Test as widget would call it
  console.log('Making request to:', cdpProxyUrl);
  console.log('Headers:');
  console.log('  X-API-Key:', testApiKey.substring(0, 20) + '...');
  console.log('  Authorization: Bearer', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  try {
    const response = await fetch(cdpProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': testApiKey,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'fetch',
        customer_id: '37061234567'
      })
    });
    
    console.log('\nResponse Status:', response.status, response.statusText);
    
    if (response.status === 401) {
      console.log('❌ Got 401 Unauthorized!');
      const errorText = await response.text();
      console.log('Error response:', errorText);
      
      // Check if it's API key issue
      if (errorText.includes('Invalid or inactive API key')) {
        console.log('\nProblem: The API key is invalid or inactive.');
        console.log('Solution: Check that the API key in the database matches what the widget is sending.');
      } else if (errorText.includes('Missing API key')) {
        console.log('\nProblem: The X-API-Key header is not being sent.');
        console.log('Solution: Check widget configuration to ensure apiKey is set.');
      }
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! CDP proxy returned data.');
      console.log('CDP Available:', data.cdp_available);
      if (data.error) {
        console.log('CDP Error:', data.error);
      }
    } else {
      console.log('⚠️ Unexpected response:', response.status);
      const text = await response.text();
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
  
  // 3. Check CDP integration status
  console.log('\n3. Checking CDP Integration status...');
  const { data: cdpIntegration } = await supabase
    .from('cdp_integrations')
    .select('is_active, test_status, last_error')
    .eq('provider', 'exacaster')
    .single();
  
  if (cdpIntegration) {
    console.log('CDP Integration:');
    console.log('  Active:', cdpIntegration.is_active);
    console.log('  Test Status:', cdpIntegration.test_status);
    console.log('  Last Error:', cdpIntegration.last_error);
    
    if (!cdpIntegration.is_active) {
      console.log('\n⚠️ CDP Integration is disabled!');
      console.log('This might have been disabled after a 401 error.');
      console.log('Fix: Re-enable it in the Admin Panel.');
    }
  }
  
  // 4. Provide solution
  console.log('\n=== SOLUTION ===');
  console.log('The 401 error is likely caused by one of these issues:');
  console.log('1. No API key in the database for the widget to use');
  console.log('2. The widget is not configured with a valid API key');
  console.log('3. The CDP integration was disabled after previous 401 errors');
  console.log('\nTo fix:');
  console.log('1. Ensure there is an active API key in the api_keys table');
  console.log('2. Check that the widget has access to this API key (via environment variable or config)');
  console.log('3. Re-enable the CDP integration if it was disabled');
}

testCDPWidget().catch(console.error);