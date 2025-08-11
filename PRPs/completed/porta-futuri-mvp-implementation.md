name: "Porta Futuri AI Add-On MVP Implementation PRP"
description: |
  Complete implementation of the Porta Futuri AI Add-On MVP, including embeddable widget, AI recommendation engine, CSV processing, and Supabase backend integration.

---

## Goal
Build a fully functional MVP of the Porta Futuri AI Add-On that provides intelligent product recommendations through an embeddable widget, processing CSV data sources (products, customer profile, real-time context) using AI to generate personalized suggestions within 3 seconds.

## Why
- **Business Value**: Enable e-commerce sites to provide AI-powered personalized recommendations without complex integrations
- **User Impact**: Increase conversion rates by 15%+ through relevant product suggestions
- **Market Need**: Simple, privacy-first solution that works with CSV exports from any platform
- **MVP Validation**: Test core recommendation engine before building native integrations

## What
Build a lightweight JavaScript widget (< 50KB compressed) that:
- Embeds with single line of code
- Reads three CSV data sources (products, customer, context)
- Generates 3-5 personalized recommendations using Claude/GPT-4
- Provides chat interface for natural language queries
- Shows real-time customer profile view (FR-005)
- Responds within 3 seconds (P95)

### Success Criteria
- [ ] Widget loads in < 500ms on modern browsers
- [ ] Processes CSV files up to 50MB without errors
- [ ] Generates relevant recommendations in < 3 seconds
- [ ] Achieves 15% CTR in testing
- [ ] Passes security audit with no critical issues
- [ ] Documentation enables integration in < 30 minutes

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://supabase.com/docs/guides/functions
  why: Edge Functions for serverless API endpoints, WebSocket support, background tasks
  
- url: https://react.dev/learn/typescript
  why: React 18.3 with TypeScript patterns for functional components
  
- url: https://ui.shadcn.com/docs/installation
  why: Component library setup and theming with Tailwind v4
  
- url: https://tanstack.com/query/latest/docs/framework/react/overview
  why: TanStack Query v5 for server state, caching, and mutations
  
- url: https://vite.dev/config/build-options
  why: Vite configuration for <50KB bundle target
  
- url: https://www.papaparse.com/docs
  why: CSV streaming parser for 50MB files
  
- url: https://github.com/anthropics/anthropic-sdk-typescript
  why: Claude SDK v0.59.0 with streaming and tool use
  
- url: https://platform.openai.com/docs/api-reference
  why: OpenAI SDK for GPT-4 fallback implementation

- docfile: /Users/egidijus/Documents/Porta futuri/PRPs/completed/porta-futuri-ai-addon-requirements.md
  why: Complete product requirements with data schemas and API specs
  
- docfile: /Users/egidijus/Documents/Porta futuri/PRPs/ai_docs/tech-stack.md
  why: Code patterns and examples for all libraries
  
- docfile: /Users/egidijus/Documents/Porta futuri/CLAUDE.md
  why: Project guidelines and development standards
