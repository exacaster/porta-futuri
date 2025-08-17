# Porta Futuri AI Add-On Requirements

### Document Version
- **Version**: 1.2
- **Date**: 12 August 2025
- **Status**: Draft
- **Updated**: Incorporated AI Agent Improvement Plan specifications

## 1. Executive Summary

Porta Futuri AI Add-On is a lightweight, embeddable recommendation widget that provides intelligent product suggestions using AI-powered analysis of customer data. 

### Key Principles
- **Simple Integration**: Single JavaScript snippet embedding
- **Data Agnostic**: Works with CSV exports from any platform
- **Privacy First**: No data storage, real-time processing only
- **Cost Effective**: Optimized LLM usage with intelligent caching
- **Transparent AI**: Users can view AI intent and their profile data at all times

## 2. Functional Requirements

### 2.1 Core Use Cases

#### UC-001: Product Search and AI-Assisted Recommendations
- **Description**: Users can search for products using natural language queries
- **Flow**:
  1. User enters search query in Porta Futuri Agent
  2. Agent asks clarifying follow-up questions
  3. Agent recommends 3-5 products from the catalog
  4. Recommendations are generated using:
     - Customer's search query
     - Customer profile information
     - Full product catalogue
     - Intent prompt defining agent's role
- **Transparency**: User can view their profile information and AI agent's intent at all times

#### UC-002: Intent Detection from Browsing Behavior
- **Description**: Agent proactively engages based on user behavior patterns
- **Flow**:
  1. Widget collects user interaction data (clicks, searches, navigation)
  2. Agent infers user intent from behavior patterns
  3. Agent proactively initiates relevant conversation
  4. Example: "Are you looking for a new iPhone? I can help you choose the one that best fits your needs."
- **Features**:
  - User can view browsing history within widget
  - User can remove irrelevant items from recommendation context

#### UC-003: Cross-Sell Recommendations
- **Description**: Automatic suggestion of complementary products
- **Flow**:
  1. User selects a product
  2. Agent identifies related products
  3. Agent recommends accessories, add-ons, or services
  4. Example: iPhone → iPhone case, AirPods, insurance

### 2.2 Core Functionality


#### FR-001 Product Catalog Data Ingestion
- **Description**: System must read and process CSV data sources
- **Acceptance Criteria**:
  - Parse product catalog CSV (up to 10,000 products). 
  - The product catalogue is uploaded over the "Porta Futuri Admin" component
  - Validate data format and handle missing fields gracefully
  - Support UTF-8 encoding for international characters

#### FR-002: Customer Profile Data Integration
- **Description**: System must be able to query the latest customer profile from Exacaster CVM Platform (the CDP) over REST API data sources
- **Acceptance Criteria**:
  - The widget has to have the capability to enter customer_id, expecting that this ID is passed by the website, but if it is not available, I should be able to enter it manually.
  - "Porta Futuri Admin" component should have Integrations tab, where Exacaster CVM Platform should could be enabled/dissabled and the configuratin of URL, bearer token, workspace_id, resource_id should be managed.

#### FR-003: Real-time Customer Context Customer Profile Data Integration
- **Description**: The system must be able to collect customer actions on the website, that will be sent by the widget
- **Acceptance Criteria**:
  - The widget will collect all customer actions on the website such as: 'page_view' | 'search' | 'cart_action' | 'purchase'
  - Each action must contain the full URL so that an AI agent could use it for recommendation purposes


#### FR-004: Embeddable Widget
- **Description**: JavaScript widget for easy integration
- **Acceptance Criteria**:
  - Single line JavaScript embed code
  - Responsive design (mobile, tablet, desktop)
  - Customizable appearance (colors, fonts, position)
  - Accessibility compliant (WCAG 2.1 AA)
  - Maximum 50KB compressed JavaScript bundle


#### FR-005: Conversation Interface
- **Description**: Natural language interaction with customers
- **Acceptance Criteria**:
  - Accept free-form text queries
  - Maintain conversation context for session
  - Support clarifying questions
  - Handle product comparisons
  - Proactive conversation initiation based on intent


#### FR-006: AI Recommendation Engine For Customer Queries
- **Description**: Generate personalized product recommendations when customer asks for them
- **Acceptance Criteria**:
  - If customer search for specific product, return the specific product
  - If customer ask you to help them choose, then return 3-5 relevant product recommendations based on customer context
  - Provide explanation for each recommendation
  - Direct recommendations and cross-sell scenarios
  - Handle "cold start" (no context) gracefully
  - Include detected intent in LLM prompt


#### FR-007: AI Recommendation Engine For Proactive Customer Intent Detection
- **Description**: Generate personalized product recommendations when customer is just browsing
- **Acceptance Criteria**:
  - If customer is browsing the website, based on the actions that they make try to identify a specific intent that customer is makeing
  - Then initiat the conversation with the customer by stating the intent that you see and offering your best recommendation
  - Return 3-5 relevant product recommendations based on customer context
  - Provide explanation for each recommendation
  - Direct recommendations and cross-sell scenarios
  - Handle "cold start" (no context) gracefully
  - Include detected intent in LLM prompt

#### FR-008: Customer Profile Interface
- **Description**: Visual interface showing customer context and AI transparency
- **Acceptance Criteria**:
  - Display all customer context used for recommendations
  - Show AI agent's intent and reasoning
  - Real-time updates when context changes
  - Allow users to view and manage browsing history
  - Enable removal of irrelevant context items
  - This should be available as an additional tab in the widget next to the chat interface

#### FR-009: Porta Futuri Admin Interface
- **Description**: Admin panel for configuration and management
- **Acceptance Criteria**:
  - Upload and manage product CSV files
  - Configure CDP integrations (e.g., Exacaster CVM Platform)
  - Manage API keys and access controls

### 2.3 Session & State Management

#### Customer ID Acquisition
- **Primary Method**: JavaScript variable injection
  ```javascript
  window.PortaFuturi = {
    customerId: 'CUST123' // Injected by host site
  };
  ```
