const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
      
      try {
        // Try to decode as base64
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
            
            // Test if the token looks valid
            console.log('\n=== Token Validation ===\n');
            console.log('Starts with "eyJ":', credentials.bearer_token.startsWith('eyJ'));
            console.log('Contains dots:', credentials.bearer_token.split('.').length === 3);
            
            // Now test the actual CDP API with this token
            console.log('\n=== Testing Direct CDP API Call ===\n');
            const cdpUrl = `${integration.config.api_url}/workspaces/${integration.config.workspace_id}/resources/${integration.config.resource_id}?userId=TEST_USER&page=0&size=1`;
            
            console.log('URL:', cdpUrl);
            console.log('Making request with bearer token...');
            
            const response = await fetch(cdpUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${credentials.bearer_token}`,
                'Accept': 'application/json'
              }
            });
            
            console.log('Response status:', response.status);
            console.log('Response status text:', response.statusText);
            
            if (response.status === 401) {
              console.log('\n❌ UNAUTHORIZED - The bearer token is invalid or expired');
              const responseText = await response.text();
              console.log('Response body:', responseText);
            } else if (response.ok) {
              console.log('\n✅ SUCCESS - The bearer token is valid');
              const data = await response.json();
              console.log('Response data:', JSON.stringify(data, null, 2));
            } else {
              console.log(`\n⚠️ Unexpected status: ${response.status}`);
              const responseText = await response.text();
              console.log('Response body:', responseText);
            }
          }
        } catch (jsonErr) {
          console.error('Failed to parse as JSON:', jsonErr);
          console.log('Decoded content preview:', decoded.substring(0, 100));
        }
      } catch (b64Err) {
        console.error('Failed to decode as base64:', b64Err);
        console.log('This might not be base64 encoded');
        
        // Check if it's plain text
        try {
          const plainCredentials = JSON.parse(integration.credentials_encrypted);
          console.log('It appears to be plain JSON (not base64 encoded)');
          console.log('Has bearer_token:', !!plainCredentials.bearer_token);
          
          if (plainCredentials.bearer_token) {
            console.log('\n=== Testing with plain token ===\n');
            const cdpUrl = `${integration.config.api_url}/workspaces/${integration.config.workspace_id}/resources/${integration.config.resource_id}?userId=TEST_USER&page=0&size=1`;
            
            const response = await fetch(cdpUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${plainCredentials.bearer_token}`,
                'Accept': 'application/json'
              }
            });
            
            console.log('Response status:', response.status);
            if (response.status === 401) {
              console.log('❌ Still unauthorized with plain token');
            }
          }
        } catch (plainErr) {
          console.log('Not plain JSON either');
          console.log('Raw value:', integration.credentials_encrypted);
        }
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

debugCDPAuth();