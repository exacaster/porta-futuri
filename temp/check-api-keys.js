const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkApiKeys() {
  console.log('Checking API Keys and CDP Integration...\n');
  
  // Check API keys
  const { data: apiKeys, error: apiKeysError } = await supabase
    .from('api_keys')
    .select('id, key, domain, is_active, rate_limit, created_at')
    .order('created_at', { ascending: false });
  
  if (apiKeysError) {
    console.error('Error fetching API keys:', apiKeysError);
  } else {
    console.log('API Keys in database:');
    if (apiKeys && apiKeys.length > 0) {
      apiKeys.forEach(key => {
        console.log(`  - Domain: ${key.domain}`);
        console.log(`    Key: ${key.key.substring(0, 20)}...`);
        console.log(`    Active: ${key.is_active}`);
        console.log(`    Rate Limit: ${key.rate_limit}/min`);
        console.log(`    Created: ${key.created_at}\n`);
      });
    } else {
      console.log('  No API keys found in database!\n');
    }
  }
  
  // Check CDP integrations
  const { data: cdpIntegrations, error: cdpError } = await supabase
    .from('cdp_integrations')
    .select('id, provider, is_active, config, created_at')
    .order('created_at', { ascending: false });
  
  if (cdpError) {
    console.error('Error fetching CDP integrations:', cdpError);
  } else {
    console.log('CDP Integrations:');
    if (cdpIntegrations && cdpIntegrations.length > 0) {
      cdpIntegrations.forEach(integration => {
        console.log(`  - Provider: ${integration.provider}`);
        console.log(`    Active: ${integration.is_active}`);
        console.log(`    Config: ${JSON.stringify(integration.config, null, 2)}`);
        console.log(`    Created: ${integration.created_at}\n`);
      });
    } else {
      console.log('  No CDP integrations found in database!\n');
    }
  }
  
  process.exit(0);
}

checkApiKeys().catch(console.error);