- **Fallback Methods**:
  1. URL parameter: `?customer_id=CUST123`
  2. Cookie: `porta_futuri_customer_id`
  3. Manual entry in widget UI

#### State Persistence Strategy
- **Session Storage**: Primary storage for session data
  - Session ID, conversation history, temporary context
  - Expires when browser tab closes
- **Local Storage**: Secondary storage for preferences
  - Widget position, theme preferences, language
  - 30-day expiry with rolling window
- **Cookies**: Fallback for cross-domain scenarios
  - SameSite=None; Secure; HttpOnly where applicable
  - 30-minute rolling expiry for session cookies

#### Cross-Domain Data Sharing
- **PostMessage API**: Primary communication method
  - Origin validation for security
  - Structured message format with versioning
- **Shared Worker**: For multi-tab synchronization
- **Broadcast Channel API**: For same-origin tabs

#### Session State Persistence (MVP)

##### Core State Data
```typescript
interface WidgetState {
  // Essential data that MUST persist
  sessionId: string;
  customerId?: string;
  conversationHistory: Message[]; // Last 5 messages
  
  // Nice-to-have persistence
  currentIntent?: string;
  lastRecommendations?: Product[];
  
  // Transient data (can be lost)
  browsingHistory: Event[];
  uiPreferences: any;
}
```

##### State Restoration Flow
1. **Widget Initialization**:
   - Check sessionStorage for existing sessionId
   - If found, restore conversation history and customerId
   - If not found, generate new sessionId

2. **State Storage Triggers**:
   - After each user message
   - After receiving recommendations
   - Before page unload

3. **Storage Implementation**:
   ```javascript
   // Save state
   const saveState = (state: WidgetState) => {
     sessionStorage.setItem('porta_futuri_session', JSON.stringify({
       sessionId: state.sessionId,
       customerId: state.customerId,
       conversationHistory: state.conversationHistory.slice(-5) // Keep last 5
     }));
   };
   
   // Restore state
   const restoreState = (): WidgetState | null => {
     const saved = sessionStorage.getItem('porta_futuri_session');
     if (!saved) return null;
     
     const state = JSON.parse(saved);
     // Validate state is not older than 30 minutes
     if (isExpired(state.timestamp)) return null;
     
     return state;
   };
   ```

#### Session Timeout Behavior
- **30-minute inactivity timeout**:
  1. Warning at 25 minutes
  2. Automatic session extension on user activity
  3. Clear session data on timeout
  4. Preserve customer_id for re-initialization
  5. Show session expired message with refresh option

### 2.4 Real-Time Event Collection

#### Complete Event Schema
```typescript
interface EventData {
  // Required fields
  timestamp: string;          // ISO 8601 format
  event_type: 'page_view' | 'search' | 'cart_action' | 'purchase' | 'interaction';
  session_id: string;
  
  // Optional fields
  product_id?: string;
  category_viewed?: string;
  search_query?: string;
  cart_action?: 'add' | 'remove' | 'update';
  url: string;               // Full page URL
  referrer?: string;
  page_duration?: number;    // Seconds
  interaction_type?: string;
  viewport?: {
    width: number;
    height: number;
  };
  user_agent?: string;
}
```

#### Event Batching Rules
- **Batch Size**: Maximum 50 events
- **Batch Interval**: 5 seconds
- **Immediate Send Triggers**:
  - Purchase events
  - Cart actions
  - Page unload
- **Compression**: gzip for batches >10 events
- **Retry Logic**: Exponential backoff with 3 retries

#### Navigation Tracking
- **Single Page Applications (SPA)**:
  - History API monitoring
  - Route change detection
  - Virtual pageview tracking
- **Traditional Navigation**:
  - Page unload/load events
  - Session restoration
  - Cross-page state transfer

#### Privacy Compliance
- **GDPR Compliant Tracking**:
  - No PII in event data
  - Anonymous session IDs
  - IP address masking
  - User consent required for analytics
- **Data Minimization**:
  - Only collect necessary data
  - Automatic field sanitization
  - No third-party trackers
- **User Rights**:
  - View collected events
  - Delete event history
  - Opt-out mechanism

### 2.5 Data Schema Requirements

#### Product Catalog CSV Schema
```csv
id,name,price,category,description,brand,stock_quantity,image_url,attributes,rating,comments
```
- **Required fields**: id, name, price, category, description, rating, reviews
- **Optional fields**: All others
- **Max file size**: 50MB

#### Customer Profile Schema

##### CDP Response Schema Validation (MVP)
```typescript
interface CDPResponse {
  userId?: string;
  // All other fields are optional and dynamically mapped
  [key: string]: any;
}

// MVP Schema Transformer
class CDPDataTransformer {
  private static readonly FIELD_MAPPING = {
    'current_phone': 'Current Phone',
    'has_netflix': 'Netflix Subscriber',
    'mobile_subscriptions_count_daily': 'Active Mobile Subscriptions'
    // Add more mappings as discovered
  };
  
  private static readonly SKIP_FIELDS = ['dt', 'version', 'userIdType'];
  
  static transform(rawData: any): CustomerProfile {
    const profile: any = {};
    
    for (const [key, value] of Object.entries(rawData)) {
      if (this.SKIP_FIELDS.includes(key)) continue;
      
      const displayKey = this.FIELD_MAPPING[key] || this.humanizeFieldName(key);
      profile[displayKey] = value;
    }
    
    return profile;
  }
  
  static validate(data: any): boolean {
    // MVP: Just check if we have a userId
    return data && (data.userId || data.customer_id);
  }
}
```

