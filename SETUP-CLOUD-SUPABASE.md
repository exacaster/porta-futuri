# 🚀 Running Porta Futuri with Cloud Supabase

This guide will help you set up and run the iTelecom demo app with a cloud Supabase instance.

## 📋 Prerequisites

- Node.js 18+ and npm installed
- A Supabase account (free tier works)
- Git installed

## 🔧 Step 1: Create a Supabase Project

1. **Go to [Supabase Dashboard](https://app.supabase.com)**
2. **Create a new project** (or use existing):
   - Click "New project"
   - Choose your organization
   - Enter project name (e.g., "porta-futuri-demo")
   - Generate a strong database password (save it!)
   - Select your region (closest to you)
   - Click "Create new project"

3. **Wait for project to be ready** (takes ~2 minutes)

## 🔑 Step 2: Get Your Supabase Credentials

Once your project is ready:

1. **Go to Settings > API** in your Supabase dashboard
2. **Copy these values**:
   - `Project URL` (looks like: https://xxxxx.supabase.co)
   - `anon/public` key (safe for browser)
   - `service_role` key (keep secret, for server-side only)

## 📝 Step 3: Configure Environment Files

### A. Main Environment File (.env)

1. **Copy the example file**:
```bash
cp .env.example .env
```

2. **Edit `.env`** and update with your Supabase credentials:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Keep other settings as is or customize
ANTHROPIC_API_KEY=your-claude-api-key-if-you-have-one
```

### B. Demo Site Environment (.env.demo)

1. **Copy the demo example**:
```bash
cp .env.demo.example .env.demo
```

2. **Edit `.env.demo`**:
```env
# Supabase Configuration (use same as above)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Widget Configuration
VITE_WIDGET_API_KEY=demo-api-key
VITE_WIDGET_URL=http://localhost:5173/widget.iife.js

# Keep other settings as default
VITE_DEMO_CUSTOMER_ID=DEMO_USER_001
```

### C. Admin Panel Environment (.env.admin)

1. **Create admin environment file**:
```bash
cat > .env.admin << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Admin Configuration
VITE_ADMIN_DEFAULT_EMAIL=admin@example.com
VITE_ADMIN_DEFAULT_PASSWORD=Admin123!
EOF
```

## 🗄️ Step 4: Set Up Database Schema

### Option A: Using Supabase Dashboard (Easiest)

1. **Go to SQL Editor** in Supabase Dashboard
2. **Run each migration file** in order:

```bash
# List migration files
ls supabase/migrations/
```

3. **Copy and paste each SQL file content** into SQL Editor and run:
   - Start with `001_initial_schema.sql`
   - Then `002_api_tables.sql`
   - Continue through all numbered files
   - End with `011_cdp_integrations.sql`

### Option B: Using Supabase CLI

1. **Install Supabase CLI** (if not installed):
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

3. **Link your project**:
```bash
supabase link --project-ref your-project-ref
# (Find project-ref in Supabase Dashboard > Settings > General)
```

4. **Push migrations**:
```bash
supabase db push
```

## 📦 Step 5: Install Dependencies

```bash
# Install all dependencies
npm install

# If you see any errors, try:
npm install --legacy-peer-deps
```

## 🏃 Step 6: Run the Application

### Quick Start - Demo Site Only:
```bash
# Start just the demo site
npm run dev:demo
```
➡️ Open http://localhost:3000

### Full Setup - All Services:
```bash
# Terminal 1: Start the admin panel
npm run dev:admin

# Terminal 2: Start the widget
npm run dev:widget-demo

# Terminal 3: Start the demo site
npm run dev:demo
```

Or run all at once (requires concurrently):
```bash
# Install concurrently if needed
npm install --save-dev concurrently

# Run all services
npm run dev:all
```

## 🌐 Step 7: Access the Applications

- **iTelecom Demo Site**: http://localhost:3000
- **Admin Panel**: http://localhost:5174/admin
- **Widget Demo**: http://localhost:5173

## 📊 Step 8: Add Sample Products

### Using Admin Panel:

1. **Go to** http://localhost:5174/admin
2. **Login** with admin credentials
3. **Navigate to Products tab**
4. **Upload a CSV** or add products manually

### Sample Product CSV:
```csv
product_id,name,category,price,description,stock_status,brand
PHONE001,iPhone 15 Pro,Mobile Phones,999.99,Latest iPhone with advanced features,in_stock,Apple
PLAN001,Unlimited 5G Plan,Mobile Plans,49.99,Unlimited data with 5G speeds,in_stock,iTelecom
INTERNET001,Fiber 1000,Internet Plans,79.99,1Gbps fiber internet,in_stock,iTelecom
TV001,Premium TV Package,TV Plans,39.99,200+ channels including sports,in_stock,iTelecom
ROUTER001,WiFi 6 Router,Accessories,149.99,Latest WiFi 6 technology,in_stock,Netgear
```

### Direct Database Insert:

Go to Supabase Dashboard > SQL Editor and run:
```sql
INSERT INTO products (product_id, name, category, price, description, stock_status, brand) VALUES
('PHONE001', 'iPhone 15 Pro', 'Mobile Phones', 999.99, 'Latest iPhone with advanced features', 'in_stock', 'Apple'),
('PLAN001', 'Unlimited 5G Plan', 'Mobile Plans', 49.99, 'Unlimited data with 5G speeds', 'in_stock', 'iTelecom'),
('INTERNET001', 'Fiber 1000', 'Internet Plans', 79.99, '1Gbps fiber internet', 'in_stock', 'iTelecom'),
('TV001', 'Premium TV Package', 'TV Plans', 39.99, '200+ channels including sports', 'in_stock', 'iTelecom'),
('ROUTER001', 'WiFi 6 Router', 'Accessories', 149.99, 'Latest WiFi 6 technology', 'in_stock', 'Netgear');
```

## ✅ Step 9: Verify Everything Works

1. **Check Demo Site**:
   - Products display on homepage
   - Can browse categories
   - Can add items to cart
   - Cart persists on refresh

2. **Check Widget**:
   - Chat bubble appears bottom-right
   - Can open and interact with AI assistant

3. **Check Admin Panel**:
   - Can login
   - Can view/add/edit products
   - Changes reflect on demo site

## 🐛 Troubleshooting

### Common Issues:

#### "Invalid API Key" Error
- Double-check your Supabase keys in `.env` and `.env.demo`
- Make sure you're using the `anon` key for VITE variables

#### Products Not Showing
- Check Supabase Dashboard > Table Editor > products table
- Verify products exist in database
- Check browser console for errors
- Make sure migrations ran successfully

#### Widget Not Loading
```bash
# Build the widget first
npm run build:widget

# Then restart demo site
npm run dev:demo
```

#### Port Already in Use
Change ports in respective config files:
- `vite.config.demo.ts` - Demo site (default: 3000)
- `vite.config.admin.ts` - Admin panel (default: 5174)
- `vite.config.ts` - Widget (default: 5173)

#### Database Connection Issues
- Verify Supabase project is active (not paused)
- Check URL and keys are correct
- Try regenerating keys in Supabase Dashboard

## 🚀 Production Deployment

### Build for Production:
```bash
# Build all components
npm run build:all

# Or individually
npm run build:demo
npm run build:admin
npm run build:widget
```

### Deploy to Vercel/Netlify:
1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set environment variables in deployment platform
4. Deploy!

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Project README](./README.md)
- [Demo Site Guide](./src/demo-site/README.md)

## 💡 Tips

- Use Supabase Dashboard to monitor database activity
- Enable Row Level Security (RLS) for production
- Set up Supabase Auth for real user management
- Use Supabase Realtime for live updates

---

**Need help?** Check the Supabase Dashboard logs or open an issue on GitHub.