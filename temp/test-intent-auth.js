// Test script to verify intent-analysis API authorization fix
// Run this in the browser console on the demo site

console.log('=== Testing Intent Analysis Authorization ===');

// Test function to call the intent-analysis API
async function testIntentAnalysis() {
  const supabaseUrl = 'https://rvlbbgdkgneobvlyawix.supabase.co';
  const apiKey = window.PortaFuturi?.apiKey || prompt('Enter your widget API key:');
  
  if (!apiKey) {
    console.error('No API key provided');
    return;
  }
  
  // Create sample browsing history
  const sampleHistory = [
    {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      event_type: 'page_view',
      page_url: '/atnaujinti_telefonai',
      session_id: 'test_session_123',
      category_viewed: 'atnaujinti_telefonai'
    },
    {
      timestamp: new Date(Date.now() - 180000).toISOString(),
      event_type: 'product_view',
      product_id: 'apple-iphone-12-pro',
      page_url: '/atnaujinti_telefonai/apple-iphone-12-pro',
      session_id: 'test_session_123',
      category_viewed: 'atnaujinti_telefonai',
      price: 899
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      event_type: 'product_view',
      product_id: 'apple-iphone-14-pro-max',
      page_url: '/atnaujinti_telefonai/apple-iphone-14-pro-max',
      session_id: 'test_session_123',
      category_viewed: 'atnaujinti_telefonai',
      price: 1299
    }
  ];
  
  const requestBody = {
    session_id: 'test_session_123',
    browsing_history: sampleHistory,
    interaction_count: 3,
    customer_profile: {
      customer_id: 'test_customer_123'
    }
  };
  
  console.log('1. Testing with X-API-Key header (CORRECT):');
  console.log('   API Key:', apiKey.substring(0, 20) + '...');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/intent-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('   Response Status:', response.status);
    const data = await response.json();
    
    if (response.ok) {
      console.log('   ✅ SUCCESS! Intent analysis returned:');
      console.log('   - Intent:', data.intent?.primary_interest);
      console.log('   - Confidence:', data.intent?.confidence);
      console.log('   - Message:', data.intent?.customer_message);
    } else {
      console.log('   ❌ FAILED:', data.error);
    }
  } catch (error) {
    console.error('   ❌ Request failed:', error);
  }
  
  console.log('\n2. Testing with Bearer Authorization header (OLD/WRONG):');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/intent-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('   Response Status:', response.status);
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('   ✅ EXPECTED: Got 401 with Bearer token (as it should)');
      console.log('   Error:', data.error);
    } else {
      console.log('   ⚠️ UNEXPECTED: Bearer token was accepted (should fail)');
    }
  } catch (error) {
    console.error('   ❌ Request failed:', error);
  }
  
  console.log('\n3. Testing without any authentication:');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/intent-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('   Response Status:', response.status);
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('   ✅ EXPECTED: Got 401 without authentication');
      console.log('   Error:', data.error);
    } else {
      console.log('   ⚠️ SECURITY ISSUE: Request succeeded without auth!');
    }
  } catch (error) {
    console.error('   ❌ Request failed:', error);
  }
  
  console.log('\n=== Test Summary ===');
  console.log('The intent-analysis API should now:');
  console.log('1. ✅ Accept requests with X-API-Key header');
  console.log('2. ✅ Reject requests with Bearer Authorization');
  console.log('3. ✅ Reject requests without authentication');
  console.log('\nThe widget has been updated to use X-API-Key header.');
}

// Run the test
testIntentAnalysis();