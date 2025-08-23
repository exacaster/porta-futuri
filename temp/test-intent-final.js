// Final test for intent-analysis API with proper authorization
// Run this in browser console on the demo site

console.log('=== Testing Intent Analysis with Dual Headers ===');

async function testIntentAnalysisFinal() {
  // Get API key from widget config or prompt
  const apiKey = window.PortaFuturi?.apiKey || localStorage.getItem('widget_api_key');
  
  if (!apiKey) {
    console.error('No API key found. Please initialize the widget first or set localStorage.setItem("widget_api_key", "your-key")');
    return;
  }
  
  const supabaseUrl = 'https://rvlbbgdkgneobvlyawix.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTM1MTIsImV4cCI6MjA3MDQ2OTUxMn0.hz5d5bKI5kxLVAz9SohS4wz-Qufc8em_aQPTVJF7GhA';
  
  const sampleHistory = [
    {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      event_type: 'page_view',
      page_url: '/atnaujinti_telefonai',
      session_id: 'test_final_123',
      category_viewed: 'atnaujinti_telefonai'
    },
    {
      timestamp: new Date(Date.now() - 180000).toISOString(),
      event_type: 'product_view',
      product_id: 'apple-iphone-12-pro',
      page_url: '/atnaujinti_telefonai/apple-iphone-12-pro',
      session_id: 'test_final_123',
      category_viewed: 'atnaujinti_telefonai',
      price: 899
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      event_type: 'product_view',
      product_id: 'apple-iphone-14-pro-max',
      page_url: '/atnaujinti_telefonai/apple-iphone-14-pro-max',
      session_id: 'test_final_123',
      category_viewed: 'atnaujinti_telefonai',
      price: 1299
    }
  ];
  
  const requestBody = {
    session_id: 'test_final_123',
    browsing_history: sampleHistory,
    interaction_count: 3,
    customer_profile: {
      customer_id: 'test_customer_123'
    }
  };
  
  console.log('Testing with BOTH headers:');
  console.log('  - Authorization: Bearer (Supabase anon key)');
  console.log('  - X-API-Key:', apiKey.substring(0, 20) + '...');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/intent-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,  // For Supabase edge runtime
        'X-API-Key': apiKey  // For our widget validation
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response Status:', response.status);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS! Intent analysis working!');
      console.log('Intent Analysis Results:');
      console.log('  - Primary Interest:', data.intent?.primary_interest);
      console.log('  - Confidence:', (data.intent?.confidence * 100).toFixed(0) + '%');
      console.log('  - Customer Message:', data.intent?.customer_message);
      console.log('  - Behavioral Signals:', data.intent?.behavioral_signals);
      console.log('  - Recommendations:', data.recommendations?.length || 0, 'products');
    } else {
      console.error('❌ FAILED:', data.error);
      if (data.details) {
        console.error('Details:', data.details);
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Run the test
testIntentAnalysisFinal();

// Also test that the widget is now working
setTimeout(() => {
  console.log('\n=== Checking Widget Behavior ===');
  
  // Check if browsing history is being tracked
  const historyData = sessionStorage.getItem('porta_futuri_browsing_history');
  const interactionCount = sessionStorage.getItem('porta_futuri_interaction_count');
  
  if (historyData) {
    const events = JSON.parse(historyData);
    console.log('✅ Widget is tracking browsing history:', events.length, 'events');
  }
  
  if (interactionCount) {
    console.log('✅ Interaction count persisted:', interactionCount);
  }
  
  console.log('\n📝 Summary:');
  console.log('1. Intent analysis API now requires BOTH headers:');
  console.log('   - Authorization: Bearer <supabase_anon_key>');
  console.log('   - X-API-Key: <widget_api_key>');
  console.log('2. The widget has been updated to send both headers');
  console.log('3. Try clicking "Refresh Analysis" in the AI Intent Analysis tab');
}, 1000);