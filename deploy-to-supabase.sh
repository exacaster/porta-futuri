#!/bin/bash

# Deployment script for Porta Futuri backend to Supabase Cloud
# Run this to deploy database schema and functions to your Supabase project

echo "🚀 Starting Porta Futuri deployment to Supabase Cloud..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Your Supabase project details (extracted from your URL)
PROJECT_REF="rvlbbgdkgneobvlyawix"

echo "📋 Project Reference: $PROJECT_REF"
echo ""

# Step 1: Login to Supabase (if not already logged in)
echo "🔐 Step 1: Logging in to Supabase..."
supabase login

# Step 2: Link to your project
echo ""
echo "🔗 Step 2: Linking to your Supabase project..."
supabase link --project-ref $PROJECT_REF

# Step 3: Push database migrations
echo ""
echo "📊 Step 3: Pushing database migrations..."
echo "This will create tables for products, admin users, sessions, etc."
supabase db push

# Step 4: Set secrets for Edge Functions
echo ""
echo "🔑 Step 4: Setting environment secrets for Edge Functions..."
echo "Please set your Anthropic API key:"
read -p "Enter your ANTHROPIC_API_KEY: " ANTHROPIC_KEY
supabase secrets set ANTHROPIC_API_KEY="$ANTHROPIC_KEY"

# Step 5: Deploy Edge Functions
echo ""
echo "⚡ Step 5: Deploying Edge Functions..."
supabase functions deploy recommendations --no-verify-jwt

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to Supabase Dashboard: https://app.supabase.com/project/$PROJECT_REF"
echo "2. Check SQL Editor → Tables to verify all tables were created"
echo "3. If needed, manually run the seed script in SQL Editor for default admin user"
echo "4. Run 'npm run dev:admin' to start the admin UI locally"
echo ""
echo "🔐 Default admin credentials:"
echo "   Email: egidijus@exacaster.com"
echo "   Password: 123456789"