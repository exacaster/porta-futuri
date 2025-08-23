const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function debugCDPAuth() {
  console.log('\n=== CDP Integration Debug ===\n');
  
  try {
    // Get the active CDP integration
    const { data: integration, error } = await supabase
      .from('cdp_integrations')
      .select('*')
      .eq('is_active', true)
      .eq('provider', 'exacaster')
      .single();
    
    if (error) {
      console.error('Error fetching integration:', error);
      return;
    }
    
    if (!integration) {
      console.log('No active CDP integration found');
      return;
    }
    
    console.log('Integration found:');
    console.log('- ID:', integration.id);
    console.log('- Name:', integration.name);
    console.log('- Provider:', integration.provider);
    console.log('- Is Active:', integration.is_active);
    console.log('- Test Status:', integration.test_status);
    console.log('- Last Error:', integration.last_error);
    console.log('- Config:', JSON.stringify(integration.config, null, 2));
    
    // Check credentials_encrypted field
    console.log('\n=== Credentials Analysis ===\n');
    console.log('credentials_encrypted exists:', !!integration.credentials_encrypted);
    console.log('credentials_encrypted length:', integration.credentials_encrypted?.length || 0);
    
    if (integration.credentials_encrypted) {
      console.log('First 50 chars:', integration.credentials_encrypted.substring(0, 50));
      
      // Check if it's stored as plain bearer token (not JSON)
      if (!integration.credentials_encrypted.startsWith('{') && !integration.credentials_encrypted.startsWith('ey')) {
        // It might be base64 encoded
        try {
          const decoded = Buffer.from(integration.credentials_encrypted, 'base64').toString('utf-8');
          console.log('\nBase64 decoded successfully');
          console.log('Decoded length:', decoded.length);
          
          try {
            // Try to parse as JSON
            const credentials = JSON.parse(decoded);
            console.log('\nJSON parsed successfully');
            console.log('Has bearer_token:', !!credentials.bearer_token);
            if (credentials.bearer_token) {
              console.log('Bearer token length:', credentials.bearer_token.length);
              console.log('Bearer token preview:', credentials.bearer_token.substring(0, 30) + '...');
              
              // Test the actual CDP API with this token
              await testCDPToken(integration, credentials.bearer_token);
            }
          } catch (jsonErr) {
            console.error('Failed to parse as JSON:', jsonErr);
            console.log('Decoded content preview:', decoded.substring(0, 100));
          }
        } catch (b64Err) {
          console.error('Failed to decode as base64:', b64Err);
        }
      } else if (integration.credentials_encrypted.startsWith('{')) {
        // Plain JSON
        try {
          const credentials = JSON.parse(integration.credentials_encrypted);
          console.log('Stored as plain JSON');
          console.log('Has bearer_token:', !!credentials.bearer_token);
          if (credentials.bearer_token) {
            await testCDPToken(integration, credentials.bearer_token);
          }
        } catch (err) {
          console.error('Failed to parse plain JSON:', err);
        }
      } else if (integration.credentials_encrypted.startsWith('ey')) {
        // Direct bearer token
        console.log('Stored as direct bearer token');
        await testCDPToken(integration, integration.credentials_encrypted);
      }
    }
    
    // Check the edge function logs
    console.log('\n=== Recent CDP Request Logs ===\n');
    const { data: logs } = await supabase
      .from('cdp_request_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        console.log(`- ${log.created_at}: Status ${log.response_status}, ${log.response_time_ms}ms`);
        if (log.error_message) {
          console.log(`  Error: ${log.error_message}`);
        }
      });
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function testCDPToken(integration, token) {
  console.log('\n=== Testing Direct CDP API Call ===\n');
  const cdpUrl = `${integration.config.api_url}/workspaces/${integration.config.workspace_id}/resources/${integration.config.resource_id}?userId=TEST_USER&page=0&size=1`;
  
  console.log('URL:', cdpUrl);
  console.log('Token length:', token.length);
  console.log('Token preview:', token.substring(0, 30) + '...');
  console.log('Making request with bearer token...');
  
  try {
    const response = await fetch(cdpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    if (response.status === 401) {
      console.log('\n❌ UNAUTHORIZED - The bearer token is invalid or expired');
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
      // Provide a solution
      console.log('\n=== SOLUTION ===');
      console.log('The bearer token stored in the database is not being accepted by the CDP API.');
      console.log('Please ensure you have the correct bearer token from Exacaster.');
      console.log('You can update it in the Admin Panel > Integrations tab.');
    } else if (response.ok) {
      console.log('\n✅ SUCCESS - The bearer token is valid');
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      console.log(`\n⚠️ Unexpected status: ${response.status}`);
      const responseText = await response.text();
      console.log('Response body:', responseText);
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

debugCDPAuth().catch(console.error);