```

### Current Codebase tree
```bash
porta-futuri/
├── PRPs/
│   ├── completed/
│   │   └── porta-futuri-ai-addon-requirements.md
│   ├── ai_docs/
│   │   └── tech-stack.md
│   └── templates/
├── src/              # Currently empty - to be created
├── tests/            # Currently empty - to be created
└── CLAUDE.md
```

### Desired Codebase tree with files to be added
```bash
porta-futuri/
├── src/
│   ├── widget/                      # React widget code
│   │   ├── index.tsx               # Widget entry point
│   │   ├── App.tsx                 # Main widget component
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx   # Chat UI component
│   │   │   ├── RecommendationCard.tsx  # Product card
│   │   │   ├── CustomerProfile.tsx # Profile viewer (FR-005)
│   │   │   └── WidgetTrigger.tsx   # Floating button
│   │   ├── hooks/
│   │   │   ├── useRecommendations.ts  # API integration hook
│   │   │   ├── useCSVProcessor.ts     # CSV parsing hook
│   │   │   └── useWidgetConfig.ts     # Configuration hook
│   │   ├── services/
│   │   │   ├── api.ts              # API service layer
│   │   │   ├── csvParser.ts        # CSV processing service
│   │   │   └── messageHandler.ts   # PostMessage communication
│   │   └── utils/
│   │       ├── cache.ts            # LRU cache implementation
│   │       └── rateLimit.ts        # Rate limiting client-side
│   ├── api/                        # Backend API code
│   │   ├── functions/               # Supabase Edge Functions
│   │   │   ├── recommendations/
│   │   │   │   └── index.ts        # Main recommendation endpoint
│   │   │   ├── profile-update/
│   │   │   │   └── index.ts        # Profile update endpoint
│   │   │   └── widget-config/
│   │   │       └── index.ts        # Widget configuration endpoint
│   │   ├── lib/
│   │   │   ├── ai/
│   │   │   │   ├── claude.ts       # Anthropic integration
│   │   │   │   ├── openai.ts       # OpenAI fallback
│   │   │   │   └── promptBuilder.ts # Prompt templates
│   │   │   ├── csv/
│   │   │   │   └── processor.ts    # Server-side CSV processing
│   │   │   └── db/
│   │   │       ├── client.ts       # Supabase client
│   │   │       └── schema.sql      # Database schema
│   │   └── types/
│   │       ├── api.types.ts        # API type definitions
│   │       └── database.types.ts   # Supabase types
│   └── shared/                      # Shared code
│       └── types/
│           ├── product.types.ts    # Product interfaces
│           ├── customer.types.ts   # Customer interfaces
│           └── context.types.ts    # Context interfaces
├── tests/
│   ├── unit/
│   │   ├── csvParser.test.ts      # CSV parsing tests
│   │   ├── cache.test.ts          # Cache logic tests
│   │   └── promptBuilder.test.ts  # Prompt generation tests
│   ├── integration/
│   │   ├── api.test.ts            # API endpoint tests
│   │   └── widget.test.tsx        # Widget integration tests
│   └── e2e/
│       └── recommendations.test.ts # Full flow E2E tests
├── public/
│   └── widget-loader.js           # Widget embed script
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── supabase/
│   ├── config.toml                # Supabase configuration
│   └── migrations/                # Database migrations
└── .env.example                   # Environment variables template
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Supabase Edge Functions use Deno runtime, not Node.js
// - Use import maps for npm packages
// - No process.env, use Deno.env.get()
// - TypeScript by default, no transpilation needed

// CRITICAL: React 18.3 is a transitional version
// - Prepare for React 19 deprecations
// - Use functional components only
// - Avoid legacy lifecycle methods

// CRITICAL: TanStack Query v5 breaking changes
// - No onSuccess/onError/onSettled callbacks in useQuery
// - Use useSuspenseQuery for Suspense support
// - Requires React 18+ for useSyncExternalStore

// CRITICAL: Vite bundle size optimization
// - Avoid barrel imports (import from specific files)
// - Use dynamic imports for code splitting
// - Set moduleResolution: "bundler" in tsconfig

// CRITICAL: PapaParse with large files
// - Always use streaming for files > 10MB
// - Use worker: true to prevent UI blocking
// - Implement pause/resume for async operations

// CRITICAL: Widget embedding security
// - Use iframe sandbox attributes
// - Implement Content Security Policy
// - PostMessage origin validation

// CRITICAL: Rate limiting
// - 100 requests/minute per API key (server-side)
// - Implement client-side throttling
// - Handle 429 errors with exponential backoff
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/shared/types/product.types.ts
export interface Product {
  product_id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price: number;
  description: string;
  features?: string[];
  stock_status: 'in_stock' | 'out_of_stock' | 'limited';
  image_url?: string;
  ratings?: number;
  review_count?: number;
}

export interface Recommendation extends Product {
  reasoning: string;
  match_score: number;
}

// src/shared/types/customer.types.ts
export interface CustomerProfile {
  customer_id: string;
  age_group?: string;
  gender?: string;
  location?: string;
  purchase_history?: string[];
  preferences?: string[];
  lifetime_value?: number;
  segment?: string;
}

// src/shared/types/context.types.ts
export interface ContextEvent {
  timestamp: string;
  event_type: 'page_view' | 'search' | 'cart_action' | 'purchase';
  product_id?: string;
  category_viewed?: string;
  search_query?: string;
  cart_action?: 'add' | 'remove';
  session_id: string;
}