#### CDP Integration - Customer 360 Fetch
```http
GET https://customer360.exacaster.com/courier/api/v1/workspaces/{workspace_id}/resources/{resource_id}?userId={customer_id}&page=0&size=1&sort=string
Authorization: Bearer {bearer_token}

Configurable Parameters:
- workspace_id: Configured in Porta Futuri Admin
- resource_id: Configured in Porta Futuri Admin  
- customer_id: Passed from widget or entered manually
- bearer_token: Stored securely in Porta Futuri Admin

Expected Response (JSON):
[
  {
    "userIdType": "user_id",
    "userId": "HH_9139599",
    "dt": "2022-09-07",
    "has_amazon_prime": 0,
    "has_hbo": 0,
    "has_netflix": 0,
    "home_subscriptions_count_daily": 2,
    "mobile_subscriptions_count_daily": 0,
    "mobile_subscriptions_revenue": 0.000,
    "current_phone": "iPhone",
    "version": 20221017135048008
  }
]

Data Mapping:
- userId: Links to customer record
- Skip technical fields: dt, version, userIdType
- Transform field names to human-readable labels:
  - current_phone → "Current Phone"
  - has_netflix → "Netflix Subscriber"
  - mobile_subscriptions_count_daily → "Active Mobile Subscriptions"

Fallback Behavior:
- If CDP is unavailable, mark customer profile as "unavailable"
```
- **Required fields**: customer_id
- **Optional fields**: All others (system works with available data)



## 3. Non-Functional Requirements

### 3.1 Performance Requirements

#### NFR-001: Response Time
- Initial recommendation: < 3 seconds (P95)
- Follow-up queries: < 2 seconds (P95)
- Widget load time: < 500ms
- CSV parsing: < 1 second per file
- CDP API calls: < 1 second

#### NFR-002: Scalability (MVP)
- Support 10 concurrent users
- Handle 100 requests per hour
- Cache recommendations for 15 minutes
- Simple in-memory caching with Supabase

#### NFR-003: Availability
- 99.5% uptime SLA during business hours
- Graceful fallback to static recommendations if AI unavailable
- Automatic retry with exponential backoff
- Circuit breaker pattern for external dependencies

### 3.2 Security Requirements

#### NFR-004: Data Protection
- TLS 1.3 for all API communications
- No persistent storage of customer data
- Session data expires after 30 minutes of inactivity
- CSV data held in memory only during processing
- Secure API keys for CDP integrations

#### NFR-005: Authentication & Authorization
- API key authentication for widget initialization
- Rate limiting: 100 requests per minute per domain (implemented via Supabase RLS)
- CORS configuration for approved domains only
- Input sanitization for all user inputs
- Admin authentication for management interface

#### NFR-006: Privacy Compliance
- No cookies required for basic functionality
- Optional analytics with explicit consent
- Right to deletion (session termination)
- Data processing agreement template provided
- Transparent data usage display

### 3.3 Usability Requirements

#### NFR-007: Browser Compatibility
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile browsers: iOS Safari 14+, Chrome Mobile
- Graceful degradation for older browsers
- No Flash or Java dependencies

#### NFR-008: Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## 4. LLM Integration Specifications

### 4.1 Prompt Templates

#### Product Search Template
```
System: You are a helpful shopping assistant for a telecom company. You have access to the product catalog and customer profile.

Customer Profile:
{customer_profile}

Product Catalog Summary:
{product_summary}

Customer Query: {query}

Previous Context: {conversation_history}

Task: Recommend 3-5 relevant products based on the customer's query and profile. Provide clear reasoning for each recommendation.
```

#### Intent Detection Template
```
System: Analyze the customer's browsing behavior to identify their shopping intent.

Browsing History:
{browsing_events}

Recent Actions:
{recent_actions}

Task: Identify the customer's likely intent and suggest a proactive message to engage them.
Output format:
- Intent: [detected intent]
- Confidence: [0-1]
- Suggested Message: [proactive engagement message]
```

#### Cross-Sell Template
```
System: Suggest complementary products for the selected item.

Selected Product: {product_details}
Customer Profile: {customer_profile}
Cart Contents: {cart_items}

Task: Recommend 2-3 accessories or services that complement the selected product.
```

### 4.2 Token Optimization Strategies
- **Context Truncation**: Limit conversation history to last 5 exchanges
- **Product Filtering**: Pre-filter catalog to top 100 relevant products
- **Field Selection**: Include only essential customer profile fields
- **Response Caching**: Cache responses for identical queries (15-min TTL)
- **Streaming Responses**: Use streaming API for faster perceived response

### 4.3 Fallback Logic
```
Primary: Claude (Anthropic)
  ↓ (on failure/timeout)
Static Responses:
  - Pre-computed recommendations based on category
  - Popular products list
  - Generic helpful messages
```

**Note**: ChatGPT removed from fallback options per specification

### 4.4 Context Window Management
- **Maximum Context**: 100,000 tokens per request
- **Priority Order**:
  1. Current query (required)
  2. Customer profile (if available)
  3. Recent conversation (last 5 exchanges)
  4. Relevant products (top 50-100)
  5. Browsing history (last 20 events)
- **Truncation Strategy**: Remove oldest/least relevant data first when approaching token limit

## 5. CSV Processing Specifications

### 5.1 Universal Validation Rules

#### Product CSV Validation
```javascript
const productValidation = {
  id: { required: true, type: 'string', maxLength: 50 },
  name: { required: true, type: 'string', maxLength: 200 },
  price: { required: true, type: 'number', min: 0, max: 999999 },
  category: { required: true, type: 'string', enum: ['Electronics', 'Accessories', 'Services'] },
  description: { required: true, type: 'string', maxLength: 1000 },
  brand: { required: false, type: 'string', maxLength: 100 },
  stock_quantity: { required: false, type: 'integer', min: 0 },
  image_url: { required: false, type: 'url', maxLength: 500 },
  rating: { required: false, type: 'number', min: 0, max: 5 },
  review_count: { required: false, type: 'integer', min: 0 }
};
```

### 5.2 Streaming Parser Implementation
```javascript
// Use PapaParse streaming for large files
Papa.parse(file, {
  chunk: function(results, parser) {
    // Process batch of 100 rows
    processBatch(results.data);
    updateProgress(results.meta.cursor);
  },
  complete: function() {
    finalizeImport();
  },
  error: function(error) {
    handleParseError(error);
  },
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  chunkSize: 1024 * 1024 // 1MB chunks
});
```

### 5.3 Error Handling & Recovery
- **Malformed Records**:
  - Log error with row number and field
  - Skip record and continue processing
  - Generate error report at end
