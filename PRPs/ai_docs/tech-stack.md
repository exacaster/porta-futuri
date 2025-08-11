# Porta Futuri Technical Stack Reference

## Frontend Libraries

### React 18.3
```typescript
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// Functional component with TypeScript
const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<Type>(initial);
  return <div>{content}</div>;
};
```

### shadcn/ui Components
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Usage
<Button variant="default" size="sm" onClick={handler}>
  Click me
</Button>
```

### TanStack Query
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['recommendations', userId],
  queryFn: fetchRecommendations,
  staleTime: 15 * 60 * 1000, // 15 minutes
});

// Mutations
const mutation = useMutation({
  mutationFn: updateProfile,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  },
});
```

### Tailwind CSS Classes
```tsx
// Common patterns
<div className="flex items-center justify-between p-4">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <button className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
    Action
  </button>
</div>

// Responsive
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Grid items */}
</div>
```

## Backend Libraries

### Supabase Client
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database queries
const { data, error } = await supabase
  .from('products')
  .select('*')
  .limit(10);

// Edge Functions
const { data, error } = await supabase.functions.invoke('recommendation', {
  body: { userId, context },
});

// Real-time subscriptions
const channel = supabase
  .channel('profile-updates')
  .on('postgres_changes', { 
    event: 'UPDATE', 
    schema: 'public', 
    table: 'profiles' 
  }, handleUpdate)
  .subscribe();
```

### Edge Function Structure
```typescript
// src/api/functions/recommendation.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    const { userId, context } = await req.json();
    
    // Process request
    const recommendations = await generateRecommendations(userId, context);
    
    return new Response(
      JSON.stringify({ recommendations }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

### CSV Processing with PapaParse
```typescript
import Papa from 'papaparse';

// Parse CSV file
Papa.parse(file, {
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  complete: (results) => {
    const data = results.data;
    // Process parsed data
  },
  error: (error) => {
    console.error('CSV parsing error:', error);
  }
});

// Stream large files
Papa.parse(file, {
  header: true,
  step: (row) => {
    // Process row by row
  },
  complete: () => {
    // Parsing complete
  }
});
```

## AI Integration

### Anthropic Claude SDK
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: 1000,
  temperature: 0.7,
  system: "You are a helpful shopping assistant...",
  messages: [
    {
      role: 'user',
      content: userQuery
    }
  ]
});
```

### OpenAI SDK (Fallback)
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    {
      role: 'system',
      content: 'You are a helpful shopping assistant...'
    },
    {
      role: 'user',
      content: userQuery
    }
  ],
  temperature: 0.7,
  max_tokens: 1000,
});
```

## TypeScript Patterns

### Type Definitions
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
```

### Utility Types
```typescript
// Partial for optional updates
type PartialProduct = Partial<Product>;

// Pick for specific fields
type ProductSummary = Pick<Product, 'product_id' | 'name' | 'price'>;

// Omit to exclude fields
type ProductWithoutId = Omit<Product, 'product_id'>;

// Union types for states
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
```

## Testing Patterns

### Vitest Unit Tests
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    render(<Component />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
  });
});
```

### Playwright E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('user can get recommendations', async ({ page }) => {
  await page.goto('/');
  
  // Open widget
  await page.click('[data-testid="widget-trigger"]');
  
  // Type query
  await page.fill('[data-testid="chat-input"]', 'I need a new phone');
  await page.press('[data-testid="chat-input"]', 'Enter');
  
  // Check recommendations appear
  await expect(page.locator('[data-testid="recommendation-card"]')).toHaveCount(3);
});
```

## Common Patterns

### Error Handling
```typescript
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

try {
  const result = await riskyOperation();
} catch (error) {
  if (error instanceof APIError) {
    // Handle API error
    console.error(`API Error ${error.statusCode}: ${error.message}`);
  } else {
    // Handle unexpected error
    console.error('Unexpected error:', error);
  }
}
```

### Rate Limiting
```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute',
});

async function rateLimitedRequest() {
  const remainingRequests = await limiter.removeTokens(1);
  if (remainingRequests < 0) {
    throw new Error('Rate limit exceeded');
  }
  // Proceed with request
}
```

### Caching
```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}
```

## Environment Setup

### Required Environment Variables
```env
# Supabase
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_KEY=[YOUR_SERVICE_KEY]

# AI Services
ANTHROPIC_API_KEY=[YOUR_CLAUDE_KEY]
OPENAI_API_KEY=[YOUR_OPENAI_KEY]

# Widget Configuration
VITE_API_URL=http://localhost:3000/api/v1
VITE_WIDGET_VERSION=1.0.0
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

---

This document serves as a quick reference for AI assistants implementing features in the Porta Futuri project.