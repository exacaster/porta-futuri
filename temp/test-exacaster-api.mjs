// Test Exacaster API directly
async function testExacasterAPI() {
  const config = {
    api_url: 'https://customer360.exacaster.com/courier/api/v1',
    workspace_id: '765',
    resource_id: 'customer_metrics',
    bearer_token: '5bd1759ca2a542e786cf47084450af99'
  };
  
  const url = `${config.api_url}/workspaces/${config.workspace_id}/resources/${config.resource_id}?userId=37061234567&page=0&size=1`;
  
  console.log('Testing Exacaster API directly...');
  console.log('URL:', url);
  console.log('Bearer Token:', config.bearer_token);
  console.log('\nMaking request...\n');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.bearer_token}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    
    if (response.status === 401) {
      console.log('\n❌ UNAUTHORIZED - The token format or value is incorrect');
      console.log('Response:', text);
      console.log('\nPossible issues:');
      console.log('1. This might be an API key, not a bearer token');
      console.log('2. The token might be expired');
      console.log('3. The workspace/resource IDs might be wrong');
      console.log('4. Try using it as X-API-Key header instead');
      
      // Try with X-API-Key
      console.log('\n=== Trying with X-API-Key header ===');
      const response2 = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': config.bearer_token,
          'Accept': 'application/json'
        }
      });
      
      console.log('Response Status:', response2.status, response2.statusText);
      if (response2.ok) {
        console.log('✅ SUCCESS with X-API-Key!');
        const data = await response2.json();
        console.log('Data:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ Still failed with X-API-Key');
      }
      
    } else if (response.ok) {
      console.log('\n✅ SUCCESS');
      try {
        const data = JSON.parse(text);
        console.log('Data:', JSON.stringify(data, null, 2));
      } catch {
        console.log('Response:', text);
      }
    } else {
      console.log('\n⚠️ Unexpected response');
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testExacasterAPI();