# PRP: UC-002 - Intent Detection from Browsing Behavior

## Document Version
- **PRP ID**: UC-002-INTENT-DETECTION
- **Date**: January 22, 2025
- **Priority**: High
- **Estimated Effort**: 3-4 hours
- **Confidence Score**: 9/10

## 1. Goal
Implement browsing behavior tracking and AI-powered intent detection with a dedicated tab in the widget to display collected browsing data and inferred user intent, while refactoring demo site product URLs to use semantic paths.

## 2. Why
- **Business Value**: Enables proactive engagement with users based on their browsing patterns, increasing conversion rates
- **User Impact**: Provides personalized, contextual assistance without requiring explicit user queries
- **Technical Benefit**: Creates semantic URLs that allow AI to better understand user intent from browsing patterns

## 3. Context

### Requirements Reference
From `/Users/egidijus/Documents/Porta futuri/PRPs/to_does/porta-futuri-product-vision.md`:
- Lines 37-47: UC-002 specification for intent detection from browsing behavior
- Lines 237-259: Event tracking schema specification
- Lines 459-487: Intent detection prompt templates
- Lines 1464-1492: Intent detection examples

### Existing Code Structure
```
src/
├── widget/
│   ├── components/
│   │   ├── ChatInterface.tsx (current main interface)
│   │   └── CustomerProfile.tsx (profile view reference)
│   ├── services/
│   │   └── eventTracking.ts (NEW - to be created)
│   └── hooks/
│       └── useBrowsingHistory.ts (NEW - to be created)
├── shared/types/
│   └── context.types.ts (existing event types)
└── demo-site/
    ├── components/products/
    │   └── ProductCard.tsx (line 47: product link generation)
    └── pages/
        └── ProductPage.tsx (product routing)
```

### Dependencies Available
- `@radix-ui/react-tabs@1.1.13` - For tab UI components
- Event types already defined in `src/shared/types/context.types.ts`
- Widget trackEvent function in `src/widget/index.tsx`
- PostMessage API for parent-child communication

### Key Patterns to Follow
1. **Event Tracking Pattern** (from context.types.ts):
   ```typescript
   interface ContextEvent {
     timestamp: string;
     event_type: EventType;
     page_url?: string;
     session_id: string;
   }
   ```

2. **Tab Pattern** (similar to CustomerProfile toggle):
   ```typescript
   const [showProfile, setShowProfile] = useState(false);
   ```

3. **Product URL Pattern** (current):
   ```typescript
   <Link to={`/product/${product.id}`}>
   ```

## 4. Implementation Blueprint

### Phase 1: Event Tracking Service

#### Task 1.1: Create Event Tracking Service
```typescript
// src/widget/services/eventTracking.ts
import { ContextEvent } from '@shared/types/context.types';

export class EventTrackingService {
  private events: ContextEvent[] = [];
  private maxEvents = 50; // Keep last 50 events
  private sessionId: string;
  
  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.setupListeners();
  }
  
  private setupListeners() {
    // Listen for navigation events from parent
    window.addEventListener('message', this.handleParentMessage);
  }
  
  private handleParentMessage = (event: MessageEvent) => {
    if (event.data.type === 'porta-futuri-page-view') {
      this.trackPageView(event.data.url, event.data.title);
    }
  };
  
  trackPageView(url: string, title?: string) {
    const event: ContextEvent = {
      timestamp: new Date().toISOString(),
      event_type: 'page_view',
      page_url: url,
      session_id: this.sessionId,
      category_viewed: this.extractCategoryFromUrl(url)
    };
    
    this.addEvent(event);
  }
  
  private extractCategoryFromUrl(url: string): string | undefined {
    // Extract category from semantic URL: /electronics/iphone-15-pro
    const match = url.match(/\/([^\/]+)\/[^\/]+$/);
    return match ? match[1] : undefined;
  }
  
  private addEvent(event: ContextEvent) {
    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }
    
    // Persist to sessionStorage
    sessionStorage.setItem('porta_futuri_browsing_history', JSON.stringify(this.events));
  }
  
  getEvents(): ContextEvent[] {
    return this.events;
  }
  
  clearHistory() {
    this.events = [];
    sessionStorage.removeItem('porta_futuri_browsing_history');
  }
  
  destroy() {
    window.removeEventListener('message', this.handleParentMessage);
  }
}
```