- **Missing Required Fields**:
  - Attempt to use defaults where sensible
  - Flag record for manual review
- **Encoding Issues**:
  - Auto-detect encoding (UTF-8, ISO-8859-1)
  - Fallback to UTF-8 with character replacement
- **File Size Exceeded**:
  - Reject with clear error message
  - Suggest file splitting approach

## 6. Security & GDPR Compliance

### 6.1 GDPR Compliance Checklist
- [ ] Privacy Policy clearly displayed
- [ ] Explicit consent for data processing
- [ ] Data minimization implemented
- [ ] Right to access (data export)
- [ ] Right to erasure (data deletion)
- [ ] Right to rectification (data correction)
- [ ] Data portability support
- [ ] Privacy by design principles
- [ ] Data Protection Impact Assessment (DPIA)
- [ ] Breach notification procedures

### 6.2 PII Handling
- **Data Classification**:
  - Public: Product catalog, general recommendations
  - Internal: Session data, browsing history
  - Confidential: Customer ID, profile data
- **Encryption**:
  - At rest: AES-256 for any cached data
  - In transit: TLS 1.3 minimum
- **Access Controls**:
  - API key authentication
  - Rate limiting per endpoint
  - IP allowlisting for admin functions
- **Data Retention**:
  - Session data: 30 minutes after last activity
  - Event logs: 24 hours maximum
  - No permanent storage of PII

### 6.3 Security Headers
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline';
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

## 7. Technical Architecture

### 7.1 System Components

```
┌─────────────────────────────────────────────┐
│         Demo E-Commerce Site                │
│         (Mock Telecom Platform)             │
│                                             │
│  ┌────────────────────────────────────┐     │
│  │   Porta Futuri Widget (iframe)     │     │
│  │  ┌──────────┐  ┌──────────────┐    │     │
│  │  │   Chat   │  │Recommendation│    │     │
│  │  │    UI    │  │    Cards     │    │     │
│  │  └──────────┘  └──────────────┘    │     │
│  │  ┌──────────────────────────────┐  │     │
│  │  │  Customer Profile View       │  │     │
│  │  │  (Real-time Context Display) │  │     │
│  │  │  - Profile Data              │  │     │
│  │  │  - Browsing History          │  │     │
│  │  │  - AI Intent Display         │  │     │
│  │  └──────────────────────────────┘  │     │
│  └──────────────┬─────────────────────┘     │
│                 │ API Calls                 │
└─────────────────┼───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        Porta Futuri Backend                 │
│                                             │
│  ┌──────────────┐  ┌──────────────────┐     │
│  │ CSV Processor│  │  Request Handler │     │
│  │   & Cache    │  │   & Rate Limiter │     │
│  │  (50MB max)  │  │  (100 req/min)   │     │
│  └──────┬───────┘  └────────┬─────────┘     │
│         │                   │               │
│         ▼                   ▼               │
│  ┌─────────────────────────────────────┐    │
│  │       AI Recommendation Core        │    │
│  │  ┌─────────┐  ┌──────────────────┐  │    │
│  │  │ Context │  │  LLM Integration │  │    │
│  │  │ Builder │  │      (Claude)    │  │    │
│  │  └─────────┘  └──────────────────┘  │    │
│  │  ┌─────────────────────────────────┐│    │
│  │  │   Intent Detection Engine       ││    │
│  │  │   (Behavior Analysis)           ││    │
│  │  └─────────────────────────────────┘│    │
│  │  ┌─────────────────────────────────┐│    │
│  │  │   Session Memory Manager        ││    │
│  │  │   (30-min expiry)               ││    │
│  │  └─────────────────────────────────┘│    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │     CDP Integration Service         │    │
│  │  ┌─────────────────────────────────┐│    │
│  │  │  Exacaster CVM API Client       ││    │
│  │  │  (Customer 360 Fetch)           ││    │
│  │  └─────────────────────────────────┘│    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         Porta Futuri Admin                  │
│                                             │
│  ┌──────────────┐  ┌──────────────────┐     │
│  │   Products   │  │  CDP Integration │     │
│  │   Manager    │  │   Configuration  │     │
│  └──────────────┘  └──────────────────┘     │
│  ┌──────────────┐  ┌──────────────────┐     │
│  │   Widget     │  │    API Key       │     │
│  │   Manager    │  │    Management    │     │
│  └──────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      Porta Futuri Landing Page              │
│                                             │
│  - Product Overview and Features            │
│  - Value Propositions                       │
│  - Integration Documentation                │
│  - Admin Login Link                         │
└─────────────────────────────────────────────┘

External Integrations:
┌─────────────────────────────────────────────┐
│         Exacaster CVM Platform              │
│  ┌──────────────────────────────────────┐   │
│  │  Customer 360 REST API               │   │
│  │  - Real-time profile retrieval       │   │
│  │  - Behavioral data access            │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         E-Commerce Backend                  │
│  ┌──────────────────────────────────────┐   │
│  │  Product Catalog Export              │   │
│  │  - CSV generation                    │   │
│  │  - Scheduled or manual export        │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 7.2 Technology Stack

#### Frontend Widget
- **Framework**: React 18.3 with TypeScript (current implementation)
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state
- **Build**: Vite for optimal bundle size (<50KB compressed)
- **Communication**: PostMessage API for iframe isolation
- **Icons**: Lucide React for consistent iconography

#### Backend Service
- **Platform**: Supabase (current implementation)
  - PostgreSQL database for data storage
  - Edge Functions for serverless API endpoints
  - Real-time subscriptions for live updates
- **LLM Integration**: 
  - Claude (Anthropic SDK)
- **CSV Processing**: 
  - PapaParse for robust CSV handling
  - Streaming parser for large files
  - In-memory LRU cache with 15-minute TTL
- **Session Management**: 
  - Supabase Auth for API key validation
  - Session expiry after 30 minutes of inactivity

#### Administrative Components
- **Admin Interface**: 
  - React-based admin dashboard
  - File upload management
  - Integration configuration UI
- **Landing Page**: 
  - Static site generator (Next.js/Gatsby)
  - SEO optimized
  - Responsive design

#### Infrastructure (MVP)
- **Hosting**: 
  - Widget: Vercel/Netlify for React app
  - API: Supabase Edge Functions (optimized for 10 concurrent users)
  - Database: Supabase PostgreSQL (with connection pooling)
  - Admin: Vercel/Netlify
  - Landing: Vercel/Netlify
- **CDN**: Cloudflare for widget distribution
- **Monitoring**: 
  - Supabase Analytics for API metrics
  - Basic error logging to Supabase tables
- **Security**:
  - TLS 1.3 for all communications
  - CORS configuration for approved domains
  - Rate limiting: 100 requests/minute per domain (via Supabase RLS)
- **MVP Rate Limiting Implementation**:
  ```sql
  -- Supabase RLS policy for rate limiting
  CREATE TABLE rate_limits (
    domain TEXT PRIMARY KEY,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP DEFAULT NOW()
  );
  
  CREATE OR REPLACE FUNCTION check_rate_limit(req_domain TEXT)
  RETURNS BOOLEAN AS $$
  DECLARE
    current_count INTEGER;
  BEGIN
    -- Reset counter if window expired (1 minute)
    UPDATE rate_limits 
    SET request_count = 0, window_start = NOW()
    WHERE domain = req_domain 
    AND window_start < NOW() - INTERVAL '1 minute';
    
    -- Get current count
    SELECT request_count INTO current_count
    FROM rate_limits WHERE domain = req_domain;
    
    IF current_count IS NULL THEN
      INSERT INTO rate_limits (domain, request_count) 
      VALUES (req_domain, 1);
      RETURN TRUE;
    ELSIF current_count < 100 THEN
      UPDATE rate_limits 
      SET request_count = request_count + 1
      WHERE domain = req_domain;
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  END;
  $$ LANGUAGE plpgsql;
  ```

### 7.3 API Specification

#### Widget Initialization
```javascript
PortaFuturi.init({
  apiKey: 'your-api-key',
  containerId: 'porta-futuri-widget',
  theme: {
    primaryColor: '#007bff',
    position: 'bottom-right',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '8px'
  },
  features: {
    chat: true,
    recommendations: true,
    customerProfile: true,  // Enable customer profile view
    intentDetection: true,  // Enable behavior-based intent detection
    crossSell: true        // Enable cross-sell recommendations
  },
  data: {
    productCatalogUrl: '/path/to/products.csv',    // Max 50MB, up to 10,000 products
    customerProfileUrl: '/path/to/customer.csv',    // Max 50MB, single customer record
    contextUrl: '/path/to/context.csv'              // Max 50MB, last 500 events or 30 days
  },
  integrations: {
    cdp: {
      enabled: true,
      provider: 'exacaster',
      endpoint: 'https://api.exacaster.com/v1/customer360',
      apiKey: 'exacaster-api-key'
    }
  },
  accessibility: {
    highContrast: false,
    keyboardNavigation: true,
    screenReaderAnnouncements: true
  },
  performance: {
    cacheTimeout: 900000,  // 15 minutes in milliseconds
    maxRetries: 3,
    requestTimeout: 3000   // 3 seconds
  }
});
```

#### Recommendation Request
```http
POST /api/v1/recommendations
Content-Type: application/json
Authorization: Bearer {api-key}
X-Session-ID: {session-id}

