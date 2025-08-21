import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSampleData() {
  try {
    // Get first laptop product
    const { data: laptops } = await supabase
      .from('products')
      .select('id, name')
      .ilike('name', '%laptop%')
      .limit(1);
    
    if (laptops && laptops.length > 0) {
      const laptop = laptops[0];
      console.log(`Updating laptop: ${laptop.name}`);
      
      // Update with metadata and comments
      const { error: laptopError } = await supabase
        .from('products')
        .update({
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
              comment: "Excellent laptop for the price. Fast performance and great battery life. The display is crisp and bright.",
              helpful_count: 42
            },
            {
              reviewer_name: "Sarah Johnson",
              rating: 4,
              date: "2024-12-10T14:20:00Z",
              comment: "Good overall, but the speakers could be better. Everything else is perfect - great build quality and performance.",
              helpful_count: 18
            },
            {
              reviewer_name: "Mike Chen",
              rating: 5,
              date: "2024-12-08T09:15:00Z",
              comment: "Amazing machine! Runs all my development tools smoothly. The keyboard is comfortable for long coding sessions.",
              helpful_count: 35
            },
            {
              reviewer_name: "Emily Davis",
              rating: 3,
              date: "2024-12-05T16:45:00Z",
              comment: "Decent laptop but arrived with a minor scratch. Performance is good but expected better cooling.",
              helpful_count: 8
            },
            {
              reviewer_name: "Robert Wilson",
              rating: 5,
              date: "2024-12-01T11:00:00Z",
              comment: "Perfect for both work and gaming. The SSD is super fast and the screen quality is outstanding!",
              helpful_count: 25
            }
          ]
        })
        .eq('id', laptop.id);
      
      if (laptopError) {
        console.error('Error updating laptop:', laptopError);
      } else {
        console.log('✅ Laptop updated successfully');
      }
    }
    
    // Get first phone product
    const { data: phones } = await supabase
      .from('products')
      .select('id, name')
      .or('name.ilike.%phone%,name.ilike.%iPhone%')
      .limit(1);
    
    if (phones && phones.length > 0) {
      const phone = phones[0];
      console.log(`Updating phone: ${phone.name}`);
      
      // Update with metadata and comments
      const { error: phoneError } = await supabase
        .from('products')
        .update({
          metadata: {
            screen_size: "6.1 inches",
            display_type: "OLED",
            camera: "48MP Triple Camera",
            battery: "4500mAh",
            "5g_enabled": true,
            storage_options: ["128GB", "256GB", "512GB"],
            water_resistance: "IP68",
            wireless_charging: true,
            face_id: true,
            colors: ["Midnight Black", "Pearl White", "Ocean Blue"]
          },
          comments: [
            {
              reviewer_name: "Alex Turner",
              rating: 5,
              date: "2024-12-18T13:00:00Z",
              comment: "Best phone I have ever owned! The camera quality is incredible and battery lasts all day.",
              helpful_count: 67
            },
            {
              reviewer_name: "Lisa Brown",
              rating: 4,
              date: "2024-12-14T10:30:00Z",
              comment: "Great phone but quite expensive. The display is gorgeous and performance is smooth.",
              helpful_count: 23
            }
          ]
        })
        .eq('id', phone.id);
      
      if (phoneError) {
        console.error('Error updating phone:', phoneError);
      } else {
        console.log('✅ Phone updated successfully');
      }
    }
    
    console.log('\n✨ Sample data added successfully!');
    console.log('You can now view products with features and reviews on the demo site.');
    
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
}

addSampleData();