### Phase 2: Intent Detection Hook

#### Task 2.1: Create Browsing History Hook
```typescript
// src/widget/hooks/useBrowsingHistory.ts
import { useState, useEffect, useCallback } from 'react';
import { ContextEvent, IntentSignals } from '@shared/types/context.types';
import { EventTrackingService } from '../services/eventTracking';

interface BrowsingIntent {
  intent: string;
  confidence: number;
  signals: string[];
  suggestedMessage?: string;
}

export function useBrowsingHistory(sessionId: string) {
  const [events, setEvents] = useState<ContextEvent[]>([]);
  const [detectedIntent, setDetectedIntent] = useState<BrowsingIntent | null>(null);
  const [trackingService] = useState(() => new EventTrackingService(sessionId));
  
  useEffect(() => {
    // Load existing history from sessionStorage
    const stored = sessionStorage.getItem('porta_futuri_browsing_history');
    if (stored) {
      setEvents(JSON.parse(stored));
    }
    
    // Set up periodic intent detection
    const interval = setInterval(() => {
      detectIntent();
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(interval);
      trackingService.destroy();
    };
  }, []);
  
  const detectIntent = useCallback(async () => {
    const currentEvents = trackingService.getEvents();
    setEvents(currentEvents);
    
    if (currentEvents.length < 3) return; // Need minimum events
    
    // Analyze patterns
    const intent = analyzeIntentFromEvents(currentEvents);
    setDetectedIntent(intent);
  }, [trackingService]);
  
  const analyzeIntentFromEvents = (events: ContextEvent[]): BrowsingIntent | null => {
    const categories = events
      .map(e => e.category_viewed)
      .filter(Boolean);
    
    const products = events
      .filter(e => e.page_url?.includes('/'))
      .map(e => e.page_url);
    
    // Pattern detection logic
    if (categories.filter(c => c === 'smartphones').length >= 3) {
      return {
        intent: 'smartphone_shopping',
        confidence: 0.85,
        signals: ['Multiple smartphone views', 'Category focus'],
        suggestedMessage: "I noticed you're exploring our smartphone selection. Would you like help finding the perfect phone for your needs?"
      };
    }
    
    if (products.some(p => p?.includes('iphone')) && products.length >= 2) {
      return {
        intent: 'iphone_interest',
        confidence: 0.90,
        signals: ['iPhone product views', 'Apple ecosystem interest'],
        suggestedMessage: "Looking at iPhones? I can help you compare models and find the best deal!"
      };
    }
    
    // Add more pattern detection...
    return null;
  };
  
  const clearHistory = () => {
    trackingService.clearHistory();
    setEvents([]);
    setDetectedIntent(null);
  };
  
  return {
    events,
    detectedIntent,
    clearHistory,
    trackEvent: (url: string) => trackingService.trackPageView(url)
  };
}
```

### Phase 3: Widget Tab Interface

