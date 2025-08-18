# Porta Futuri AI Add-On Development Guidelines

## Project Overview
Porta Futuri AI Add-On is a lightweight, embeddable recommendation widget that provides intelligent product suggestions using AI-powered analysis of customer data. 

## Core Development Principles

### 1. KISS (Keep It Simple, Stupid)
- Start with the simplest solution that works
- Avoid over-engineering
- Refactor only when necessary

### 2. YAGNI (You Aren't Gonna Need It)
- Implement features only when required
- Avoid speculative generality
- Focus on current requirements

### 3. Privacy First
- No persistent storage of customer data
- Process data in real-time only
- Clear data handling policies

### 4. Performance Oriented
- Target <3 second response time (P95)
- Widget load time <500ms
- Optimize LLM token usage

### 5. STRICT DO NOT NOES
- DO NOT CREATE HACKS BY IMPLEMENTING MANY INTERIM SOLUTIONS, AIM TO FIX THE ROOT CAUSE ALWAYS
- DO NOT CREATE MULTIPLE FILES WITH THE SAME NAME FOR ECAMPEL App.tsx, then App.working.tsx, then App.fixed.tsx etc. ALWAYS FIX THE CORE ISSUES AND KEEP THE CODE CLEAN

### 6. In case you need some temporary scripts
- IF YOU NEED A TEMPORARY SCRIPT TO DO SOMETHING, THEN SAVE ALL TEMPORARY SCRIPTS IN THE /temp folder in the rood directory.

## MVP-Specific Constraints

### Scalability Limits
- **Concurrent Users**: 10 maximum
- **Requests per Hour**: 100 total
- **Database Connections**: Supabase connection pool <60% at peak
- **Cache Strategy**: Simple in-memory LRU cache (15-minute TTL)

### Rate Limiting Implementation
- **Limit**: 100 requests per minute per domain
- **Implementation**: Use Redis or in-memory store with atomic operations
- **Fallback**: Queue overflow requests during peak load
- **Recovery**: Auto-recovery with exponential backoff

### MVP Performance Targets
| Operation | Target (P95) | Target (P99) | Max |
|-----------|-------------|--------------|-----|
| Widget Load | 500ms | 750ms | 1s |
| First Recommendation | 3s | 4s | 5s |
| Follow-up Query | 2s | 3s | 4s |
| CSV Parse (10MB) | 1s | 2s | 3s |
| CDP Fetch | 1s | 1.5s | 2s |

### Resource Constraints
- **Memory Usage**: <512MB per Edge Function
- **Execution Time**: <10s per request
- **Bundle Size**: <50KB compressed widget
- **CSV Processing**: Stream processing for files >10MB

## Technology Stack

### Frontend (Widget)
- **Framework**: React 18.3 with TypeScript
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Build Tool**: Vite (target <50KB compressed)
- **Icons**: Lucide React

### Backend
- **Platform**: Supabase
  - PostgreSQL for data storage
  - Edge Functions for serverless endpoints
  - Real-time subscriptions
  - Row Level Security (RLS) for rate limiting
- **LLM Integration**: 
  - Primary: Claude (Anthropic SDK)
- **CSV Processing**: PapaParse with streaming
- **Session Management**:
  - Primary: sessionStorage (browser tab scope)
  - Secondary: localStorage (30-day expiry)
  - Fallback: cookies (30-minute rolling expiry)

### Widget Communication
- **Primary**: PostMessage API for iframe isolation
- **Origin Validation**: Strict origin checking
- **Message Protocol**: Versioned message format
- **Multi-tab Sync**: Shared Worker or Broadcast Channel API

### External Integrations
- **Exacaster CVM Platform**: Customer 360 REST API
- **CDP Data Transformer**: Dynamic field mapping
- **Webhook Support**: HMAC signatures for security

## Code Structure Guidelines

### File Organization
```
porta-futuri/
├── src/
│   ├── widget/           # React widget code
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   ├── api/              # Backend API code
│   │   ├── functions/    # Supabase Edge Functions
│   │   ├── lib/          # Shared backend libraries
│   │   └── types/        # TypeScript type definitions
│   └── shared/           # Shared code between frontend/backend
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
└── PRPs/                 # Product Requirement Prompts
```

