const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function testCDPIntegration(customerId) {
  try {
    console.log('1. Fetching active CDP integration from database...');
    
    const { data: integration, error: integrationError } = await supabase
      .from('cdp_integrations')
      .select('*')
      .eq('is_active', true)
      .eq('provider', 'exacaster')
      .single();

    if (integrationError || !integration) {
      console.error('No active CDP integration found:', integrationError);
      return;
    }

    console.log('2. Found integration:', {
      id: integration.id,
      provider: integration.provider,
      workspace_id: integration.config?.workspace_id,
      resource_id: integration.config?.resource_id
    });

    // Decrypt credentials
    let credentials = {};
    if (integration.credentials_encrypted) {
      try {
        credentials = JSON.parse(Buffer.from(integration.credentials_encrypted, 'base64').toString());
        console.log('3. Decrypted credentials, bearer token length:', credentials.bearer_token?.length);
      } catch (err) {
        console.error('Failed to decrypt credentials:', err);
        return;
      }
    } else {
      console.error('No encrypted credentials found');
      return;
    }

    // Build CDP URL
    const baseUrl = integration.config.api_url || 'https://customer360.exacaster.com/courier/api/v1';
    const cdpUrl = `${baseUrl}/workspaces/${integration.config.workspace_id}/resources/${integration.config.resource_id}?userId=${encodeURIComponent(customerId)}&page=0&size=1`;
    
    console.log('4. Making CDP API call to:', cdpUrl);

    // Make the API call
    const response = await fetch(cdpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.bearer_token}`,
        'Accept': 'application/json'
      }
    });

    console.log('5. Response status:', response.status);
    console.log('   Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('   Error response:', errorText);
      
      if (response.status === 401) {
        console.error('   ❌ Authentication failed - bearer token is invalid');
      } else if (response.status === 404) {
        console.error('   ❌ Customer not found or invalid workspace/resource');
      }
      return;
    }

    const data = await response.json();
    console.log('6. ✅ Success! CDP data retrieved:');
    console.log(JSON.stringify(data, null, 2));

    // Test via cdp-proxy edge function
    console.log('\n7. Testing via cdp-proxy edge function...');
    const proxyUrl = `${supabaseUrl}/functions/v1/cdp-proxy`;
    
    // First get an API key for testing
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('key')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!apiKey) {
      console.log('   No active API key found, skipping proxy test');
      return;
    }

    const proxyResponse = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey.key
      },
      body: JSON.stringify({
        action: 'fetch',
        customer_id: customerId
      })
    });

    console.log('8. Proxy response status:', proxyResponse.status);
    
    if (proxyResponse.ok) {
      const proxyData = await proxyResponse.json();
      console.log('   ✅ Proxy success:', JSON.stringify(proxyData, null, 2));
    } else {
      const errorText = await proxyResponse.text();
      console.error('   ❌ Proxy error:', errorText);
    }

  } catch (error) {
    console.error('Error testing CDP integration:', error);
  }
}

// Test with a specific customer ID
const testCustomerId = process.argv[2] || 'HH_9139599';
console.log(`Testing CDP integration with customer ID: ${testCustomerId}\n`);

testCDPIntegration(testCustomerId).then(() => {
  console.log('\nTest complete');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});