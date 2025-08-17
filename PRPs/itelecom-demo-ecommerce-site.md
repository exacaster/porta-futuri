# PRP: iTelecom Demo E-commerce Site

## Document Version
- **Version**: 1.0
- **Date**: 2025-08-17
- **Status**: Active
- **Type**: Feature Implementation
- **Confidence Score**: 9/10

## 1. Goal
Create a fully functional demo telecom e-commerce website branded as "iTelecom" that showcases the Porta Futuri AI recommendation widget in a realistic retail environment, demonstrating seamless integration with product catalog, shopping cart, and AI-powered recommendations.

## 2. Why
- **Business Value**: Provides a compelling demonstration platform for potential customers to experience Porta Futuri capabilities
- **Technical Validation**: Proves the widget integrates smoothly with real e-commerce sites
- **Sales Enablement**: Offers a hands-on experience for stakeholders to understand the value proposition
- **Testing Environment**: Serves as a live testing ground for widget improvements and new features

## 3. Context

### 3.1 Existing Codebase References
The project already has all necessary infrastructure:

- **Admin Panel**: `/src/admin/` - Complete product management system
- **Widget Implementation**: `/src/widget/` - Fully functional AI recommendation widget
- **Backend API**: `/supabase/functions/` - All necessary endpoints for products and recommendations
- **Database Schema**: Products table and related infrastructure already exist in Supabase
- **Widget Loader**: `/public/widget-loader.js` - Standard integration pattern