### Coding Standards

#### TypeScript/JavaScript
- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Use ESLint and Prettier for formatting
- Maximum file size: 300 lines
- Maximum function size: 50 lines
- Use descriptive variable names

#### React Components
- Functional components with hooks only
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Keep components focused and single-purpose
- Use React.memo for expensive components

#### Testing
- Minimum 80% code coverage
- Test in /tests folder  (*.test.ts)
- Use Vitest for unit tests
- Use Playwright for E2E tests
- Mock external dependencies

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Development
```bash
# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Format code
npm run format
```

### Testing
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Check coverage
npm run test:coverage
```

### Build
```bash
# Build widget for production
npm run build:widget

# Build API functions
npm run build:api

# Build everything
npm run build
```

## PRP (Product Requirement Prompt) Framework

### Overview
This project uses the PRP framework for AI-assisted development. PRPs are comprehensive documents that provide AI coding assistants with all context needed to implement features correctly in a single pass.

### Available Claude Commands
Use these commands with `/` prefix in Claude Code:
- `/create-base-prp` - Create a general feature PRP
- `/execute-base-prp` - Execute an existing PRP
- `/create-widget-prp` - Create widget-specific PRP
- `/create-api-prp` - Create API endpoint PRP
- `/list-prps` - List all PRPs and their status
- `/planning-create` - Create implementation plan
- `/spec-create-adv` - Create advanced specification
- `/spec-execute` - Execute specification
- `/review-general` - Review code changes
- `/refactor-simple` - Simple refactoring
- `/prime-core` - Prime AI with core context
- `/onboarding` - Onboarding new developers
- `/debug` - Debug issues

### When to Create a PRP
- New features or significant enhancements
- Complex refactoring tasks
- Integration with external services
- Performance optimizations
- Any task requiring multiple coordinated changes

### PRP Structure
Each PRP must include:
1. **Goal**: Clear, measurable objective
2. **Why**: Business value and user impact
3. **Context**: Requirements reference, existing code patterns
4. **Implementation Blueprint**: Detailed, ordered steps
5. **Validation**: Executable tests and success criteria

### PRP Workflow
1. **Create PRP**: Use appropriate `/create-*-prp` command
2. **Review PRP**: Ensure completeness and accuracy
3. **Execute PRP**: Use `/execute-base-prp` command
4. **Validate**: Run validation gates specified in PRP
5. **Complete**: Move to `PRPs/completed/` when done

### PRP Naming Convention
- Format: `YYYY-MM-DD-feature-name.md`
- Example: `2025-08-08-csv-parser.md`
- Templates: Keep in `PRPs/templates/`
- Active: Keep in `PRPs/`
- Completed: Move to `PRPs/completed/`

### PRP Execution
```bash
# Interactive execution
python PRPs/scripts/prp_runner.py PRPs/feature-name.md

# Direct with Claude Code
claude "Implement PRPs/feature-name.md following all validation steps"

# Phased approach
claude "Implement Phase 1 of PRPs/feature-name.md"
```

### Quality Checklist for PRPs
- [ ] Goal is specific and measurable
- [ ] All file paths are absolute
- [ ] Library versions specified
- [ ] Test commands are executable
- [ ] Performance targets defined
- [ ] Error handling documented
- [ ] Security requirements listed
- [ ] Validation gates included

## API Design Principles

### RESTful Endpoints
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate status codes
- Include error details in responses
- Version APIs (/api/v1/)

### Rate Limiting
- 100 requests per minute per API key
- Implement exponential backoff
- Return clear rate limit headers

### Security
- Validate all inputs
- Use parameterized queries
- Implement CORS properly
- Never log sensitive data

## CSV Processing Guidelines

### File Limits
- Maximum file size: 50MB
- Products: 10,000 items maximum (enforce count OR size limit)
- Customer: single record
- Context: last 500 events or 30 days

### Error Handling
- Validate CSV structure before processing
- Handle missing fields gracefully
- Provide clear error messages
- Support UTF-8 encoding
- Auto-detect encoding (UTF-8, ISO-8859-1)
- Log errors with row numbers for debugging

## Data Schema Specifications

### Product Catalog CSV Schema
```csv
id,name,price,category,description,brand,stock_quantity,image_url,attributes,rating,review_count
```
**Required**: id, name, price, category, description
**Optional**: All others
**Validation**: Type checking, range validation, enum constraints

### Customer Profile Schema (CDP Response)
```typescript
interface CDPResponse {
  userId?: string;
  [key: string]: any; // Dynamic fields
}

