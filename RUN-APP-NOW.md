# 🚀 Quick Start - Run App with Your Cloud Supabase

Since your database is already set up, you just need to configure the connection and run!

## ⚡ 5-Minute Setup

### 1️⃣ Configure Your Supabase Connection

Create the environment files with your Supabase credentials:

```bash
# Copy example files
cp .env.example .env
cp .env.demo.example .env.demo

# Create admin env file
touch .env.admin
```

### 2️⃣ Add Your Supabase Credentials

Edit `.env.demo` file:
```env
# Replace with YOUR Supabase project details
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Edit `.env.admin` file:
```env
# Same Supabase credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Edit `.env` file (for widget/backend):
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here  # Optional but recommended
```

### 3️⃣ Install Dependencies

```bash
npm install
```

If you see any peer dependency warnings:
```bash
npm install --legacy-peer-deps
```

### 4️⃣ Build the Widget

```bash
npm run build:widget
```

### 5️⃣ Run the Application!

#### Option A: Run Demo Site Only (Simplest)
```bash
npm run dev:demo
```
👉 Open http://localhost:3000

#### Option B: Run Everything (Full Experience)
```bash
# In separate terminals:

# Terminal 1 - Admin Panel
npm run dev:admin

# Terminal 2 - Widget
npm run dev:widget-demo  

# Terminal 3 - Demo Site
npm run dev:demo
```

Or all at once:
```bash
npm install --save-dev concurrently  # If not installed
npm run dev:all
```

## 🎯 Access Points

- **🛍️ iTelecom Demo Store**: http://localhost:3000
- **⚙️ Admin Panel**: http://localhost:5174/admin  
- **🤖 Widget Playground**: http://localhost:5173

## ✅ Quick Verification

1. **Demo Site** (http://localhost:3000):
   - ✓ Products should display from your database
   - ✓ Can add items to cart
   - ✓ AI chat widget appears bottom-right

2. **Admin Panel** (http://localhost:5174/admin):
   - ✓ Can login and manage products
   - ✓ Changes reflect on demo site

## 🆘 Troubleshooting

### No Products Showing?
- Check Supabase Dashboard → Table Editor → `products` table
- Verify your anon key is correct in `.env.demo`
- Check browser console for errors (F12)

### Widget Not Appearing?
```bash
# Make sure widget is built
npm run build:widget
# Then restart demo
npm run dev:demo
```

### Connection Errors?
- Verify Supabase project is active (not paused)
- Double-check URL format: `https://xxxxx.supabase.co`
- Ensure anon key is the PUBLIC anon key, not service key

### Port Already in Use?
```bash
# Kill all Node processes
pkill node
# Or change ports in vite.config files
```

## 📱 What You Can Do Now

1. **Browse Products** - Navigate categories, search, filter
2. **Shopping Cart** - Add/remove items, persistent storage
3. **AI Assistant** - Click chat widget for recommendations
4. **Admin Panel** - Add/edit products in real-time

## 🎉 That's It!

Your app should now be running with your cloud Supabase database. Enjoy exploring the iTelecom demo store with AI-powered recommendations!

---
**Need help?** Check the browser console (F12) for detailed error messages.