{
  "session_id": "uuid",
  "query": "I need a phone with good camera",
  "intent": {
    "detected": "camera_quality_focus",
    "confidence": 0.85,
    "behavior_signals": ["viewed_camera_specs", "compared_phones"]
  },
  "conversation_history": [
    {
      "role": "user",
      "content": "What phones do you have?"
    },
    {
      "role": "assistant", 
      "content": "I can show you our latest smartphones..."
    }
  ],
  "context": {
    "current_page": "product/iphone-15",
    "cart_items": ["prod_123", "prod_456"],
    "browsing_category": "Smartphones",
    "session_duration": 120,
    "previous_searches": ["camera phone", "5G phone"],
    "browsing_history": [
      {"product_id": "TEL001", "timestamp": "2025-08-12T10:30:00"},
      {"product_id": "TEL002", "timestamp": "2025-08-12T10:35:00"}
    ]
  },
  "customer_data": {
    "csv_hash": "sha256_hash_of_customer_csv",
    "profile_loaded": true,
    "context_loaded": true,
    "cdp_data": {
      "customer_360_id": "CUST123",
      "last_updated": "2025-08-12T10:30:00"
    }
  },
  "recommendation_type": "search" // "search", "browse", "cross_sell"
}
```

#### Recommendation Response
```json
{
  "recommendations": [
    {
      "product_id": "prod_789",
      "name": "Samsung Galaxy S24 Ultra",
      "category": "Electronics",
      "subcategory": "Smartphones",
      "brand": "Samsung",
      "price": 1199.99,
      "description": "Premium Android flagship with advanced camera system",
      "features": ["5G", "S-Pen", "200MP camera"],
      "stock_status": "in_stock",
      "image_url": "https://...",
      "ratings": 4.8,
      "review_count": 1250,
      "reasoning": "Based on your interest in camera quality and your viewing of iPhone 15, this Samsung flagship offers comparable premium features with an exceptional 200MP camera system",
      "match_score": 0.92,
      "cross_sell_items": ["case_001", "airpods_002", "insurance_003"]
    }
  ],
  "message": "I found 3 phones with excellent cameras that match your needs. The Samsung Galaxy S24 Ultra stands out with its 200MP camera system.",
  "intent": {
    "understood": "Looking for high-quality camera phone",
    "confidence": 0.92
  },
  "session_id": "uuid",
  "response_time": 2450,
  "cache_hit": false,
  "fallback_used": false
}
```

#### Intent Detection Event
```http
POST /api/v1/intent/detect
Content-Type: application/json
Authorization: Bearer {api-key}

