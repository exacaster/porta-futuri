#!/bin/bash

# Porta Futuri Setup Script
echo "🚀 Setting up Porta Futuri AI Add-On..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Please upgrade Node.js."
    exit 1
fi

echo "✅ Node.js version check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your API keys and configuration"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Initialize Supabase
echo "🗄️  Initializing Supabase..."
supabase init || true

# Start Supabase
echo "🚀 Starting Supabase..."
npm run supabase:start

# Run migrations
echo "🔄 Running database migrations..."
npm run supabase:migrate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your API keys:"
echo "   - ANTHROPIC_API_KEY"
echo "   - OPENAI_API_KEY (optional)"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 to see the demo"
echo ""
echo "Happy coding! 🎉"