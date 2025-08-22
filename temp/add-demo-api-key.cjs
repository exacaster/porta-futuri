const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rvlbbgdkgneobvlyawix.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDg5MzUxMiwiZXhwIjoyMDcwNDY5NTEyfQ.hck8AJa6DDDnxYB9_oTSh8k--KDzg33Ocf1rjM1O-c8';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDemoApiKey() {
  try {
    // Check if demo-api-key already exists
    const { data: existing } = await supabase
      .from('api_keys')
      .select('id')
      .eq('key', 'demo-api-key')
      .single();

    if (existing) {
      console.log('Demo API key already exists, updating it...');
      const { error } = await supabase
        .from('api_keys')
        .update({
          is_active: true,
          rate_limit: 100,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'demo-api-key');

      if (error) {
        console.error('Error updating API key:', error);
      } else {
        console.log('Demo API key updated successfully');
      }
    } else {
      console.log('Creating demo API key...');
      const { error } = await supabase
        .from('api_keys')
        .insert({
          name: 'Demo Widget API Key',
          key: 'demo-api-key',
          domain: 'localhost:3002',
          is_active: true,
          rate_limit: 100,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating API key:', error);
      } else {
        console.log('Demo API key created successfully');
      }
    }

    // Verify the key exists
    const { data: verify } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', 'demo-api-key')
      .single();

    if (verify) {
      console.log('Verified API key:', verify);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

addDemoApiKey();