// src/api/types/api.types.ts
export interface RecommendationRequest {
  session_id: string;
  query?: string;
  conversation_history?: ConversationMessage[];
  context: {
    current_page?: string;
    cart_items?: string[];
    browsing_category?: string;
    session_duration?: number;
    previous_searches?: string[];
  };
  customer_data: {
    csv_hash: string;
    profile_loaded: boolean;
    context_loaded: boolean;
  };
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  message: string;
  session_id: string;
  response_time: number;
  cache_hit: boolean;
  fallback_used: boolean;
}
```

### List of tasks to be completed in order

```yaml
Task 1: Project Setup and Configuration
CREATE package.json:
  - Initialize with npm init
  - Add all dependencies from research
  - Configure scripts for dev, build, test
  - Set type: "module" for ES modules

CREATE tsconfig.json:
  - Enable strict mode
  - Set moduleResolution: "bundler"
  - Configure paths for @ alias
  - Include src and tests directories

CREATE vite.config.ts:
  - Configure React plugin
  - Set build target for <50KB
  - Configure library mode for widget
  - Set up path aliases

CREATE tailwind.config.ts:
  - Configure content paths
  - Set up shadcn/ui requirements
  - Add custom theme variables

CREATE .env.example:
  - Add all environment variables
  - Include descriptions for each

Task 2: Shared Types and Interfaces
CREATE src/shared/types/product.types.ts:
  - Define Product interface
  - Define Recommendation interface
  - Export validation schemas

CREATE src/shared/types/customer.types.ts:
  - Define CustomerProfile interface
  - Add optional field handling

CREATE src/shared/types/context.types.ts:
  - Define ContextEvent interface
  - Add event type enums

Task 3: Supabase Database Setup
CREATE src/api/lib/db/schema.sql:
  - Create api_keys table
  - Create sessions table
  - Create rate_limits table
  - Add indexes for performance

CREATE src/api/lib/db/client.ts:
  - Initialize Supabase client
  - Add connection pooling
  - Implement retry logic

Task 4: CSV Processing Service
CREATE src/widget/services/csvParser.ts:
  - Implement PapaParse streaming
  - Add validation for each CSV type
  - Handle large files (50MB)
  - Add progress callbacks

CREATE src/api/lib/csv/processor.ts:
  - Server-side CSV validation
  - Data transformation logic
  - Error handling for malformed data

Task 5: AI Integration Layer
CREATE src/api/lib/ai/promptBuilder.ts:
  - Create recommendation prompt template
  - Add context formatting
  - Implement token optimization

CREATE src/api/lib/ai/claude.ts:
  - Initialize Anthropic SDK
  - Implement streaming responses
  - Add error handling and retries

CREATE src/api/lib/ai/openai.ts:
  - Initialize OpenAI SDK as fallback
  - Match Claude response format
  - Implement fallback trigger logic

Task 6: Cache Implementation
CREATE src/widget/utils/cache.ts:
  - Implement LRU cache
  - Add 15-minute TTL
  - Include cache invalidation

CREATE src/widget/utils/rateLimit.ts:
  - Client-side rate limiting
  - Exponential backoff
  - Queue management

Task 7: API Endpoints
CREATE src/api/functions/recommendations/index.ts:
  - Main recommendation endpoint
  - CSV processing pipeline
  - AI integration
  - Response caching

CREATE src/api/functions/profile-update/index.ts:
  - Real-time profile updates
  - WebSocket support
  - Event validation

CREATE src/api/functions/widget-config/index.ts:
  - Widget configuration endpoint
  - Theme settings
  - Feature flags

Task 8: Widget Components
CREATE src/widget/components/ChatInterface.tsx:
  - Chat input field
  - Message history display
  - Typing indicators
  - Error states

CREATE src/widget/components/RecommendationCard.tsx:
  - Product display card
  - Image lazy loading
  - Click tracking
  - Responsive design

CREATE src/widget/components/CustomerProfile.tsx:
  - Profile data display (FR-005)
  - Real-time updates
  - Context visualization
  - Privacy controls

CREATE src/widget/components/WidgetTrigger.tsx:
  - Floating action button
  - Position configuration
  - Animation states
  - Accessibility

Task 9: Widget Hooks
CREATE src/widget/hooks/useRecommendations.ts:
  - TanStack Query integration
  - Caching strategy
  - Error handling
  - Loading states

CREATE src/widget/hooks/useCSVProcessor.ts:
  - File upload handling
  - Progress tracking
  - Validation feedback

CREATE src/widget/hooks/useWidgetConfig.ts:
  - Configuration management
  - Theme application
  - Feature toggles