#### Task 3.1: Create Browsing History Tab Component
```typescript
// src/widget/components/BrowsingHistory.tsx
import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ContextEvent } from '@shared/types/context.types';
import { Clock, TrendingUp, X, AlertCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface BrowsingHistoryProps {
  events: ContextEvent[];
  detectedIntent: {
    intent: string;
    confidence: number;
    signals: string[];
    suggestedMessage?: string;
  } | null;
  onClearHistory: () => void;
  onClose: () => void;
}

export const BrowsingHistory: React.FC<BrowsingHistoryProps> = ({
  events,
  detectedIntent,
  onClearHistory,
  onClose
}) => {
  const { t } = useLanguage();
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const extractProductName = (url?: string) => {
    if (!url) return 'Unknown Page';
    const match = url.match(/\/[^\/]+\/([^\/]+)$/);
    if (match) {
      return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return url;
  };
  
  return (
    <div className="pf-browsing-history">
      <Tabs.Root defaultValue="history" className="w-full">
        <Tabs.List className="flex border-b border-gray-200">
          <Tabs.Trigger 
            value="history" 
            className="flex-1 px-4 py-2 text-sm font-medium hover:bg-gray-50 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Browsing History
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="intent" 
            className="flex-1 px-4 py-2 text-sm font-medium hover:bg-gray-50 data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            AI Intent Analysis
          </Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="history" className="p-4">
          <div className="mb-3 flex justify-between items-center">
            <h3 className="text-sm font-semibold">Your Recent Activity</h3>
            <button
              onClick={onClearHistory}
              className="text-xs text-gray-500 hover:text-red-500"
            >
              Clear History
            </button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No browsing history yet. Start exploring products!
              </p>
            ) : (
              events.map((event, index) => (
                <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                  <span className="text-xs text-gray-400 mt-1">
                    {formatTime(event.timestamp)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {extractProductName(event.page_url)}
                    </p>
                    {event.category_viewed && (
                      <span className="text-xs text-gray-500">
                        in {event.category_viewed}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Tabs.Content>
        
        <Tabs.Content value="intent" className="p-4">
          {detectedIntent ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  Detected Intent
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  {detectedIntent.intent.replace(/_/g, ' ').toUpperCase()}
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-600">Confidence:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${detectedIntent.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {(detectedIntent.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-1">Behavior Signals:</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {detectedIntent.signals.map((signal, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-500 mr-1">•</span>
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {detectedIntent.suggestedMessage && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs text-blue-600 mb-1">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      AI Suggested Message:
                    </p>
                    <p className="text-sm text-blue-900 italic">
                      "{detectedIntent.suggestedMessage}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Browse a few more products and I'll analyze your shopping intent
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Minimum 3 page views required
              </p>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
      
      <div className="border-t p-3 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          Back to Chat
        </button>
      </div>
    </div>
  );
};
```

### Phase 4: Update Widget App

#### Task 4.1: Integrate Browsing History Tab
```typescript
// Update src/widget/App.tsx (partial changes)

// Add imports
import { BrowsingHistory } from './components/BrowsingHistory';
import { useBrowsingHistory } from './hooks/useBrowsingHistory';

// In AppContent component, add:
const [showBrowsingHistory, setShowBrowsingHistory] = useState(false);
const { events, detectedIntent, clearHistory, trackEvent } = useBrowsingHistory(sessionId);

// Add new button in header actions (around line 313):
<button
  onClick={() => setShowBrowsingHistory(!showBrowsingHistory)}
  className="pf-btn-icon"
  title="View Browsing History"
>
  📊
</button>

// Update content rendering (around line 368):
{showBrowsingHistory ? (
  <BrowsingHistory
    events={events}
    detectedIntent={detectedIntent}
    onClearHistory={clearHistory}
    onClose={() => setShowBrowsingHistory(false)}
  />
) : showProfile ? (
  <CustomerProfile
    // existing props
  />
) : (
  <ChatInterface
    // existing props
  />
)}
```

### Phase 5: Refactor Demo Site Product URLs

#### Task 5.1: Update Product Card Links
```typescript
// Update src/demo-site/components/products/ProductCard.tsx (line 47)

// Add helper function
const generateSemanticUrl = (product: ProductWithId): string => {
  const category = product.category.toLowerCase().replace(/\s+/g, '-');
  const name = product.name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  return `/${category}/${name}`;
};

// Update Link component (line 47):
<Link to={generateSemanticUrl(product)} className="group">
```

#### Task 5.2: Update Product Page Routing
```typescript
// Update src/demo-site/App.tsx or router configuration

// Change route from:
<Route path="/product/:id" element={<ProductPage />} />

// To:
<Route path="/:category/:productName" element={<ProductPage />} />
```

#### Task 5.3: Update Product Page to Handle Semantic URLs
```typescript
// Update src/demo-site/pages/ProductPage.tsx

// Change useParams:
const { category, productName } = useParams<{ category: string; productName: string }>();

// Add product lookup by name:
const { data: product } = useQuery({
  queryKey: ['product', category, productName],
  queryFn: async () => {
    // First try to find by semantic URL
    const products = await productService.getAllProducts();
    const found = products.find(p => {
      const pCategory = p.category.toLowerCase().replace(/\s+/g, '-');
      const pName = p.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      return pCategory === category && pName === productName;
    });
    
    if (found) return found;
    
    // Fallback to ID if productName is actually an ID
    return productService.getProductById(productName);
  },
  enabled: !!category && !!productName
});
```