{
  "session_id": "uuid",
  "behavior_data": {
    "page_views": ["iphone-15", "iphone-14", "iphone-comparison"],
    "time_on_pages": {"iphone-15": 120, "iphone-14": 45},
    "interactions": ["zoom_image", "compare_button", "specs_tab"],
    "search_queries": ["iphone", "best iphone"]
  }
}
```

#### CDP Integration - Customer 360 Fetch
```http
GET https://customer360.exacaster.com/courier/api/v1/workspaces/{workspace_id}/resources/{resource_id}?userId={customer_id}&page=0&size=1&sort=string
Authorization: Bearer {bearer_token}

Configurable Parameters:
- workspace_id: Configured in Porta Futuri Admin
- resource_id: Configured in Porta Futuri Admin  
- customer_id: Passed from widget or entered manually
- bearer_token: Stored securely in Porta Futuri Admin

Expected Response (JSON):
[
  {
    "userIdType": "user_id",
    "userId": "HH_9139599",
    "dt": "2022-09-07",
    "has_amazon_prime": 0,
    "has_hbo": 0,
    "has_netflix": 0,
    "home_subscriptions_count_daily": 2,
    "mobile_subscriptions_count_daily": 0,
    "mobile_subscriptions_revenue": 0.000,
    "current_phone": "iPhone",
    "version": 20221017135048008
  }
]

Data Mapping:
- userId: Links to customer record
- Skip technical fields: dt, version, userIdType
- Transform field names to human-readable labels:
  - current_phone → "Current Phone"
  - has_netflix → "Netflix Subscriber"
  - mobile_subscriptions_count_daily → "Active Mobile Subscriptions"

Fallback Behavior:
- If CDP is unavailable, mark customer profile as "unavailable"
- Omit CDP data from widget display
- Continue with CSV-based data only
```

#### Admin API - CSV Upload
```http
POST /api/v1/admin/upload/products
Content-Type: multipart/form-data
Authorization: Bearer {admin-api-key}

FormData:
- file: products.csv
- validation: strict|lenient
- replace: true|false
```

#### Customer Profile Update (Real-time)
```http
POST /api/v1/profile/update
Content-Type: application/json
Authorization: Bearer {api-key}

{
  "session_id": "uuid",
  "profile_data": {
    "customer_id": "CUST123",
    "recent_events": [
      {
        "timestamp": "2025-08-06T10:30:00",
        "event_type": "product_view",
        "product_id": "TEL001"
      }
    ],
    "removed_context": ["prod_456", "search_query_3"]
  }
}
```

#### Error Response Format
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded. Please retry after 60 seconds.",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retry_after": 60
    }
  },
  "session_id": "uuid",
  "fallback_available": true
}
```

#### Complete Error Codes
| Code | HTTP Status | Description | Recovery Action |
|------|-------------|-------------|----------------|
| RATE_LIMIT_EXCEEDED | 429 | API rate limit exceeded | Retry with exponential backoff |
| INVALID_API_KEY | 401 | Invalid or expired API key | Check API key configuration |
| CDP_UNAVAILABLE | 503 | CDP service temporarily unavailable | Use fallback data |
| INVALID_CSV_FORMAT | 400 | CSV file format invalid | Check file format and retry |
| FILE_TOO_LARGE | 413 | File exceeds 50MB limit | Split file and retry |
| SESSION_EXPIRED | 440 | Session has expired | Reinitialize widget |
| LLM_TIMEOUT | 504 | LLM response timeout | Use static recommendations |
| INVALID_CUSTOMER_ID | 404 | Customer ID not found | Verify customer ID |
| QUOTA_EXCEEDED | 402 | Monthly quota exceeded | Upgrade plan or wait |
| INTERNAL_ERROR | 500 | Internal server error | Retry or contact support |

#### Webhook Endpoints

##### Real-time Updates Webhook
```http
POST {customer_webhook_url}/porta-futuri/updates
Content-Type: application/json
X-Signature: sha256={hmac_signature}

{
  "event_type": "recommendation_generated",
  "timestamp": "2025-08-12T10:30:00Z",
  "session_id": "uuid",
  "data": {
    "recommendations": [...],
    "intent": {...}
  }
}
```

##### Event Stream Webhook
```http
POST {customer_webhook_url}/porta-futuri/events
Content-Type: application/json
X-Signature: sha256={hmac_signature}

{
  "events": [
    {
      "timestamp": "2025-08-12T10:30:00Z",
      "event_type": "page_view",
      "session_id": "uuid",
      "data": {...}
    }
  ],
  "batch_id": "batch_123",
  "count": 50
}
```

##### CDP Sync Webhook
```http
POST {admin_webhook_url}/porta-futuri/cdp-sync
Content-Type: application/json
X-Signature: sha256={hmac_signature}

{
  "sync_type": "customer_update",
  "customer_id": "CUST123",
  "timestamp": "2025-08-12T10:30:00Z",
  "changes": {
    "fields_updated": ["current_phone", "subscriptions"],
    "source": "exacaster_cdp"
  }
}
```

## 8. Integration Requirements

### 8.1 Exacaster CVM Platform Integration
- **Purpose**: Retrieve real-time Customer 360 profiles
- **Integration Type**: REST API
- **Authentication**: API key-based
- **Data Flow**:
  1. Porta Futuri Backend calls Exacaster API
  2. Retrieves customer profile and behavioral data
  3. Caches data for session duration
  4. Includes in LLM context for recommendations
- **Requirements**:
  - API endpoint configuration in Admin
  - Secure storage of API credentials
  - Fallback to CSV data if API unavailable
  - Response time < 1 second

### 8.2 E-Commerce Backend Integration
- **Purpose**: Import product catalog data
- **Integration Type**: CSV file export/import
- **Data Flow**:
  1. E-commerce platform exports products.csv
  2. Admin uploads file via Porta Futuri Admin
  3. System validates and processes CSV
  4. Product data cached for recommendations
- **Requirements**:
  - Support for scheduled imports
  - Validation of CSV format
  - Incremental updates support
  - Error reporting for invalid data

