# PRP: Porta Futuri AI-Powered Product Search and Recommendations

## Document Version
- **Version**: 1.0
- **Date**: 2025-08-13
- **Status**: Ready for Implementation
- **Confidence Score**: 9/10

## Goal
Implement UC-001: Product Search and AI-Assisted Recommendations by:
1. Building a fully functional AI-powered chat interface in the Porta Futuri Widget
2. Integrating Claude AI for intelligent product recommendations
3. When sending recommendation requests, add full procut catalogue information as a context for the recommendations
4. Embedding the real widget in the admin panel's live preview section
5. Ensuring the widget works when embedded via script tag on any website

## Why
- **Business Value**: Enable intelligent product recommendations that increase conversion rates
- **User Impact**: Provide personalized shopping assistance that understands natural language queries
- **Technical Benefits**: Showcase the full capabilities of the Porta Futuri platform

## Context

### Current State Analysis
Based on codebase research, the following components exist:
- **Widget UI** (`/src/widget/`): React-based chat interface with conversation management
- **Admin Panel** (`/src/admin/`): Has preview but uses static mockup, not real widget
- **API Endpoint** (`/supabase/functions/recommendations/`): Basic structure but returns mock data
- **Widget Loader** (`/public/widget-loader.js`): Script for embedding but needs bundled widget

### Key Requirements from Product Vision
- Response time: <3 seconds (P95) for recommendations
- Widget load time: <500ms
- Support natural language queries with follow-up questions
- Show 3-5 relevant product recommendations
- Transparent AI: Display reasoning for recommendations
- Session management with 30-minute timeout

### Technical Stack
- Frontend: React 18.3 + TypeScript + TanStack Query
- Backend: Supabase Edge Functions (Deno)
- LLM: Claude (Anthropic SDK)
- Build: Vite
- Styling: Tailwind CSS

## Implementation Blueprint

### Phase 1: LLM Integration in Supabase Edge Function

#### 1.1 Install Anthropic SDK in Edge Function
```typescript
// File: /supabase/functions/recommendations/index.ts
// Add import at top
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
});
```

#### 1.2 Create AI Recommendation Service
```typescript
// File: /supabase/functions/_shared/ai-service.ts
export class AIRecommendationService {
  private anthropic: Anthropic;
  
  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async generateRecommendations(params: {
    query: string;
    products: Product[];
    customerProfile?: CustomerProfile;
    conversationHistory?: Message[];
  }): Promise<RecommendationResponse> {
    // Build context-aware prompt
    const prompt = this.buildPrompt(params);
    
    // Call Claude API
    const completion = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1500,
      temperature: 0.7,
      system: "You are a helpful shopping assistant...",
      messages: [{ role: 'user', content: prompt }]
    });
    
    // Parse and return recommendations
    return this.parseResponse(completion.content[0].text);
  }
  
  private buildPrompt(params: any): string {
    // Implementation following patterns from vision document
  }
  
  private parseResponse(text: string): RecommendationResponse {
    // Parse Claude's response into structured format
  }
}
```

#### 1.3 Update Recommendation Endpoint
```typescript
// File: /supabase/functions/recommendations/index.ts
// Replace generateRecommendations function with:
async function generateRecommendations(request: RecommendationRequest): Promise<any> {
  try {
    const aiService = new AIRecommendationService(
      Deno.env.get('ANTHROPIC_API_KEY')!
    );
    
    const result = await aiService.generateRecommendations({
      query: request.query || '',
      products: request.products || [],
      customerProfile: request.customer_profile,
      conversationHistory: request.conversation_history
    });
    
    return {
      recommendations: result.recommendations,
      message: result.message,
      intent: result.intent,
      fallback_used: false
    };
  } catch (error) {
    console.error('AI generation failed, using fallback:', error);
    return getFallbackRecommendations(request);
  }
}
```

### Phase 2: Widget Bundle Creation and Deployment

