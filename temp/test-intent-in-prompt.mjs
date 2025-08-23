#!/usr/bin/env node

/**
 * Test script to verify that detected intent is included in the Gemini prompt
 * This tests the full flow from recommendations endpoint to AI service
 */

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://fpqcrsyibjdeyxuydkbj.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcWNyc3lpYmpkZXl4dXlka2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMjExNTMsImV4cCI6MjA0OTY5NzE1M30.UVdTdxm8tNLDbX7dNpnC3HHgRwG49sqcHhqokAqk70s';

async function testIntentInPrompt() {
    console.log('🧪 Testing Intent in Gemini Prompt...\n');
    
    // Test payload with detected intent
    const testPayload = {
        session_id: `test-${Date.now()}`,
        query: "Show me some smartphones",
        conversation_history: [],
        context: {
            current_page: "/products/phones",
            detected_intent: {
                primary_interest: "Smartphone Comparison Shopping",
                confidence: 0.75,
                behavioral_signals: [
                    "Viewed 5 smartphone products in last 10 minutes",
                    "Compared iPhone 15 Pro vs Samsung Galaxy S24",
                    "Spent 3 minutes on product specifications"
                ],
                suggested_context: "Looking for a high-end smartphone upgrade"
            }
        },
        customer_data: {
            csv_hash: "test123",
            profile_loaded: false,
            context_loaded: false
        },
        products: [
            {
                product_id: "PHONE_001",
                name: "iPhone 15 Pro",
                category: "Smartphones",
                price: 999,
                description: "Latest Apple flagship with titanium design",
                stock_status: "in_stock"
            },
            {
                product_id: "PHONE_002",
                name: "Samsung Galaxy S24 Ultra",
                category: "Smartphones",
                price: 1199,
                description: "Premium Android phone with S Pen",
                stock_status: "in_stock"
            }
        ]
    };

    try {
        console.log('📤 Sending request to recommendations endpoint...');
        console.log('Intent being sent:', JSON.stringify(testPayload.context.detected_intent, null, 2));
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'X-Session-ID': testPayload.session_id
            },
            body: JSON.stringify(testPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            return;
        }

        const result = await response.json();
        
        console.log('\n✅ Response received successfully!');
        console.log('Message:', result.message);
        
        // Check if the AI acknowledged the intent
        const messageIncludesIntent = 
            result.message.toLowerCase().includes('smartphone') ||
            result.message.toLowerCase().includes('browsing') ||
            result.message.toLowerCase().includes('comparison') ||
            result.message.toLowerCase().includes('viewing');
        
        if (messageIncludesIntent) {
            console.log('\n🎯 SUCCESS: AI appears to have acknowledged the detected intent!');
            console.log('The response message shows awareness of the browsing behavior.');
        } else {
            console.log('\n⚠️  WARNING: AI response doesn\'t clearly acknowledge the detected intent.');
            console.log('This could mean the intent wasn\'t included in the prompt or wasn\'t processed.');
        }
        
        if (result.recommendations && result.recommendations.length > 0) {
            console.log(`\n📱 Received ${result.recommendations.length} recommendations`);
            result.recommendations.forEach((rec, idx) => {
                console.log(`  ${idx + 1}. ${rec.name} - ${rec.reasoning || 'No reasoning provided'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testIntentInPrompt().then(() => {
    console.log('\n🏁 Test completed');
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});