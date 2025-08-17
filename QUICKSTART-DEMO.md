# iTelecom Demo Site - Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Prerequisites
- Node.js 18+ and npm installed
- Supabase CLI installed (optional)

### Quick Setup

1. **Copy environment configuration**:
```bash
cp .env.demo.example .env.demo
```

2. **Install dependencies** (if not already installed):
```bash
npm install
```

3. **Start the demo site**:
```bash
npm run dev:demo
```

📱 **Demo site is now running at: http://localhost:3000**

## 🎯 What You Can Do

### Browse Products
- Navigate to different product categories
- Search and filter products
- View detailed product information

### Shopping Cart
- Add products to cart
- Adjust quantities
- Remove items
- Cart persists across page refreshes

### AI Assistant
- Look for the chat widget in the bottom-right corner
- Ask for product recommendations
- Get personalized suggestions

## 🛠️ Running Multiple Services

### Start Everything
```bash
# Start admin panel, widget, and demo site
npm run dev:all
```

This starts:
- **Admin Panel**: http://localhost:5174 (manage products)
- **Widget Demo**: http://localhost:5173 (widget playground)
- **Demo Site**: http://localhost:3000 (iTelecom store)

### Individual Services
```bash
# Just the demo site
npm run dev:demo

# Just the admin panel
npm run dev:admin

# Just the widget
npm run dev:widget-demo
```

## 📝 Managing Products

Products are managed through the Admin panel:

1. Go to http://localhost:5174/admin
2. Login with default credentials (if configured)
3. Upload CSV or manually add products
4. Products appear immediately in the demo site

## 🎨 Customization

### Change Brand Colors
Edit `src/demo-site/styles/globals.css`:
```css
:root {
  --primary: 267 97% 33%;    /* Purple */
  --accent: 286 88% 52%;      /* Bright Purple */
}
```

### Update Company Info
Edit:
- `src/demo-site/components/layout/Header.tsx` - Logo and navigation
- `src/demo-site/components/layout/Footer.tsx` - Footer content

## 🐛 Troubleshooting

### Products Not Showing?
1. Check Supabase is running: `npm run supabase:start`
2. Add products via Admin panel
3. Check browser console for errors

### Widget Not Appearing?
1. Build the widget first: `npm run build:widget`
2. Check console for widget loading errors
3. Verify API key in `.env.demo`

### Port Already in Use?
Change the port in `vite.config.demo.ts`:
```javascript
server: {
  port: 3001, // Change to any available port
}
```

## 📦 Building for Production

```bash
# Build the demo site
npm run build:demo

# Output will be in dist/demo-site/
```

## 🔗 Useful Links

- **Full Documentation**: See `src/demo-site/README.md`
- **Admin Panel**: http://localhost:5174/admin
- **Supabase Studio**: http://localhost:54323

## 💡 Tips

- Use Chrome DevTools to inspect network requests
- Check localStorage for cart data persistence
- Widget configuration is in `src/demo-site/components/PortaFuturiWidget.tsx`
- Products are fetched from Supabase in real-time

---

**Need help?** Check the full documentation or open an issue on GitHub.