// Field mapping for display examples
const FIELD_MAPPING = {
  'current_phone': 'Current Phone',
  'has_netflix': 'Has Netflix',
  'mobile_subscriptions_count_daily': 'Mobile Subscriptions Count Daily'
};
```

### Event Tracking Schema
```typescript
interface EventData {
  timestamp: string; // ISO 8601
  event_type: 'page_view' | 'search' | 'cart_action' | 'purchase' | 'interaction';
  session_id: string;
  product_id?: string;
  category_viewed?: string;
  search_query?: string;
  cart_action?: 'add' | 'remove' | 'update';
  url: string; // Full page URL
  page_duration?: number; // Seconds
}
```

### Intent Detection Schema
```typescript
interface Intent {
  detected: string; // e.g., "camera_quality_focus"
  confidence: number; // 0-1
  behavior_signals: string[];
  suggested_message?: string;
}
```

## LLM Integration Best Practices

### Prompt Engineering
- Keep prompts concise and specific
- Include relevant context only
- Use system prompts for consistency
- Implement prompt templates

### Cost Optimization
- Cache responses for 15 minutes
- Implement request batching
- Use smaller models for simple tasks
- Monitor token usage

### Fallback Strategy
- Primary: Claude (Anthropic)
- Fallback: Static recommendations based on category
- Graceful degradation with user notification
- Pre-computed popular products list
- Generic helpful messages when LLM unavailable

## Performance Requirements

### Response Times
- Initial recommendation: <3 seconds (P95), <4 seconds (P99)
- Follow-up queries: <2 seconds (P95), <3 seconds (P99)
- Widget load: <500ms (P95), <750ms (P99)
- CSV parsing: <1 second per 10MB file
- CDP API calls: <1 second (P95), <1.5 seconds (P99)

### Optimization Strategies
- Implement lazy loading
- Use React.memo and useMemo
- Optimize bundle size with tree shaking
- Enable gzip compression
- Use CDN for static assets
- Stream large CSV files in 1MB chunks
- Batch event tracking (50 events max, 5-second intervals)

### Memory Leak Prevention
- 24-hour continuous operation test required
- 10,000 session cycles without memory growth
- Proper cleanup of event listeners
- Clear timers and intervals on unmount

## Security Guidelines

### Data Protection
- TLS 1.3 for all communications
- No persistent storage of PII
- Session timeout after 30 minutes of inactivity
- Sanitize all user inputs
- AES-256 for any cached data
- IP masking for analytics

### Authentication
- API key validation
- Rate limiting per domain (100 req/min)
- CORS configuration for approved domains only
- Input validation with parameterized queries
- Bearer token for CDP integration

### Security Headers
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline';
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

### Error Codes
| Code | HTTP Status | Description | Recovery Action |
|------|-------------|-------------|----------------|
| RATE_LIMIT_EXCEEDED | 429 | API rate limit exceeded | Retry with exponential backoff |
| INVALID_API_KEY | 401 | Invalid or expired API key | Check API key configuration |
| CDP_UNAVAILABLE | 503 | CDP service temporarily unavailable | Use fallback CSV data |
| INVALID_CSV_FORMAT | 400 | CSV file format invalid | Check file format and retry |
| FILE_TOO_LARGE | 413 | File exceeds 50MB limit | Split file and retry |
| SESSION_EXPIRED | 440 | Session has expired | Reinitialize widget |
| LLM_TIMEOUT | 504 | LLM response timeout | Use static recommendations |
| INVALID_CUSTOMER_ID | 404 | Customer ID not found | Verify customer ID |
| QUOTA_EXCEEDED | 402 | Monthly quota exceeded | Upgrade plan or wait |
| INTERNAL_ERROR | 500 | Internal server error | Retry or contact support |

## Critical Implementation Patterns

### Session Management Pattern
```typescript
// Customer ID acquisition priority order
const getCustomerId = (): string | null => {
  // 1. JavaScript variable (highest priority)
  if (window.PortaFuturi?.customerId) return window.PortaFuturi.customerId;
  
  // 2. URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('customer_id')) return urlParams.get('customer_id');
  
  // 3. Cookie
  const cookieValue = getCookie('porta_futuri_customer_id');
  if (cookieValue) return cookieValue;
  
  // 4. Manual entry (return null to trigger UI)
  return null;
};
```

### CDP Fallback Pattern
```typescript
const getCustomerProfile = async (customerId: string) => {
  try {
    // Try CDP first
    const cdpData = await fetchFromCDP(customerId);
    if (cdpData) return transformCDPData(cdpData);
  } catch (error) {
    console.warn('CDP unavailable, falling back to CSV');
  }
  
  // Fallback to CSV data
  return getCSVCustomerData(customerId);
};
```

### Rate Limiting Pattern
```typescript
// Use atomic operations with Redis or in-memory store
const checkRateLimit = async (domain: string): Promise<boolean> => {
  const key = `rate_limit:${domain}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  
  return current <= 100; // 100 requests per minute
};
```

### Error Handling Pattern
```typescript
const handleAPIError = (error: APIError) => {
  switch (error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      return retryWithBackoff(error.retryAfter);
    case 'CDP_UNAVAILABLE':
      return useFallbackData();
    case 'LLM_TIMEOUT':
      return getStaticRecommendations();
    default:
      return showUserError(error.message);
  }
};
```

## Integration Guidelines

### Exacaster CVM Integration
```typescript
// Configuration
const CDP_CONFIG = {
  baseUrl: 'https://customer360.exacaster.com/courier/api/v1',
  workspace_id: process.env.EXACASTER_WORKSPACE_ID,
  resource_id: process.env.EXACASTER_RESOURCE_ID,
  bearer_token: process.env.EXACASTER_BEARER_TOKEN
};

// API Call
const fetchCustomer360 = async (customerId: string) => {
  const url = `${CDP_CONFIG.baseUrl}/workspaces/${CDP_CONFIG.workspace_id}/resources/${CDP_CONFIG.resource_id}`;
  const response = await fetch(`${url}?userId=${customerId}&page=0&size=1`, {
    headers: {
      'Authorization': `Bearer ${CDP_CONFIG.bearer_token}`
    }
  });
  
  if (!response.ok) throw new Error('CDP_UNAVAILABLE');
  return response.json();
};
```

### Widget Communication Protocol
```typescript
// PostMessage protocol with version and origin validation
interface WidgetMessage {
  version: '1.0';
  type: 'recommendation_request' | 'event_track' | 'session_update';
  payload: any;
  timestamp: string;
}

// Origin validation
window.addEventListener('message', (event) => {
  const ALLOWED_ORIGINS = ['https://client-domain.com'];
  if (!ALLOWED_ORIGINS.includes(event.origin)) return;
  
  const message: WidgetMessage = JSON.parse(event.data);
  // Process message...
});
```

### Event Batching Implementation
```typescript
class EventBatcher {
  private queue: EventData[] = [];
  private timer: NodeJS.Timeout | null = null;
  
  add(event: EventData) {
    this.queue.push(event);
    
    // Immediate send triggers
    if (event.event_type === 'purchase' || 
        event.event_type === 'cart_action' ||
        this.queue.length >= 50) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 5000);
    }
  }
  
  private flush() {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    // Send with compression if > 10 events
    if (events.length > 10) {
      sendCompressed(events);
    } else {
      sendEvents(events);
    }
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
```

## Widget Development Guidelines

### Customer Profile View Requirements
- Display all customer context used for recommendations
- Show AI agent's intent and reasoning
- Real-time updates when context changes
- Allow users to view and manage browsing history
- Enable removal of irrelevant context items
- Available as additional tab next to chat interface

### Intent Detection UI Behavior
```typescript
interface IntentDetectionUI {
  // Proactive engagement after detecting intent
  showProactiveMessage(intent: Intent): void;
  
  // Display confidence indicator
  showConfidenceLevel(confidence: number): void;
  
  // Allow user to correct/reject intent
  allowIntentFeedback(): void;
}
```

### Browsing History Management
```typescript
class BrowsingHistory {
  private history: EventData[] = [];
  private maxItems = 20; // Last 20 events
  
  add(event: EventData) {
    this.history.unshift(event);
    if (this.history.length > this.maxItems) {
      this.history.pop();
    }
    this.persist();
  }
  
  remove(eventId: string) {
    this.history = this.history.filter(e => e.id !== eventId);
    this.persist();
  }
  
  private persist() {
    sessionStorage.setItem('browsing_history', JSON.stringify(this.history));
  }
}
```

### State Persistence Strategy
```typescript
// Session restoration logic
const restoreSession = (): WidgetState | null => {
  const saved = sessionStorage.getItem('porta_futuri_session');
  if (!saved) return null;
  
  const state = JSON.parse(saved);
  const age = Date.now() - state.timestamp;
  
  // Session expired (>30 minutes)
  if (age > 30 * 60 * 1000) {
    sessionStorage.removeItem('porta_futuri_session');
    return null;
  }
  
  // Valid session - restore state
  return {
    sessionId: state.sessionId,
    customerId: state.customerId,
    conversationHistory: state.conversationHistory.slice(-5), // Last 5 messages
    timestamp: Date.now()
  };
};
```

### Session Timeout Handling
```typescript
class SessionManager {
  private timeout: NodeJS.Timeout | null = null;
  private WARNING_TIME = 25 * 60 * 1000; // 25 minutes
  private EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes
  
  resetTimer() {
    if (this.timeout) clearTimeout(this.timeout);
    
    // Warning at 25 minutes
    this.timeout = setTimeout(() => {
      this.showWarning('Session will expire in 5 minutes');
      
      // Expiry at 30 minutes
      setTimeout(() => this.expireSession(), 5 * 60 * 1000);
    }, this.WARNING_TIME);
  }
  
  private expireSession() {
    // Clear session but keep customer_id
    const customerId = this.state.customerId;
    sessionStorage.clear();
    if (customerId) {
      sessionStorage.setItem('customer_id', customerId);
    }
    this.showExpiredMessage();
  }
}
```

## Documentation Requirements

### Code Documentation
- JSDoc comments for public APIs
- README for each module
- Inline comments for complex logic
- Keep documentation updated

### User Documentation
- Integration guide
- API reference
- Troubleshooting guide
- Example implementations

## Testing Checklist

### Unit Test Scenarios
- **CSV Parser Tests**:
  - [ ] Valid CSV with all fields
  - [ ] Missing optional fields
  - [ ] Invalid data types
  - [ ] Encoding issues (UTF-8, ISO-8859-1)
  - [ ] Files at size limits (50MB)
  - [ ] Empty files
  - [ ] Malformed headers

- **LLM Integration Tests**:
  - [ ] Successful response
  - [ ] Timeout handling (5s limit)
  - [ ] Rate limit handling
  - [ ] Fallback to static responses
  - [ ] Context truncation at 100k tokens
  - [ ] Token limit enforcement

- **CDP Integration Tests**:
  - [ ] Successful data fetch
  - [ ] API unavailable (503 response)
  - [ ] Invalid credentials (401 response)
  - [ ] Malformed response handling
  - [ ] Timeout scenarios (2s limit)
  - [ ] Schema validation

- **Session Management Tests**:
  - [ ] Session creation
  - [ ] Session expiry after 30 minutes
  - [ ] Session restoration on page refresh
  - [ ] Cross-tab synchronization
  - [ ] Storage fallbacks (session → local → cookie)

### Integration Test Matrix
| Component A | Component B | Test Scenario | Expected Result |
|-------------|-------------|---------------|----------------|
| Widget | Backend API | Product search | Recommendations in <3s |
| Widget | CDP | Customer profile fetch | Profile data displayed |
| Backend | LLM | Intent detection | Correct intent with >75% confidence |
| Backend | Database | Session persistence | Data survives restart |
| Widget | Host Site | Event tracking | All events captured |

### Load Testing Targets (MVP)
- **5 concurrent users**: <2s response (P95), <0.1% errors
- **10 concurrent users**: <3s response (P95), <1% errors
- **20 concurrent users**: Graceful degradation with queue

### UAT Acceptance Criteria
- [ ] Widget loads on 3+ test sites
- [ ] Recommendations relevant (>80% satisfaction)
- [ ] Intent detection accuracy >75%
- [ ] Cross-sell suggestions appropriate
- [ ] CDP data correctly displayed
- [ ] Session management works correctly
- [ ] Response times meet SLA
- [ ] Mobile experience satisfactory
- [ ] Accessibility standards met (WCAG 2.1 AA)

## Deployment Checklist

Before deploying:
- [ ] All tests passing (80% coverage minimum)
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Rate limiting tested with atomic operations
- [ ] Error handling verified (all error codes)
- [ ] Monitoring configured
- [ ] CDP integration tested
- [ ] Session restoration tested
- [ ] Memory leak testing passed (24-hour run)
- [ ] Widget size <50KB compressed
- [ ] CORS configuration verified

## Behavioral Guidelines for AI Assistants

When working with this codebase:
1. Always check existing code patterns before implementing new features
2. Verify library availability before importing
3. Follow the established file structure
4. Write tests for new functionality
5. Update documentation when changing APIs
6. Consider performance implications
7. Validate CSV data thoroughly
8. Implement proper error handling
9. Use TypeScript's type system effectively
10. Keep security as a top priority

## Quick Reference

### Key Files
- `/PRPs/completed/porta-futuri-ai-addon-requirements.md` - Full product requirements
- `/src/widget/index.tsx` - Widget entry point
- `/src/api/functions/` - API endpoints
- `/PRPs/` - Active development tasks

### Environment Variables
```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# LLM Configuration
ANTHROPIC_API_KEY=your_claude_key

# CDP Integration
EXACASTER_WORKSPACE_ID=your_workspace_id
EXACASTER_RESOURCE_ID=your_resource_id
EXACASTER_BEARER_TOKEN=your_bearer_token

# Widget Configuration
ALLOWED_ORIGINS=https://client1.com,https://client2.com
SESSION_TIMEOUT_MINUTES=30
CACHE_TTL_MINUTES=15
RATE_LIMIT_PER_MINUTE=100
```

### Important Limits
- CSV: 50MB max file size
- Products: 10,000 max count (enforce count OR size, not both)
- API: 100 req/min per domain
- Cache: 15 minutes TTL
- Session: 30 minutes inactivity timeout
- Events: 50 max per batch, 5-second intervals
- LLM Context: 100,000 tokens max
- Memory: 512MB per Edge Function
- Widget: 50KB compressed
- CDP Response: 2-second timeout

## Common Pitfalls

### CSV Processing
- **Issue**: Confusion between file size (50MB) and product count (10,000) limits
- **Solution**: Enforce size not both. Validate early.

### Session Restoration
- **Issue**: Edge cases when sessionStorage exists but is >30 minutes old
- **Solution**: Always check timestamp and clear expired sessions before restoration

### CDP Data Validation
- **Issue**: CDP responses may have unexpected structure causing crashes
- **Solution**: Always validate schema and use try-catch with fallback to CSV

### Rate Limiting
- **Issue**: SQL-based rate limiting has race conditions
- **Solution**: Use Redis or atomic in-memory operations, never database

### Customer ID Priority
- **Issue**: Multiple sources for customer ID cause conflicts
- **Solution**: Follow strict priority: JS variable → URL → Cookie → Manual

### LLM Token Limits
- **Issue**: Context exceeding 100k tokens causes failures
- **Solution**: Implement context truncation with priority ordering

### Memory Leaks
- **Issue**: Event listeners and timers not cleaned up
- **Solution**: Always clear timers/listeners in cleanup functions

## Data Flow Diagrams

### Customer ID Acquisition Flow
```
┌─────────────┐
│   Widget    │
│   Loads     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐     Yes     ┌──────────────┐
│ Check window.   ├────────────▶│ Use JS       │
│ PortaFuturi?    │             │ Variable     │
└────────┬────────┘             └──────────────┘
         │ No
         ▼
┌─────────────────┐     Yes     ┌──────────────┐
│ Check URL       ├────────────▶│ Use URL      │
│ Parameter?      │             │ Parameter    │
└────────┬────────┘             └──────────────┘
         │ No
         ▼
┌─────────────────┐     Yes     ┌──────────────┐
│ Check Cookie?   ├────────────▶│ Use Cookie   │
└────────┬────────┘             └──────────────┘
         │ No
         ▼
┌─────────────────┐
│ Show Manual     │
│ Entry UI        │
└─────────────────┘
```

### CDP Fallback Decision Tree
```
┌──────────────┐
│ Request      │
│ Customer     │
│ Profile      │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Call CDP API     │
│ (2s timeout)     │
└────────┬─────────┘
         │
    ┌────┴────┐
    │Success? │
    └────┬────┘
         │
    Yes ─┴─ No
     │       │
     ▼       ▼
┌─────────┐ ┌─────────────────────────────────────┐
│Transform│ │Log Warning                          │
│CDP Data │ │Make Customer profile not available  │
└─────────┘ └─────────────────────────────────────┘
```

### Session Restoration Flow
```
┌──────────────┐
│ Page Load/   │
│ Refresh      │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Check            │
│ sessionStorage   │
└────────┬─────────┘
         │
    ┌────┴────┐
    │ Exists? │
    └────┬────┘
         │
    Yes ─┴─ No
     │       │
     ▼       ▼
┌──────────┐ ┌──────────────┐
│Check Age │ │Generate New  │
│ < 30min? │ │Session ID    │
└────┬─────┘ └──────────────┘
     │
 Yes ─┴─ No
  │       │
  ▼       ▼
┌───────┐ ┌──────────────┐
│Restore│ │Clear & New   │
│State  │ │Session       │
└───────┘ └──────────────┘
```

### Intent Detection Pipeline
```
┌──────────────┐
│ Collect      │
│ User Events  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Batch Events     │
│ (Last 20)        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Analyze Patterns │
│ - Page views     │
│ - Time on page   │
│ - Interactions   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Send to LLM      │
│ for Intent       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Confidence > 75%?│
└────────┬─────────┘
         │
    Yes ─┴─ No
     │       │
     ▼       ▼
┌──────────┐ ┌──────────────┐
│Show      │ │Continue      │
│Proactive │ │Monitoring    │
│Message   │ └──────────────┘
└──────────┘
```

## Development Commands (Extended)

### CDP Testing
```bash
# Test CDP integration
npm run test:cdp

# Mock CDP responses
npm run mock:cdp

# Validate CDP schema
npm run validate:cdp-schema
```

### Widget Testing
```bash
# Test widget embedding
npm run test:widget:embed

# Test cross-domain communication
npm run test:widget:postmessage

# Test session persistence
npm run test:widget:session
```

### Performance Testing
```bash
# Run load tests (5/10/20 users)
npm run test:load

# Memory leak detection
npm run test:memory

# Bundle size analysis
npm run analyze:bundle
```

### Integration Testing
```bash
# Test with mock e-commerce site
npm run test:integration:demo

# Test CDP fallback scenarios
npm run test:integration:cdp-fallback

# Test rate limiting
npm run test:integration:rate-limit
```

## Quick Launch Instructions

### Launching Admin Panel and Demo Site
**IMPORTANT: The project dependencies are already installed and environment is configured. Do NOT reinstall packages unless explicitly needed.**

To launch the applications:
```bash
# Launch Admin Panel (port 5174)
npm run dev:admin

# Launch Demo E-commerce Site (port 3002)  
npm run dev:demo

# Or run both in background
npm run dev:admin &
npm run dev:demo &
```

### Key Points to Remember:
1. **Dependencies are pre-installed** - Never reinstall unless there's a specific error
2. **Environment is configured** - Cloud Supabase credentials are in .env files
3. **Simple npm scripts work** - Just use `npm run dev:admin` and `npm run dev:demo`
4. **Ports are fixed** - Admin: 5174, Demo: 3002
5. **Vite configs are separate** - vite.config.admin.ts and vite.config.demo.ts

### Common Mistakes to Avoid:
- DO NOT try to reinstall packages first
- DO NOT check/fix npm cache issues unless there's a real error
- DO NOT overcomplicate - just run the npm scripts directly
- Trust that the environment is properly configured

---

*Last Updated: January 2025*
*Version: 2.1*