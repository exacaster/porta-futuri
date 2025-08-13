#!/usr/bin/env node

const SUPABASE_URL = 'https://rvlbbgdkgneobvlyawix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTM1MTIsImV4cCI6MjA3MDQ2OTUxMn0.hz5d5bKI5kxLVAz9SohS4wz-Qufc8em_aQPTVJF7GhA';

async function testApiKeys() {
  console.log('Testing API keys table access...\n');
  
  const url = `${SUPABASE_URL}/rest/v1/api_keys?select=*&order=created_at.desc`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\nResponse body:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n✅ Successfully fetched api_keys!');
      console.log('Number of keys:', data.length);
      if (data.length > 0) {
        console.log('First key:', {
          name: data[0].name,
          is_active: data[0].is_active,
          created_at: data[0].created_at
        });
      }
    } else {
      console.log('\n❌ Failed to fetch api_keys');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testApiKeys();