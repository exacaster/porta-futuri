import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rvlbbgdkgneobvlyawix.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg5MzUxMiwiZXhwIjoyMDcwNDY5NTEyfQ.hck8AJa6DDDnxYB9_oTSh8k--KDzg33Ocf1rjM1O-c8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkWidgetApiKey() {
  console.log('=== Checking Widget API Key Configuration ===\n');
  
  // Check what API keys exist
  const { data: apiKeys, error } = await supabase
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching API keys:', error);
    return;
  }
  
  console.log('API Keys in database:');
  if (apiKeys && apiKeys.length > 0) {
    apiKeys.forEach(key => {
      console.log(`\nAPI Key: ${key.key}`);
      console.log(`  Domain: ${key.domain}`);
      console.log(`  Active: ${key.is_active}`);
      console.log(`  Created: ${key.created_at}`);
    });
    
    console.log('\n=== SOLUTION ===');
    console.log('The widget needs to use one of these API keys.');
    console.log('\nTo fix the 401 error:');
    console.log('1. Set VITE_WIDGET_API_KEY in .env to one of the API keys above');
    console.log('   For example: VITE_WIDGET_API_KEY=' + (apiKeys[0]?.key || 'YOUR_API_KEY'));
    console.log('\n2. Or update the demo site to use the correct API key:');
    console.log('   In src/demo-site/components/PortaFuturiWidget.tsx, line 43:');
    console.log('   apiKey: "' + (apiKeys[0]?.key || 'YOUR_API_KEY') + '",');
    console.log('\n3. The widget will then authenticate with this API key');
    console.log('4. The CDP proxy will use the bearer token from cdp_integrations table');
  } else {
    console.log('  No API keys found!\n');
    console.log('=== PROBLEM ===');
    console.log('There are no API keys in the database.');
    console.log('The widget cannot authenticate with the CDP proxy.');
    console.log('\n=== SOLUTION ===');
    console.log('1. Go to the Admin Panel');
    console.log('2. Navigate to API Keys section');
    console.log('3. Create a new API key for the widget');
    console.log('4. Use that API key in the widget configuration');
  }
}

checkWidgetApiKey().catch(console.error);