### 3.2 Design Reference
**Design System**:
- **Colors**: 
  - Primary: Purple (#6d02a3)
  - Secondary: White (#ffffff)
  - Accent: Bright Purple (#b12df4)
  - Neutral: Dark Gray (#1e1e20), Light Gray (#f5f5fa)
- **Typography**: Helvetica Neue, Arial
- **Layout**: Responsive grid, card-based products, rounded corners (8-16px)
- **Components**: Minimalist buttons, subtle shadows, image-centric cards

### 3.3 Key Integration Points

#### Product Data Flow
```
Supabase Database (products table)
    ↓
Porta Futuri Backend API
    ↓
iTelecom Demo Site (fetch products)
    ↓
Display in UI + Widget Integration
```

#### Widget Integration Pattern (from `/public/widget-loader.js`):
```javascript
window.PortaFuturi = {
  apiKey: 'demo-api-key',
  customerId: 'DEMO_USER_001' // Optional
};

// Load widget script
const script = document.createElement('script');
script.src = 'https://localhost:5173/widget-bundle.js';
script.dataset.apiKey = 'demo-api-key';
document.body.appendChild(script);
```

### 3.4 Existing Database Schema and Product Management
**IMPORTANT**: The demo site MUST use the existing product catalogue that is managed through the Admin panel at `/src/admin/`.

From `/supabase/migrations/005_products_table_safe.sql`:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  product_id TEXT UNIQUE,  -- Note: Admin uses this field
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  features TEXT[],
  stock_status TEXT,
  image_url TEXT,
  rating DECIMAL(3, 2),
  review_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
- The demo site should display whatever products are currently in the database

### 3.5 Technology Stack Requirements
- **Framework**: React 18.3 with TypeScript
- **UI Components**: shadcn/ui + Radix UI (matching existing codebase)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Build Tool**: Vite
- **Icons**: Lucide React

## 4. Implementation Blueprint

### Phase 1: Project Setup and Structure

#### 1.1 Create iTelecom Demo App Structure
```bash
# Create new demo site within existing project
mkdir -p src/demo-site
cd src/demo-site

# Create folder structure
mkdir -p components/{layout,products,cart,common}
mkdir -p pages
mkdir -p hooks
mkdir -p services
mkdir -p styles
mkdir -p assets
```

#### 1.2 Configure Vite for Demo Site
Create `vite.config.demo.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/demo-site',
  build: {
    outDir: '../../dist/demo-site',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/demo-site'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:54321',
        changeOrigin: true
      }
    }
  }
});
```

### Phase 2: Core Components Implementation

#### 2.1 Create App Shell
`src/demo-site/App.tsx`:
```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { CategoryPage } from '@/pages/CategoryPage';
import { ProductPage } from '@/pages/ProductPage';
import { CartProvider } from '@/contexts/CartContext';
import './styles/globals.css';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/category/:category" element={<CategoryPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster />
        </Router>
      </CartProvider>
    </QueryClientProvider>
  );
}
```

#### 2.2 Implement Product Service (Read-Only)
`src/demo-site/services/productService.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Product } from '@shared/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const productService = {
  async getProducts(category?: string, searchTerm?: string) {
    let query = supabase.from('products').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    
    // Order by most recently updated
    query = query.order('updated_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data as Product[];
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Product;
  },

  async getProductByProductId(productId: string) {
    // Note: Admin panel uses product_id field
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', productId)
      .single();
    
    if (error) throw error;
    return data as Product;
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .order('category');
    
    if (error) throw error;
    return [...new Set(data.map(item => item.category))];
  }
};
```

#### 2.3 Create iTelecom Theme
`src/demo-site/styles/theme.ts`:
```typescript
export const theme = {
  colors: {
    primary: '#6d02a3',
    primaryDark: '#4e0174',
    accent: '#b12df4',
    background: '#ffffff',
    surface: '#f5f5fa',
    text: '#1e1e20',
    textLight: '#666666',
    border: '#e0e0e0',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b'
  },
  typography: {
    fontFamily: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  }
};
```

### Phase 3: Key Features Implementation

#### 3.1 Product Grid Component
`src/demo-site/components/products/ProductGrid.tsx`:
```typescript
import React from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '@shared/types';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-64 rounded-lg mb-4" />
            <div className="bg-gray-200 h-4 rounded w-3/4 mb-2" />
            <div className="bg-gray-200 h-4 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

#### 3.2 Shopping Cart Implementation
`src/demo-site/contexts/CartContext.tsx`:
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '@shared/types';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('itelecom_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('itelecom_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product) => {
    setItems(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(current => current.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(current =>
      current.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
```

### Phase 4: Widget Integration

#### 4.1 Create Widget Integration Component
`src/demo-site/components/PortaFuturiWidget.tsx`:
```typescript
import React, { useEffect } from 'react';

interface WidgetConfig {
  apiKey: string;
  customerId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
}

export function PortaFuturiWidget() {
  useEffect(() => {
    // Set up widget configuration
    window.PortaFuturi = {
      apiKey: import.meta.env.VITE_WIDGET_API_KEY || 'demo-api-key',
      customerId: localStorage.getItem('itelecom_customer_id') || undefined,
      config: {
        position: 'bottom-right',
        theme: {
          primaryColor: '#6d02a3',
          secondaryColor: '#b12df4',
          fontFamily: 'Inter, sans-serif'
        }
      }
    };

    // Load widget script
    const script = document.createElement('script');
    script.src = import.meta.env.VITE_WIDGET_URL || 'http://localhost:5173/widget-bundle.js';
    script.dataset.apiKey = window.PortaFuturi.apiKey;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.PortaFuturi;
    };
  }, []);

  return null;
}
```

#### 4.2 Add Widget to App
Update `src/demo-site/App.tsx`:
```typescript
import { PortaFuturiWidget } from '@/components/PortaFuturiWidget';

// Add inside the App component
<PortaFuturiWidget />
```

### Phase 5: Testing & Deployment

#### 5.1 Environment Configuration
`.env.demo`:
```bash
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key

# Widget
VITE_WIDGET_API_KEY=demo-api-key
VITE_WIDGET_URL=http://localhost:5173/widget-bundle.js

# Demo Site
VITE_DEMO_CUSTOMER_ID=DEMO_USER_001
```

#### 5.2 Package.json Scripts
Add to `package.json`:
```json
{
  "scripts": {
    "dev:demo": "vite --config vite.config.demo.ts",
    "build:demo": "vite build --config vite.config.demo.ts",
    "preview:demo": "vite preview --config vite.config.demo.ts"
  }
}
```
Note: No seed script needed - products are managed via Admin panel

## 6. Validation Gates

### 6.1 Code Quality Checks
```bash
# TypeScript compilation
npm run typecheck

# Linting
npm run lint

# Format check
npm run format:check
```

### 6.2 Functional Tests
```bash
# Component tests
npm run test:demo

# Integration tests - Widget loads correctly
npm run test:integration:widget

# E2E tests - Full user journey
npm run test:e2e:demo
```

### 6.3 Manual Validation Checklist
- [ ] Demo site loads at http://localhost:3000
- [ ] Products display from Supabase database
- [ ] Category filtering works
- [ ] Product detail pages show all information
- [ ] Cart add/remove/update functionality works
- [ ] Cart persists across page refreshes
- [ ] Porta Futuri widget appears in bottom-right
- [ ] Widget can be opened and interacted with
- [ ] Widget shows product recommendations based on catalog
- [ ] Widget uses iTelecom theme colors
- [ ] Site is responsive on mobile/tablet/desktop
- [ ] All iTelecom branding is consistent

### 6.4 Performance Metrics
```bash
# Bundle size check
npm run analyze:demo

# Performance test
npm run lighthouse http://localhost:3000

# Expected metrics:
# - First Contentful Paint: < 1.5s
# - Time to Interactive: < 3s
# - Bundle size: < 200KB (excluding widget)
```

## 7. Error Handling

### 7.1 Product Loading Errors
- Show friendly error message
- Provide retry button
- Fall back to cached data if available

### 7.2 Widget Loading Errors
- Log error to console
- Site continues to function without widget
- Show manual contact option

### 7.3 Cart Errors
- Validate product availability before adding
- Handle quantity limits
- Persist cart to localStorage with error recovery

## 8. Security Considerations

- Use environment variables for sensitive configuration
- Implement CORS properly for widget communication
- Sanitize all user inputs
- Use Supabase RLS for data access control
- No payment processing (as specified)

## 9. Documentation Requirements

### 9.1 README for Demo Site
Create comprehensive documentation including:
- Setup instructions
- Configuration options
- Deployment guide
- Customization points

### 9.2 Integration Guide
Document how the demo integrates with:
- Porta Futuri widget
- Supabase backend
- Admin panel

## 10. Success Criteria

The implementation is successful when:
1. ✅ Demo site displays iTelecom branding throughout
2. ✅ Products load from existing Supabase database
3. ✅ Category filtering and product pages work
4. ✅ Shopping cart functionality is complete (no checkout)
5. ✅ Porta Futuri widget loads and functions correctly
6. ✅ Site is fully responsive
7. ✅ All validation gates pass
8. ✅ Performance metrics are met
9. ✅ Can be deployed and demoed to stakeholders

## 10. Additional Resources

- **Existing Widget Demo**: import { WidgetConfiguration } from './components/WidgetConfiguration';
- **Admin Panel**: http://localhost:5174/admin
- **shadcn/ui Components**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Query**: https://tanstack.com/query/latest