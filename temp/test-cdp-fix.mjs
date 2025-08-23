import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rvlbbgdkgneobvlyawix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTM1MTIsImV4cCI6MjA3MDQ2OTUxMn0.YN9EE0G_xCcrTt3TakvQZy0N29hQHQ0GaUx4EGWwh-E';

async function testCDPFix() {
  console.log('=== Testing CDP Fix with demo-api-key ===\n');
  
  const cdpProxyUrl = `${SUPABASE_URL}/functions/v1/cdp-proxy`;
  
  // Test with the correct API key (demo-api-key)
  console.log('Testing CDP proxy with demo-api-key (as widget will do now)...');
  console.log('URL:', cdpProxyUrl);
  console.log('Headers:');
  console.log('  X-API-Key: demo-api-key');
  console.log('  Authorization: Bearer', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  try {
    const response = await fetch(cdpProxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'demo-api-key',  // Now using the correct API key
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'fetch',
        customer_id: '37061234567'  // Test customer ID
      })
    });
    
    console.log('\nResponse Status:', response.status, response.statusText);
    
    if (response.status === 401) {
      console.log('❌ Still getting 401 Unauthorized');
      const errorText = await response.text();
      console.log('Error:', errorText);
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! CDP proxy accepted the API key');
      console.log('\nResponse data:');
      console.log('  CDP Available:', data.cdp_available);
      console.log('  Fallback Reason:', data.fallback_reason || 'None');
      
      if (data.fields) {
        console.log('  Customer Fields:', Object.keys(data.fields).length, 'fields returned');
      }
    } else {
      console.log('Response:', await response.text());
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
  
  console.log('\n=== Summary ===');
  console.log('The fix changes the widget to use "demo-api-key" instead of the Supabase ANON key.');
  console.log('This allows the widget to authenticate with the CDP proxy.');
  console.log('The CDP proxy then uses the bearer token from cdp_integrations table to call the actual CDP API.');
}

testCDPFix().catch(console.error);