Task 10: Widget Services
CREATE src/widget/services/api.ts:
  - API client setup
  - Request interceptors
  - Response transformation
  - Error handling

CREATE src/widget/services/messageHandler.ts:
  - PostMessage setup
  - Origin validation
  - Message queuing
  - Security

Task 11: Main Widget App
CREATE src/widget/App.tsx:
  - Main widget container
  - State management
  - Theme provider
  - Error boundaries

CREATE src/widget/index.tsx:
  - Widget initialization
  - Iframe setup
  - Configuration parsing
  - Root rendering

Task 12: Widget Loader Script
CREATE public/widget-loader.js:
  - Single-line embed code
  - Iframe creation
  - Configuration passing
  - Error handling

Task 13: Testing Setup
CREATE tests/unit/csvParser.test.ts:
  - CSV parsing tests
  - Edge cases
  - Large file handling

CREATE tests/unit/cache.test.ts:
  - Cache behavior tests
  - TTL verification
  - LRU eviction

CREATE tests/integration/api.test.ts:
  - Endpoint testing
  - Rate limiting
  - Error responses

CREATE tests/e2e/recommendations.test.ts:
  - Full user flow
  - Performance metrics
  - CTR tracking

Task 14: Build Configuration
UPDATE vite.config.ts:
  - Production optimizations
  - Bundle analysis
  - Compression settings

CREATE supabase/config.toml:
  - Edge Function configuration
  - CORS settings
  - Rate limits

Task 15: Documentation
CREATE README.md:
  - Quick start guide
  - Integration examples
  - API reference
  - Troubleshooting
```

### Per task pseudocode

```typescript
// Task 4: CSV Processing Service - csvParser.ts
import Papa from 'papaparse';

export class CSVProcessor {
  private cache = new Map<string, ProcessedData>();
  
  async processProductCSV(file: File): Promise<Product[]> {
    // PATTERN: Stream large files to avoid memory issues
    return new Promise((resolve, reject) => {
      const products: Product[] = [];
      
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        worker: true, // CRITICAL: Use worker for UI responsiveness
        step: (row) => {
          // VALIDATION: Required fields check
          if (!row.data.product_id || !row.data.name) {
            return; // Skip invalid rows
          }
          
          // TRANSFORM: Map to Product interface
          products.push(this.transformToProduct(row.data));
          
          // GOTCHA: Limit to 10,000 products
          if (products.length >= 10000) {
            parser.abort();
          }
        },
        complete: () => resolve(products),
        error: (err) => reject(new Error(`CSV parsing failed: ${err.message}`))
      });
    });
  }
}

// Task 5: AI Integration - claude.ts
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeService {
  private client: Anthropic;
  private readonly MAX_RETRIES = 3;
  
  async getRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    // PATTERN: Use retry decorator pattern
    return this.withRetry(async () => {
      // CRITICAL: Token optimization
      const prompt = this.buildOptimizedPrompt(context);
      
      // GOTCHA: Use streaming for better UX
      const stream = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        system: RECOMMENDATION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      });
      
      // PATTERN: Parse streaming response
      return this.parseStreamingResponse(stream);
    });
  }
  
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    // PATTERN: Exponential backoff
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === this.MAX_RETRIES - 1) throw error;
        await this.delay(Math.pow(2, i) * 1000);
      }
    }
  }
}