### 8.3 Demo E-Commerce Site
- **Purpose**: Showcase Porta Futuri capabilities
- **Features**:
  - Mock telecom product catalog
  - Embedded Porta Futuri Widget
  - Sample customer journeys
  - Performance metrics display
- **Requirements**:
  - Realistic product data
  - Multiple user personas
  - Mobile-responsive design
  - Easy reset for demos

## 9. Implementation Plan

### Phase 1: Core Development
- [ ] CSV parser and data validation
- [ ] Basic LLM integration with prompt engineering
- [ ] Intent detection engine
- [ ] Simple API endpoints
- [ ] Unit tests for data processing

### Phase 2: Widget Development
- [ ] Embeddable JavaScript widget
- [ ] Responsive UI with chat interface
- [ ] Customer profile view component
- [ ] Browsing history management
- [ ] PostMessage communication layer
- [ ] Cross-browser testing

### Phase 3: AI Enhancement
- [ ] Context-aware recommendations
- [ ] Behavior-based intent detection
- [ ] Cross-sell recommendation logic
- [ ] Conversation memory management
- [ ] Response caching optimization
- [ ] A/B testing framework

### Phase 4: Administrative Components
- [ ] Admin dashboard development
- [ ] CSV upload interface
- [ ] CDP integration configuration
- [ ] Analytics dashboard
- [ ] Landing page creation

### Phase 5: Integration Development
- [ ] Exacaster CVM API client
- [ ] CDP data synchronization
- [ ] Demo e-commerce site
- [ ] Integration testing

### Phase 6: Production Readiness
- [ ] Security hardening and penetration testing
- [ ] Performance optimization
- [ ] Documentation and integration guides
- [ ] Pilot customer onboarding

## 10. Testing Requirements

### 10.1 Unit Testing

#### Coverage Requirements
- Minimum 80% code coverage
- 100% coverage for critical paths:
  - Payment processing
  - Data validation
  - Security functions

#### Test Scenarios
1. **CSV Parser Tests**:
   - Valid CSV with all fields
   - Missing optional fields
   - Invalid data types
   - Encoding issues (UTF-8, ISO-8859-1)
   - Files at size limits (50MB)
   - Empty files
   - Malformed headers

2. **LLM Integration Tests**:
   - Successful response
   - Timeout handling
   - Rate limit handling
   - Fallback to static responses
   - Context truncation
   - Token limit enforcement

3. **CDP Integration Tests**:
   - Successful data fetch
   - API unavailable
   - Invalid credentials
   - Malformed response
   - Timeout scenarios

4. **Session Management Tests**:
   - Session creation
   - Session expiry
   - Session restoration
   - Cross-tab synchronization
   - Storage fallbacks

### 10.2 Integration Testing

#### Test Matrix
| Component A | Component B | Test Scenario | Expected Result |
|-------------|-------------|---------------|----------------|
| Widget | Backend API | Product search | Recommendations in <3s |
| Widget | CDP | Customer profile fetch | Profile data displayed |
| Backend | LLM | Intent detection | Correct intent identified |
| Backend | Database | Session persistence | Data survives restart |
| Widget | Host Site | Event tracking | All events captured |

#### End-to-End Scenarios
1. **New Customer Journey**:
   - Widget loads
   - Manual customer ID entry
   - First product search
   - View recommendations
   - Select product
   - Cross-sell suggestions

2. **Returning Customer Journey**:
   - Widget loads with saved preferences
   - CDP data auto-loaded
   - Personalized greeting
   - Intent-based proactive message
   - Contextual recommendations

3. **CDP Failure Scenario**:
   - CDP unavailable
   - Fallback to CSV data
   - Degraded mode indication
   - Basic recommendations work

### 10.3 Performance Testing (MVP)

#### Load Testing Scenarios
1. **Baseline Load** (5 concurrent users):
   - Response time: <2s (P95)
   - Error rate: <0.1%
   - Supabase connection pool: <30%

2. **Peak Load** (10 concurrent users):
   - Response time: <3s (P95)
   - Error rate: <1%
   - Supabase connection pool: <60%

3. **Stress Test** (20 concurrent users):
   - Graceful degradation with queue
   - Return cached responses when overloaded
   - Auto-recovery when load reduces

#### Performance Benchmarks
| Operation | Target (P95) | Target (P99) | Max |
|-----------|-------------|--------------|-----|
| Widget Load | 500ms | 750ms | 1s |
| First Recommendation | 3s | 4s | 5s |
| Follow-up Query | 2s | 3s | 4s |
| CSV Parse (10MB) | 1s | 2s | 3s |
| CDP Fetch | 1s | 1.5s | 2s |

#### Memory Leak Testing
- 24-hour continuous operation
- 10,000 session cycles
- Memory usage should stabilize
- No gradual memory increase

### 10.4 User Acceptance Testing

#### UAT Criteria
1. **Functional Acceptance**:
   - [ ] Widget loads on all test sites
   - [ ] Recommendations are relevant (>80% satisfaction)
   - [ ] Intent detection accuracy >75%
   - [ ] Cross-sell suggestions appropriate
   - [ ] CDP data correctly displayed
   - [ ] Session management works correctly

2. **Performance Acceptance**:
   - [ ] Response times meet SLA
   - [ ] No visible lag in UI
   - [ ] Smooth scrolling and interactions
   - [ ] Quick fallback when services unavailable

3. **Usability Acceptance**:
   - [ ] Intuitive interface (no training needed)
   - [ ] Clear error messages
   - [ ] Mobile experience satisfactory
   - [ ] Accessibility standards met

#### Pilot Customer Testing
- **Minimum**: 5 customers
- **Duration**: 2 weeks
- **Metrics to Track**:
  - Click-through rate on recommendations
  - Conversion rate improvement
  - Average session duration
  - Customer satisfaction scores
  - Bug reports and severity

#### Success Criteria
- Recommendation CTR: >15%
- User satisfaction: >4.0/5.0
- Critical bugs: 0
- Major bugs: <5
- Performance SLA met: >99%

## 11. Success Metrics

