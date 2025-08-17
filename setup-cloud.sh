#!/bin/bash

# Porta Futuri - Cloud Supabase Setup Script
# This script helps you quickly set up the project with cloud Supabase

echo "🚀 Porta Futuri - Cloud Supabase Setup"
echo "======================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Function to prompt for input with a default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local response

    read -p "$prompt [$default]: " response
    echo "${response:-$default}"
}

# Check if .env files already exist
if [ -f .env ]; then
    echo "⚠️  .env file already exists."
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file."
    else
        cp .env.example .env
    fi
else
    cp .env.example .env
fi

if [ ! -f .env.demo ]; then
    cp .env.demo.example .env.demo
fi

echo ""
echo "📝 Let's configure your Supabase connection..."
echo ""
echo "You'll need your Supabase project credentials."
echo "Find them at: https://app.supabase.com -> Your Project -> Settings -> API"
echo ""

# Get Supabase credentials
read -p "Enter your Supabase Project URL (e.g., https://xxxxx.supabase.co): " supabase_url
read -p "Enter your Supabase Anon/Public Key: " supabase_anon_key
read -p "Enter your Supabase Service Role Key (optional, press Enter to skip): " supabase_service_key

# Update .env file
if [ -n "$supabase_url" ] && [ -n "$supabase_anon_key" ]; then
    echo ""
    echo "📝 Updating environment files..."
    
    # Update .env
    if [ -f .env ]; then
        sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=$supabase_url|" .env
        sed -i.bak "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$supabase_anon_key|" .env
        if [ -n "$supabase_service_key" ]; then
            sed -i.bak "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$supabase_service_key|" .env
        fi
    fi
    
    # Update .env.demo
    sed -i.bak "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$supabase_url|" .env.demo
    sed -i.bak "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$supabase_anon_key|" .env.demo
    
    # Create .env.admin if it doesn't exist
    if [ ! -f .env.admin ]; then
        cat > .env.admin << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$supabase_url
VITE_SUPABASE_ANON_KEY=$supabase_anon_key

# Admin Configuration
VITE_ADMIN_DEFAULT_EMAIL=admin@example.com
VITE_ADMIN_DEFAULT_PASSWORD=Admin123!
EOF
    fi
    
    echo "✅ Environment files updated!"
else
    echo "❌ Supabase credentials are required. Please run the script again with valid credentials."
    exit 1
fi

# Clean up backup files
rm -f .env.bak .env.demo.bak

echo ""
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo ""
echo "🏗️  Building widget..."
npm run build:widget

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Set up your database schema in Supabase:"
echo "   - Go to your Supabase Dashboard"
echo "   - Navigate to SQL Editor"
echo "   - Run the migration files from supabase/migrations/ folder"
echo ""
echo "2. Start the application:"
echo "   npm run dev:demo    # Start demo site only"
echo "   npm run dev:admin   # Start admin panel"
echo "   npm run dev:all     # Start everything"
echo ""
echo "3. Add sample products:"
echo "   - Use the admin panel at http://localhost:5174/admin"
echo "   - Or run SQL inserts directly in Supabase Dashboard"
echo ""
echo "🌐 URLs:"
echo "   Demo Site: http://localhost:3000"
echo "   Admin Panel: http://localhost:5174/admin"
echo "   Widget Demo: http://localhost:5173"
echo ""
echo "Happy coding! 🎉"