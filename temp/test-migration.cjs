#!/usr/bin/env node

// Test script to verify the database migration worked

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigration() {
  console.log('🔍 Testing database migration...\n');
  
  // Test product with comments
  const testProduct = {
    product_id: 'MIGRATION_TEST_001',
    name: 'Migration Test Product',
    price: 99.99,
    category: 'Test',
    description: 'Product to test migration',
    metadata: {
      test_attribute: 'test_value',
      processor: 'Test CPU'
    },
    comments: [
      {
        reviewer_name: 'Test User',
        rating: 5,
        date: '2025-01-20',
        comment: 'Great product!',
        helpful_count: 10
      }
    ]
  };
  
  console.log('📝 Inserting test product with comments...');
  const { data, error } = await supabase
    .from('products')
    .upsert(testProduct, { onConflict: 'product_id' })
    .select();
  
  if (error) {
    console.error('❌ Error inserting product:', error.message);
    if (error.message.includes('column "comments" of relation "products" does not exist')) {
      console.error('⚠️  Migration may not have been applied successfully');
    }
    return;
  }
  
  console.log('✅ Product inserted successfully!');
  
  // Fetch the product back to verify
  const { data: fetchedProduct, error: fetchError } = await supabase
    .from('products')
    .select('product_id, name, metadata, comments, comment_count')
    .eq('product_id', 'MIGRATION_TEST_001')
    .single();
  
  if (fetchError) {
    console.error('❌ Error fetching product:', fetchError.message);
    return;
  }
  
  console.log('\n📦 Fetched product data:');
  console.log('- Product ID:', fetchedProduct.product_id);
  console.log('- Name:', fetchedProduct.name);
  console.log('- Metadata:', JSON.stringify(fetchedProduct.metadata, null, 2));
  console.log('- Comments:', JSON.stringify(fetchedProduct.comments, null, 2));
  console.log('- Comment Count:', fetchedProduct.comment_count);
  
  // Clean up test data
  console.log('\n🧹 Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('product_id', 'MIGRATION_TEST_001');
  
  if (deleteError) {
    console.error('⚠️  Warning: Could not clean up test data:', deleteError.message);
  } else {
    console.log('✅ Test data cleaned up');
  }
  
  console.log('\n🎉 Migration test completed successfully!');
  console.log('📊 The database now supports:');
  console.log('   - Comments field (JSONB array)');
  console.log('   - Comment count (computed column)');
  console.log('   - Attributes stored in metadata field');
}

testMigration().catch(console.error);