#### 2.1 Create Production Widget Build
```typescript
// File: /vite.config.widget.prod.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget/index.tsx'),
      name: 'PortaFuturi',
      fileName: 'widget',
      formats: ['iife']
    },
    outDir: 'dist/widget',
    rollupOptions: {
      output: {
        assetFileNames: '[name][extname]',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    minify: true,
    sourcemap: false
  }
});
```

#### 2.2 Update Widget Entry Point
```typescript
// File: /src/widget/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/widget.css';

// Global initialization function
(window as any).PortaFuturi = {
  init: function(config: any) {
    const container = document.getElementById(config.containerId);
    if (!container) {
      console.error('[Porta Futuri] Container not found:', config.containerId);
      return;
    }
    
    // Enable pointer events for widget container
    container.style.pointerEvents = 'auto';
    
    // Create React root and render
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App config={config} />
      </React.StrictMode>
    );
    
    // Store reference for cleanup
    (window as any).PortaFuturi._root = root;
  },
  
  destroy: function() {
    if ((window as any).PortaFuturi._root) {
      (window as any).PortaFuturi._root.unmount();
    }
  }
};

// Auto-init if data attributes present
if (document.currentScript) {
  const script = document.currentScript as HTMLScriptElement;
  if (script.dataset.apiKey) {
    document.addEventListener('DOMContentLoaded', () => {
      (window as any).PortaFuturi.init({
        apiKey: script.dataset.apiKey,
        apiUrl: script.dataset.apiUrl,
        position: script.dataset.position,
        containerId: 'porta-futuri-widget-loader'
      });
    });
  }
}
```

#### 2.3 Build Script Updates
```json
// File: /package.json
// Add to scripts section:
{
  "scripts": {
    "build:widget": "vite build --config vite.config.widget.prod.ts",
    "build:widget:watch": "vite build --config vite.config.widget.prod.ts --watch",
    "serve:widget": "npx http-server dist/widget -p 3001 --cors"
  }
}
```

### Phase 3: Admin Panel Live Preview with Real Widget

#### 3.1 Create Widget Preview Component
```typescript
// File: /src/admin/components/WidgetPreview.tsx
import React, { useEffect, useRef, useState } from 'react';

interface WidgetPreviewProps {
  apiKey: string;
  config: {
    position: string;
    primaryColor: string;
    apiUrl: string;
  };
  products?: any[];
}

export const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  apiKey,
  config,
  products
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current || !apiKey) return;
    
    // Create a unique container ID
    const containerId = `widget-preview-${Date.now()}`;
    containerRef.current.id = containerId;
    
    // Load the actual widget
    const loadWidget = async () => {
      try {
        // In development, load from local build
        const widgetUrl = import.meta.env.DEV 
          ? 'http://localhost:3001/widget.js'
          : '/widget/widget.js';
        
        // Dynamically import the widget
        const script = document.createElement('script');
        script.src = widgetUrl;
        script.onload = () => {
          // Initialize widget with config
          if ((window as any).PortaFuturi) {
            (window as any).PortaFuturi.init({
              apiKey,
              apiUrl: config.apiUrl,
              position: config.position,
              containerId,
              theme: {
                primaryColor: config.primaryColor
              },
              data: {
                products: products || []
              }
            });
            setIsLoaded(true);
          }
        };
        document.body.appendChild(script);
        
        // Cleanup
        return () => {
          if ((window as any).PortaFuturi?.destroy) {
            (window as any).PortaFuturi.destroy();
          }
          document.body.removeChild(script);
        };
      } catch (error) {
        console.error('Failed to load widget:', error);
      }
    };
    
    loadWidget();
  }, [apiKey, config]);
  
  return (
    <div className="relative bg-gray-100 rounded-lg h-[600px] overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {!isLoaded && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading widget...</p>
          </div>
        )}
      </div>
      
      {/* Widget container */}
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* Sample page content for context */}
      <div className="p-8 pointer-events-none">
        <h2 className="text-2xl font-bold mb-4">Sample E-Commerce Page</h2>
        <p className="text-gray-600 mb-4">
          This is a preview of how the widget will appear on your website.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-4 rounded shadow">
              <div className="h-32 bg-gray-200 rounded mb-2"></div>
              <h3 className="font-semibold">Product {i}</h3>
              <p className="text-gray-600">$99.99</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

#### 3.2 Update WidgetConfiguration Component
```typescript
// File: /src/admin/components/WidgetConfiguration.tsx
// Replace the Live Preview section (lines 472-618) with:

import { WidgetPreview } from './WidgetPreview';

// In the component, fetch products for preview
const [products, setProducts] = useState<any[]>([]);

useEffect(() => {
  // Fetch sample products for preview
  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .limit(10);
    setProducts(data || []);
  };
  fetchProducts();
}, []);

// Replace the Live Preview section with:
{/* Live Preview Section */}
<div className="bg-white rounded-lg shadow p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold">Live Preview</h2>
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">
        {selectedKey ? 'Using selected API key' : 'No API key selected'}
      </span>
      {isLoaded && (
        <span className="flex items-center gap-1 text-green-600">
          <Check className="w-4 h-4" />
          Widget Loaded
        </span>
      )}
    </div>
  </div>
  
  {selectedKey ? (
    <WidgetPreview
      apiKey={selectedKey}
      config={widgetConfig}
      products={products}
    />
  ) : (
    <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
      <p className="text-gray-500">Select an API key to preview the widget</p>
    </div>
  )}
</div>
```

### Phase 4: Environment Configuration and Deployment

#### 4.1 Environment Variables
```bash
# File: /.env.local
VITE_SUPABASE_URL=https://rvlbbgdkgneobvlyawix.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_claude_api_key
```

#### 4.2 Supabase Edge Function Secrets
```bash
# Set secrets for Edge Functions
supabase secrets set ANTHROPIC_API_KEY=your_claude_api_key
```

#### 4.3 Deploy Edge Function
```bash
# Deploy the updated recommendation function
supabase functions deploy recommendations
```

### Phase 5: Testing and Validation

#### 5.1 Widget Functionality Tests
```typescript
// File: /tests/integration/widget-chat.test.ts
import { test, expect } from '@playwright/test';

test.describe('Widget Chat Functionality', () => {
  test('should load widget and display greeting', async ({ page }) => {
    await page.goto('/test-embed.html');
    
    // Wait for widget to load
    await page.waitForSelector('#porta-futuri-widget-loader');
    
    // Click widget trigger
    await page.click('[data-testid="widget-trigger"]');
    
    // Check greeting message
    const greeting = await page.textContent('[data-testid="chat-message"]:first-child');
    expect(greeting).toContain('Hello');
  });
  
  test('should search for products', async ({ page }) => {
    await page.goto('/test-embed.html');
    await page.click('[data-testid="widget-trigger"]');
    
    // Type search query
    await page.fill('[data-testid="chat-input"]', 'laptop for programming');
    await page.press('[data-testid="chat-input"]', 'Enter');
    
    // Wait for recommendations
    await page.waitForSelector('[data-testid="product-recommendation"]', {
      timeout: 5000
    });
    
    // Check recommendations displayed
    const recommendations = await page.$$('[data-testid="product-recommendation"]');
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(5);
  });
});
```

#### 5.2 API Response Time Test
```typescript
// File: /tests/integration/api-performance.test.ts
import { test, expect } from '@playwright/test';

test('API should respond within 3 seconds', async ({ request }) => {
  const startTime = Date.now();
  
  const response = await request.post('/api/v1/recommendations', {
    data: {
      session_id: 'test-session',
      query: 'gaming laptop',
      products: [] // Will be loaded from CSV
    },
    headers: {
      'Authorization': 'Bearer dev_key_porta_futuri_2024'
    }
  });
  
  const responseTime = Date.now() - startTime;
  
  expect(response.status()).toBe(200);
  expect(responseTime).toBeLessThan(3000); // Under 3 seconds
  
  const data = await response.json();
  expect(data.recommendations).toBeDefined();
  expect(data.recommendations.length).toBeGreaterThan(0);
});
```

## Validation Gates

### Pre-Implementation Checks
```bash
# Verify dependencies
npm ls @anthropic-ai/sdk @tanstack/react-query vite