### Primary KPIs
- **Recommendation CTR**: > 15%
- **Response Time**: < 3 seconds (P95)
- **Widget Load Time**: < 500ms
- **User Satisfaction**: > 4.0/5.0
- **Intent Detection Accuracy**: > 75%

### Secondary KPIs
- **API Uptime**: > 99.5%
- **Cache Hit Rate**: > 60%
- **Error Rate**: < 1%
- **Session Duration**: > 2 minutes
- **Cross-sell Conversion**: > 10%
- **CDP Integration Success Rate**: > 95%

## 12. Risks and Mitigations

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|---------|------------|------------|
| LLM API rate limits | High | Medium | Implement caching, use multiple providers |
| Large CSV parsing timeout | Medium | Medium | Streaming parser, file size limits |
| Cross-origin security issues | High | Low | Proper CORS configuration, iframe sandbox |
| Poor recommendation quality | High | Medium | A/B testing, feedback loop, manual curation |
| CDP integration failures | Medium | Medium | Fallback to CSV data, circuit breaker pattern |
| Intent detection inaccuracy | Medium | High | ML model training, rule-based fallbacks |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|---------|------------|------------|
| Low adoption rate | High | Medium | Free tier, easy integration, strong documentation |
| LLM cost overrun | Medium | Medium | Token optimization, response caching, usage limits |
| Data privacy concerns | High | Low | Clear privacy policy, no data retention, transparency features |
| CDP vendor lock-in | Medium | Low | Abstract integration layer, multiple CDP support |

## 13. Future Enhancements (Post-MVP)

1. **Real-time Data Streaming**: Webhooks and streaming APIs for live updates
2. **Multi-language Support**: Internationalization of UI and recommendations
3. **Advanced Analytics Dashboard**: Detailed recommendation performance metrics
4. **Custom Model Training**: Fine-tuned models per customer segment
5. **Native Platform Plugins**: Shopify, WooCommerce, Magento apps
6. **Batch Processing**: Bulk recommendation generation for email campaigns
7. **Visual Search**: Image-based product recommendations
8. **Voice Interface**: Audio queries and responses
9. **Multi-CDP Support**: Integration with Segment, mParticle, etc.
10. **Predictive Intent**: Anticipate needs before explicit signals

## 14. Acceptance Criteria

The MVP will be considered complete when:
1. Widget successfully embeds on 3 different test sites
2. Processes CSV files up to specified limits without errors
3. Generates relevant recommendations in < 3 seconds
4. Intent detection achieves 75% accuracy in testing
5. Cross-sell recommendations show 10% conversion rate
6. CDP integration successfully retrieves Customer 360 data
7. Admin interface allows CSV upload and configuration
8. Demo site showcases all major features
9. Passes security audit with no critical vulnerabilities
10. Documentation allows developer to integrate in < 30 minutes

---

## Appendix A: Sample CSV Files

### products.csv
```csv
product_id,name,category,subcategory,brand,price,description,features,stock_status,image_url,ratings,review_count
TEL001,iPhone 15 Pro,Electronics,Smartphones,Apple,1199.00,"Latest iPhone with titanium design","5G|ProRAW|A17 Pro chip",in_stock,https://example.com/iphone15.jpg,4.8,2341
TEL002,Galaxy S24 Ultra,Electronics,Smartphones,Samsung,1299.00,"Premium Android flagship","5G|S-Pen|200MP camera",in_stock,https://example.com/s24.jpg,4.7,1823
ACC001,iPhone 15 Pro Case,Accessories,Phone Cases,Apple,59.00,"Premium leather case","MagSafe|Drop protection",in_stock,https://example.com/case.jpg,4.5,432
ACC002,AirPods Pro 2,Accessories,Audio,Apple,249.00,"Premium wireless earbuds","ANC|Spatial audio",in_stock,https://example.com/airpods.jpg,4.6,3421
SVC001,Device Insurance,Services,Insurance,PortaFuturi,9.99,"Monthly device protection","Theft|Damage|Loss coverage",available,https://example.com/insurance.jpg,4.2,892
```

### customer.csv
```csv
customer_id,age_group,gender,location,purchase_history,preferences,lifetime_value,segment,last_purchase_date,engagement_score
CUST123,25-34,M,New York,"iPhone 12|AirPods","premium|photography",3500,high_value,2025-06-15,85
```

### context.csv
```csv
timestamp,event_type,product_id,category_viewed,search_query,cart_action,session_id,page_duration,interaction_type
2025-08-12T10:30:00,page_view,TEL001,Smartphones,,,session_456,120,product_detail
2025-08-12T10:28:00,search,,,,"camera phone",,session_456,45,search_results
2025-08-12T10:26:00,page_view,TEL002,Smartphones,,,session_456,90,product_compare
2025-08-12T10:24:00,interaction,,Smartphones,,,session_456,30,filter_price
```

---

## Appendix B: Intent Detection Examples

### Example 1: iPhone Interest
**Behavior Pattern**:
- Viewed 3+ iPhone models
- Spent >2 minutes on iPhone pages
- Used comparison tool

**Detected Intent**: "Interested in purchasing iPhone"
**Proactive Message**: "I noticed you're exploring our iPhone selection. Would you like help choosing the right model for your needs?"

### Example 2: Budget Conscious
**Behavior Pattern**:
- Applied price filter <$500
- Sorted by price (low to high)
- Viewed refurbished section

**Detected Intent**: "Looking for budget-friendly options"
**Proactive Message**: "Looking for great value? I can show you our best phones under $500 with excellent features."

### Example 3: Upgrade Ready
**Behavior Pattern**:
- Viewed trade-in page
- Checked upgrade eligibility
- Compared newer models

**Detected Intent**: "Ready to upgrade device"
**Proactive Message**: "Time for an upgrade? Let me help you find the perfect new device and maximize your trade-in value."

---

*This requirements document defines the MVP scope for Porta Futuri AI Add-On. Any features not explicitly mentioned are out of scope for the initial release.*

*Version 1.1 incorporates enhanced use cases, administrative capabilities, and external integrations to provide a complete AI-powered shopping assistant solution.*