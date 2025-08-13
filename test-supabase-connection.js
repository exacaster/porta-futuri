import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n1. Testing api_keys table access...');
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error accessing api_keys table:', error);
    } else {
      console.log('✅ Successfully accessed api_keys table');
      console.log('Found', data?.length || 0, 'keys');
      if (data && data.length > 0) {
        console.log('Sample key:', {
          id: data[0].id,
          name: data[0].name,
          is_active: data[0].is_active
        });
      }
    }

    console.log('\n2. Testing products table access...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('count')
      .single();

    if (productsError) {
      console.log('Products table error (expected if empty):', productsError.message);
    } else {
      console.log('✅ Products table accessible');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();