# Check environment variables
grep -E "ANTHROPIC_API_KEY|SUPABASE" .env.local

# Verify Supabase connection
npx supabase status
```

### Build Validation
```bash
# Build widget
npm run build:widget

# Check bundle size (should be <50KB)
ls -lh dist/widget/widget.js

# Build admin panel
npm run build:admin

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Integration Tests
```bash
# Run all tests
npm test

# Run integration tests specifically
npm run test:integration

# Test widget embedding
npm run test:e2e
```

### Manual Testing Checklist
- [ ] Widget loads in <500ms
- [ ] Chat interface opens/closes smoothly
- [ ] Greeting message displays
- [ ] Can search for products
- [ ] Recommendations appear in <3 seconds
- [ ] Product cards show reasoning
- [ ] Session persists across page refreshes
- [ ] Admin panel live preview works
- [ ] Widget embeds correctly via script tag
- [ ] API rate limiting works (100 req/min)

## Error Handling Strategy

### LLM Failures
- Primary: Claude API with 10-second timeout
- Fallback: Static recommendations based on category
- User notification: "Using cached recommendations"

### Network Failures
- Implement exponential backoff (1s, 2s, 4s)
- Cache responses for 15 minutes
- Show offline mode indicator

## Implementation Order

1. **Phase 1**: LLM Integration
   - Set up Anthropic SDK
   - Create AI service
   - Update Edge Function
   
2. **Phase 2**: Widget Bundle
   - Configure Vite build
   - Update entry point
   - Test bundle size
   
3. **Phase 3**: Admin Preview
   - Create preview component
   - Update configuration UI
   - Test embedding
   
4. **Phase 4**: Environment Setup
   - Configure secrets
   - Deploy functions
   - Verify connections
   
5. **Phase 5**: Testing
   - Run automated tests
   - Manual testing
   - Performance validation

## Success Criteria

1. ✅ Widget loads and displays chat interface
2. ✅ Users can search for products using natural language
3. ✅ AI returns 3-5 relevant recommendations with reasoning
4. ✅ Response time <3 seconds (P95)
5. ✅ Widget works when embedded via script tag
6. ✅ Admin panel shows real widget in live preview
7. ✅ All tests pass with >80% coverage
8. ✅ Bundle size <50KB compressed

## Known Gotchas and Solutions

### CORS Issues
- Supabase Edge Functions need proper CORS headers
- Widget needs to handle cross-origin communication
- Solution: Use provided corsHeaders utility

### React 18 Hydration
- Widget may conflict with host site's React
- Solution: Use IIFE bundle format with no external dependencies

### API Key Security
- Never expose service keys in frontend
- Solution: Use anon key + RLS policies

### Session Storage Limits
- SessionStorage has 5-10MB limit
- Solution: Store only last 5 messages

## Documentation References

- Anthropic SDK: https://docs.anthropic.com/claude/reference/client-sdks
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Vite Library Mode: https://vitejs.dev/guide/build.html#library-mode
- React 18 Root API: https://react.dev/reference/react-dom/client/createRoot
- TanStack Query: https://tanstack.com/query/latest

## Quality Score: 9/10

**Confidence Level**: Very High
- Clear implementation path with specific code examples
- All dependencies and patterns verified in codebase
- Comprehensive testing strategy included
- Error handling and fallbacks defined
- Performance requirements addressed

**Risk Factors** (-1 point):
- Claude API integration in Deno environment may have edge cases
- Widget embedding in various host environments needs thorough testing

---

*This PRP provides a complete blueprint for implementing AI-powered product search and recommendations in the Porta Futuri widget, with full integration into the admin panel's live preview.*