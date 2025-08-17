# iTelecom Demo E-commerce Site

A fully functional demo telecom e-commerce website that showcases the Porta Futuri AI recommendation widget integration.

## Features

- 🛍️ **Product Catalog**: Browse products fetched from Supabase database
- 🔍 **Search & Filter**: Search products and filter by category, brand, price
- 🛒 **Shopping Cart**: Full cart functionality with persistent storage
- 📱 **Responsive Design**: Mobile-first, works on all devices
- 🤖 **AI Widget Integration**: Porta Futuri widget for intelligent recommendations
- 🎨 **iTelecom Branding**: Purple theme with modern design

## Tech Stack

- **Frontend**: React 18.3 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + TanStack Query
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **UI Components**: Custom components with shadcn/ui patterns

## Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase CLI installed
- Supabase local instance running

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.demo.example .env.demo
   ```
   Edit `.env.demo` with your Supabase credentials.

3. **Start Supabase (if not running)**:
   ```bash
   npm run supabase:start
   ```

4. **Run database migrations**:
   ```bash
   npm run supabase:migrate
   ```

## Development

### Start the demo site:
```bash
npm run dev:demo
```

The site will be available at http://localhost:3000

### Start all services (admin, widget, demo):
```bash
npm run dev:all
```

This starts:
- Admin panel: http://localhost:5174
- Widget demo: http://localhost:5173
- Demo site: http://localhost:3000

## Building for Production

### Build the demo site:
```bash
npm run build:demo
```

### Build all components:
```bash
npm run build:all
```

## Project Structure

```
src/demo-site/
├── components/        # React components
│   ├── layout/       # Header, Footer
│   ├── products/     # ProductCard, ProductGrid
│   ├── cart/         # Cart components
│   └── ui/           # UI utilities
├── pages/            # Page components
│   ├── HomePage.tsx
│   ├── CategoryPage.tsx
│   ├── ProductPage.tsx
│   └── CartPage.tsx
├── contexts/         # React contexts
│   └── CartContext.tsx
├── services/         # API services
│   └── productService.ts
├── hooks/            # Custom React hooks
├── styles/           # CSS files
│   └── globals.css
├── utils/            # Utility functions
└── assets/           # Static assets
```

## Key Features Implementation

### Product Management
- Products are managed through the Admin panel (`/admin`)
- Demo site fetches products from Supabase in real-time
- No seed data required - uses whatever is in the database

### Shopping Cart
- Persistent cart using localStorage
- Add/remove/update quantities
- Automatic price calculations with VAT
- Free shipping on orders over €50

### Widget Integration
- Porta Futuri widget loads automatically
- Positioned at bottom-right corner
- Uses iTelecom theme colors
- Provides AI-powered product recommendations

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interface
- Optimized for all screen sizes

## Customization

### Theme Colors
Edit theme colors in `src/demo-site/styles/globals.css`:
```css
:root {
  --primary: 267 97% 33%;    /* #6d02a3 */
  --accent: 286 88% 52%;      /* #b12df4 */
}
```

### Branding
Update branding in:
- `src/demo-site/components/layout/Header.tsx` - Logo and navigation
- `src/demo-site/components/layout/Footer.tsx` - Footer content
- `src/demo-site/pages/HomePage.tsx` - Hero section

### Widget Configuration
Configure widget in `src/demo-site/components/PortaFuturiWidget.tsx`:
```typescript
window.PortaFuturi = {
  apiKey: 'your-api-key',
  customerId: 'customer-id',
  config: {
    position: 'bottom-right',
    theme: {
      primaryColor: '#6d02a3'
    }
  }
};
```

## Testing

### Type checking:
```bash
npm run typecheck
```

### Linting:
```bash
npm run lint
```

### Format code:
```bash
npm run format
```

## Deployment

1. Build the production bundle:
   ```bash
   npm run build:demo
   ```

2. The output will be in `dist/demo-site/`

3. Deploy to your hosting service (Vercel, Netlify, etc.)

4. Set environment variables in your hosting platform

## Troubleshooting

### Widget not loading
- Ensure widget dev server is running: `npm run dev:widget-demo`
- Check browser console for errors
- Verify API key in environment variables

### Products not showing
- Check Supabase is running: `npm run supabase:start`
- Verify products exist in Admin panel
- Check network tab for API errors

### Cart not persisting
- Check localStorage is enabled in browser
- Clear browser cache and try again

## License

MIT © Porta Futuri