// Task 6: Cache Implementation - cache.ts
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize = 100;
  private readonly ttl = 15 * 60 * 1000; // 15 minutes
  
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    // PATTERN: Check TTL
    if (!entry || Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // PATTERN: Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }
  
  set(key: string, data: T): void {
    // PATTERN: Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Task 7: Recommendation Endpoint - recommendations/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req: Request) => {
  try {
    // PATTERN: CORS handling
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        headers: getCORSHeaders() 
      });
    }
    
    // VALIDATION: API key check
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!await validateAPIKey(apiKey)) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401 }
      );
    }
    
    // PATTERN: Rate limiting check
    if (!await checkRateLimit(apiKey)) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retry_after: 60 
        }),
        { status: 429 }
      );
    }
    
    // PROCESS: Parse request
    const body = await req.json() as RecommendationRequest;
    
    // PATTERN: Check cache first
    const cacheKey = generateCacheKey(body);
    const cached = cache.get(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ ...cached, cache_hit: true }),
        { headers: { 'Content-Type': 'application/json' }}
      );
    }
    
    // AI: Generate recommendations
    const recommendations = await aiService.getRecommendations(body);
    
    // CACHE: Store result
    cache.set(cacheKey, recommendations);
    
    return new Response(
      JSON.stringify({ 
        recommendations,
        cache_hit: false,
        response_time: Date.now() - startTime
      }),
      { headers: { 'Content-Type': 'application/json' }}
    );
    
  } catch (error) {
    // PATTERN: Fallback to static recommendations
    if (error.message.includes('rate limit')) {
      return new Response(
        JSON.stringify({
          recommendations: getStaticRecommendations(),
          fallback_used: true
        }),
        { status: 200 }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

### Integration Points
```yaml
DATABASE:
  migration: |
    -- Create api_keys table
    CREATE TABLE api_keys (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      key TEXT UNIQUE NOT NULL,
      name TEXT,
      rate_limit INTEGER DEFAULT 100,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Create sessions table
    CREATE TABLE sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      api_key_id UUID REFERENCES api_keys(id),
      customer_data JSONB,
      context JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 minutes'
    );
    
    -- Indexes for performance
    CREATE INDEX idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX idx_api_keys_key ON api_keys(key);
  
CONFIG:
  add to: .env
  pattern: |
    # Supabase
    SUPABASE_URL=https://[PROJECT_ID].supabase.co
    SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
    SUPABASE_SERVICE_KEY=[YOUR_SERVICE_KEY]
    
    # AI Services
    ANTHROPIC_API_KEY=[YOUR_CLAUDE_KEY]
    OPENAI_API_KEY=[YOUR_OPENAI_KEY]
    
    # Widget
    VITE_API_URL=http://localhost:54321/functions/v1
    VITE_WIDGET_VERSION=1.0.0
  
ROUTES:
  add to: supabase/functions/import_map.json
  pattern: |
    {
      "imports": {
        "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2",
        "@anthropic-ai/sdk": "https://esm.sh/@anthropic-ai/sdk@0.59.0",
        "openai": "https://esm.sh/openai@latest"
      }
    }
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# TypeScript compilation
npm run typecheck

# Linting
npm run lint

# Format check
npm run format:check

# Expected: No errors. If errors, fix based on output.
```

### Level 2: Unit Tests
```typescript
// tests/unit/csvParser.test.ts
import { describe, it, expect } from 'vitest';
import { CSVProcessor } from '@/widget/services/csvParser';

describe('CSVProcessor', () => {
  it('should parse valid product CSV', async () => {
    const csv = new File([
      'product_id,name,price\n',
      'PROD1,iPhone 15,999\n'
    ], 'products.csv');
    
    const processor = new CSVProcessor();
    const products = await processor.processProductCSV(csv);
    
    expect(products).toHaveLength(1);
    expect(products[0].product_id).toBe('PROD1');
  });
  
  it('should handle 50MB files', async () => {
    // Generate large CSV
    const largeCSV = generateLargeCSV(50 * 1024 * 1024);
    const processor = new CSVProcessor();
    
    const start = Date.now();
    await processor.processProductCSV(largeCSV);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000); // Under 1 second
  });
  
  it('should limit to 10,000 products', async () => {
    const csv = generateProductCSV(15000);
    const processor = new CSVProcessor();
    const products = await processor.processProductCSV(csv);
    
    expect(products).toHaveLength(10000);
  });
});

// tests/unit/cache.test.ts
describe('LRUCache', () => {
  it('should expire after TTL', async () => {
    const cache = new LRUCache<string>();
    cache.set('key', 'value');
    
    // Fast-forward time
    vi.advanceTimersByTime(16 * 60 * 1000);
    
    expect(cache.get('key')).toBeNull();
  });
  
  it('should evict LRU when at capacity', () => {
    const cache = new LRUCache<string>();
    
    for (let i = 0; i < 101; i++) {
      cache.set(`key${i}`, `value${i}`);
    }
    
    expect(cache.get('key0')).toBeNull();
    expect(cache.get('key100')).toBe('value100');
  });
});
```

```bash
# Run unit tests
npm run test:unit

# Check coverage
npm run test:coverage

# Expected: All tests passing, >80% coverage
```

### Level 3: Integration Tests
```bash
# Start Supabase locally
npx supabase start

# Run Edge Functions
npx supabase functions serve

# Test recommendation endpoint
curl -X POST http://localhost:54321/functions/v1/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-api-key" \
  -d '{
    "session_id": "test-session",
    "query": "I need a new phone",
    "context": {
      "browsing_category": "Electronics"
    },
    "customer_data": {
      "csv_hash": "abc123",
      "profile_loaded": true,
      "context_loaded": true
    }
  }'

# Expected: 200 OK with recommendations array
```

### Level 4: E2E Tests
```typescript
// tests/e2e/recommendations.test.ts
import { test, expect } from '@playwright/test';

test('complete recommendation flow', async ({ page }) => {
  // Load test page with widget
  await page.goto('/test-page.html');
  
  // Initialize widget
  await page.evaluate(() => {
    PortaFuturi.init({
      apiKey: 'test-key',
      containerId: 'widget-container',
      data: {
        productCatalogUrl: '/test-data/products.csv',
        customerProfileUrl: '/test-data/customer.csv',
        contextUrl: '/test-data/context.csv'
      }
    });
  });
  
  // Open widget
  await page.click('[data-testid="widget-trigger"]');
  await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
  
  // Type query
  await page.fill('[data-testid="chat-input"]', 'Show me phones with good cameras');
  await page.press('[data-testid="chat-input"]', 'Enter');
  
  // Check recommendations appear within 3 seconds
  await expect(page.locator('[data-testid="recommendation-card"]'))
    .toHaveCount(3, { timeout: 3000 });
  
  // Verify customer profile is visible (FR-005)
  await page.click('[data-testid="profile-toggle"]');
  await expect(page.locator('[data-testid="customer-profile"]')).toBeVisible();
  
  // Check CTR tracking
  await page.click('[data-testid="recommendation-card"]:first-child');
  const metrics = await page.evaluate(() => window.PortaFuturi.getMetrics());
  expect(metrics.ctr).toBeGreaterThan(0);
});
```

```bash
# Run E2E tests
npm run test:e2e

# Expected: All flows passing, <3s response time
```

## Final Validation Checklist
- [ ] All TypeScript compiles without errors: `npm run typecheck`
- [ ] No linting issues: `npm run lint`
- [ ] Unit tests pass with >80% coverage: `npm run test:coverage`
- [ ] Integration tests pass: `npm run test:integration`
- [ ] E2E tests complete in <3 seconds: `npm run test:e2e`
- [ ] Widget bundle size <50KB: `npm run build && ls -lh dist/widget.js`
- [ ] CSV files up to 50MB process without errors
- [ ] Rate limiting works (100 req/min)
- [ ] Fallback to static recommendations works
- [ ] Customer profile view updates in real-time
- [ ] Documentation allows integration in <30 minutes
- [ ] CORS properly configured for widget embedding
- [ ] Security headers implemented
- [ ] Error messages are user-friendly
- [ ] Accessibility: WCAG 2.1 AA compliant

---

## Anti-Patterns to Avoid
- ❌ Don't store customer data persistently (privacy requirement)
- ❌ Don't skip CSV validation (security risk)
- ❌ Don't hardcode API keys (use environment variables)
- ❌ Don't ignore rate limits (implement exponential backoff)
- ❌ Don't bundle unnecessary dependencies (keep <50KB)
- ❌ Don't use synchronous file operations (always stream)
- ❌ Don't trust PostMessage without origin validation
- ❌ Don't skip error boundaries in React components
- ❌ Don't use deprecated React patterns (class components)
- ❌ Don't forget to clean up subscriptions and intervals

## Success Metrics Tracking
```typescript
// Add to widget initialization
window.PortaFuturi = {
  metrics: {
    loadTime: 0,
    responseTime: [],
    ctr: 0,
    sessionDuration: 0,
    errorRate: 0
  },
  getMetrics: () => window.PortaFuturi.metrics,
  trackEvent: (event) => {
    // Send to analytics if enabled
  }
};
```

---

**PRP Confidence Score: 9/10**

This PRP provides comprehensive context for one-pass implementation with:
- Complete technical specifications from requirements
- All necessary documentation URLs
- Detailed implementation blueprint with pseudocode
- Extensive validation gates at multiple levels
- Clear file structure and dependencies
- Known gotchas and patterns documented
- Success criteria and metrics defined

The AI agent has everything needed to implement the MVP successfully.