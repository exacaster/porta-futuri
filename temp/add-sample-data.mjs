#!/usr/bin/env node

// Simple script to add sample data via fetch
const SUPABASE_URL = 'https://rvlbbgdkgneobvlyawix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2bGJiZ2RrZ25lb2J2bHlhd2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMTM3NjIsImV4cCI6MjA0OTU4OTc2Mn0.rVPqlZMrj_pGE6xXuZNmZ8RGwufxGmq_WO0RlmgJlhU';

async function updateProducts() {
  try {
    // First, get products
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?or=(name.ilike.%laptop%,name.ilike.%phone%)&limit=2`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const products = await response.json();
    console.log(`Found ${products.length} products to update`);
    
    for (const product of products) {
      let updateData = {};
      
      if (product.name.toLowerCase().includes('laptop')) {
        updateData = {
          metadata: {
            processor: "Intel Core i7-11800H",
            screen_size: "15.6 inches",
            ram: "16GB DDR4",
            storage: "512GB SSD",
            battery_life: "8 hours",
            weight: "1.8 kg",
            warranty: "2 years",
            color_options: ["Space Gray", "Silver"],
            connectivity: ["WiFi 6", "Bluetooth 5.0", "USB-C"],
            special_features: ["Backlit Keyboard", "Fingerprint Reader", "HD Webcam"]
          },
          comments: [
            {
              reviewer_name: "John Smith",
              rating: 5,
              date: "2024-12-15T10:30:00Z",
              comment: "Excellent laptop for the price. Fast performance and great battery life.",
              helpful_count: 42
            },
            {
              reviewer_name: "Sarah Johnson",
              rating: 4,
              date: "2024-12-10T14:20:00Z",
              comment: "Good overall, but the speakers could be better. Everything else is perfect.",
              helpful_count: 18
            },
            {
              reviewer_name: "Mike Chen",
              rating: 5,
              date: "2024-12-08T09:15:00Z",
              comment: "Amazing machine! Runs all my development tools smoothly.",
              helpful_count: 35
            }
          ]
        };
      } else if (product.name.toLowerCase().includes('phone')) {
        updateData = {
          metadata: {
            screen_size: "6.1 inches",
            display_type: "OLED",
            camera: "48MP Triple Camera",
            battery: "4500mAh",
            "5g_enabled": true,
            storage_options: ["128GB", "256GB", "512GB"],
            water_resistance: "IP68",
            wireless_charging: true
          },
          comments: [
            {
              reviewer_name: "Alex Turner",
              rating: 5,
              date: "2024-12-18T13:00:00Z",
              comment: "Best phone I have ever owned! The camera quality is incredible.",
              helpful_count: 67
            },
            {
              reviewer_name: "Lisa Brown",
              rating: 4,
              date: "2024-12-14T10:30:00Z",
              comment: "Great phone but quite expensive. The display is gorgeous.",
              helpful_count: 23
            }
          ]
        };
      }
      
      // Update the product
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${product.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.ok) {
        console.log(`✅ Updated: ${product.name}`);
      } else {
        console.error(`❌ Failed to update: ${product.name}`, await updateResponse.text());
      }
    }
    
    console.log('\n✨ Sample data added! Visit the demo site to see the features and reviews.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

updateProducts();