### Phase 6: Parent-Child Communication

#### Task 6.1: Update Demo Site to Send Navigation Events
```typescript
// Add to src/demo-site/App.tsx or layout component

useEffect(() => {
  // Send page view to widget iframe
  const iframe = document.querySelector('iframe#porta-futuri-widget');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'porta-futuri-page-view',
      url: window.location.pathname,
      title: document.title
    }, '*');
  }
}, [location.pathname]); // React Router location
```

## 5. Validation Gates

### Unit Tests
```bash
# Run existing tests
npm test

# Test browsing history hook
npm test -- useBrowsingHistory

# Test event tracking service  
npm test -- eventTracking
```

### Manual Testing Checklist
- [ ] Browse 3+ products in demo site
- [ ] Verify events appear in Browsing History tab
- [ ] Confirm intent detection after minimum events
- [ ] Test Clear History functionality
- [ ] Verify semantic URLs work correctly
- [ ] Check old product URLs still work (fallback)
- [ ] Test tab switching between Chat/Profile/History
- [ ] Verify sessionStorage persistence on refresh

### Integration Testing
```bash
# Start both applications
npm run dev:demo
npm run dev:admin

# Open browser to http://localhost:3002
# Test the following scenarios:
# 1. Browse smartphones → Should detect "smartphone_shopping" intent
# 2. View multiple iPhones → Should detect "iphone_interest"  
# 3. Clear history → Should reset both events and intent
# 4. Refresh page → Should maintain history in session
```

### Performance Checks
```bash
# Verify widget bundle size
npm run build:widget
# Should remain under 50KB compressed

# Check memory usage with 50+ events
# Should not exceed 512KB for event storage
```

## 6. Error Handling

### Potential Issues and Solutions

1. **PostMessage Security**
   - Add origin validation in handleParentMessage
   - Only accept messages from trusted domains

2. **SessionStorage Limits**
   - Implement event pruning at 50 events max
   - Compress data if needed

3. **URL Migration**
   - Keep fallback to ID-based URLs
   - Support both formats during transition

4. **Intent False Positives**
   - Require minimum confidence threshold (0.75)
   - Allow users to dismiss/correct intent

## 7. Documentation

### For Developers
```javascript
// Widget initialization with browsing tracking
PortaFuturi.init({
  apiKey: 'your-api-key',
  features: {
    browsingHistory: true,  // Enable browsing tracking
    intentDetection: true   // Enable AI intent analysis
  }
});
```

### For End Users
- New "📊" button shows your browsing history
- AI analyzes your behavior to understand shopping intent
- Privacy: Data stored only in your browser session
- Clear history anytime with one click

## 8. Success Criteria

- [ ] Browsing events tracked accurately
- [ ] Intent detection works with 75%+ accuracy
- [ ] Semantic URLs improve SEO and readability
- [ ] Tab interface is intuitive and responsive
- [ ] No performance degradation
- [ ] Session data persists correctly
- [ ] Clear documentation provided

## 9. Dependencies and References

### NPM Packages
- `@radix-ui/react-tabs@1.1.13` (already installed)
- `lucide-react` (already installed)

### Key Files to Modify
1. `src/widget/App.tsx` - Add browsing history tab
2. `src/demo-site/components/products/ProductCard.tsx` - Update product links
3. `src/demo-site/pages/ProductPage.tsx` - Handle semantic URLs
4. `src/demo-site/App.tsx` - Update routing

### New Files to Create
1. `src/widget/services/eventTracking.ts`
2. `src/widget/hooks/useBrowsingHistory.ts`
3. `src/widget/components/BrowsingHistory.tsx`

### External Documentation
- [Radix UI Tabs](https://www.radix-ui.com/docs/primitives/components/tabs)
- [PostMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [SessionStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)

## Implementation Order

1. **Phase 1**: Event Tracking Service (30 min)
2. **Phase 2**: Intent Detection Hook (45 min)
3. **Phase 3**: Browsing History Tab UI (45 min)
4. **Phase 4**: Widget Integration (30 min)
5. **Phase 5**: Demo Site URL Refactor (45 min)
6. **Phase 6**: Parent-Child Communication (15 min)
7. **Testing & Validation**: (30 min)