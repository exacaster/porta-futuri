import { createClient } from '@supabase/supabase-js';

// Use the correct Supabase project
const SUPABASE_URL = 'https://rvlbbgdkgneobvlyawix.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg5MzUxMiwiZXhwIjoyMDcwNDY5NTEyfQ.hck8AJa6DDDnxYB9_oTSh8k--KDzg33Ocf1rjM1O-c8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAndFixCredentials() {
  console.log('=== Checking CDP Integration Credentials ===\n');
  
  // Get the active CDP integration
  const { data: integration, error } = await supabase
    .from('cdp_integrations')
    .select('*')
    .eq('is_active', true)
    .eq('provider', 'exacaster')
    .single();
  
  if (error || !integration) {
    console.error('No active CDP integration found:', error);
    return;
  }
  
  console.log('Found integration:');
  console.log('- ID:', integration.id);
  console.log('- Name:', integration.name);
  console.log('- Provider:', integration.provider);
  
  console.log('\n=== Checking credentials_encrypted field ===');
  console.log('Field exists:', !!integration.credentials_encrypted);
  console.log('Field length:', integration.credentials_encrypted?.length || 0);
  
  if (integration.credentials_encrypted) {
    console.log('First 50 chars:', integration.credentials_encrypted.substring(0, 50));
    
    // Try to decode
    try {
      const decoded = atob(integration.credentials_encrypted);
      console.log('\nBase64 decoded successfully');
      console.log('Decoded string:', decoded);
      console.log('Decoded length:', decoded.length);
      
      if (decoded.length === 0) {
        console.error('\n❌ ERROR: Decoded string is empty!');
        console.log('This means the credentials were saved incorrectly.');
        
        // Ask user for the bearer token
        console.log('\n=== FIX REQUIRED ===');
        console.log('Please provide the correct bearer token from Exacaster.');
        console.log('You can update it in the Admin Panel by:');
        console.log('1. Going to Integrations tab');
        console.log('2. Selecting the Exacaster integration');
        console.log('3. Entering the bearer token in the field');
        console.log('4. Clicking "Save Changes"');
        console.log('\nMake sure to enter the actual token, not leave it empty!');
        
        return;
      }
      
      try {
        const credentials = JSON.parse(decoded);
        console.log('\nJSON parsed successfully');
        console.log('Has bearer_token:', !!credentials.bearer_token);
        
        if (credentials.bearer_token) {
          console.log('Bearer token length:', credentials.bearer_token.length);
          console.log('Bearer token preview:', credentials.bearer_token.substring(0, 30) + '...');
          console.log('\n✅ Credentials look valid');
        } else {
          console.error('\n❌ ERROR: No bearer_token in credentials!');
          console.log('The credentials object is:', credentials);
        }
      } catch (jsonErr) {
        console.error('\n❌ ERROR: Failed to parse JSON:', jsonErr.message);
        console.log('Decoded content:', decoded);
      }
    } catch (b64Err) {
      console.error('\n❌ ERROR: Failed to decode base64:', b64Err.message);
      console.log('This suggests the field contains invalid base64 data.');
      console.log('Raw value:', integration.credentials_encrypted);
    }
  } else {
    console.error('\n❌ ERROR: No credentials_encrypted field!');
    console.log('The bearer token was never saved.');
  }
  
  // Also check the config
  console.log('\n=== Integration Config ===');
  console.log('Workspace ID:', integration.config?.workspace_id);
  console.log('Resource ID:', integration.config?.resource_id);
  console.log('API URL:', integration.config?.api_url);
}

// For manual fix, uncomment and run this with your token:
async function manuallyFixCredentials(bearerToken) {
  if (!bearerToken) {
    console.error('Please provide a bearer token');
    return;
  }
  
  const credentials = {
    bearer_token: bearerToken
  };
  
  const encrypted = btoa(JSON.stringify(credentials));
  
  console.log('Updating credentials in database...');
  
  const { error } = await supabase
    .from('cdp_integrations')
    .update({
      credentials_encrypted: encrypted,
      test_status: 'pending',
      last_error: null,
      updated_at: new Date().toISOString()
    })
    .eq('is_active', true)
    .eq('provider', 'exacaster');
  
  if (error) {
    console.error('Failed to update:', error);
  } else {
    console.log('✅ Credentials updated successfully!');
    console.log('Please test the connection in the Admin Panel.');
  }
}

// Run the check
checkAndFixCredentials();

// To manually fix, uncomment this line and add your token:
// manuallyFixCredentials('YOUR_BEARER_TOKEN_HERE');