# Porta Futuri AI Add-On Requirements

### Document Version
- **Version**: 1.0
- **Date**: August 2025
- **Status**: Draft

---

## 1. Executive Summary

Porta Futuri AI Add-On is a lightweight, embeddable recommendation widget that provides intelligent product suggestions using AI-powered analysis of customer data. This MVP version operates on CSV-based data sources, allowing rapid deployment and testing without complex integrations.

### Key Principles
- **Simple Integration**: Single JavaScript snippet embedding
- **Data Agnostic**: Works with CSV exports from any platform
- **Privacy First**: No data storage, real-time processing only
- **Cost Effective**: Optimized LLM usage with intelligent caching

## 2. Functional Requirements

### 2.1 Core Functionality

#### FR-001: Data Ingestion
- **Description**: System must read and process three CSV data sources
- **Acceptance Criteria**:
  - Parse product catalog CSV (up to 10,000 products)
  - Parse customer profile CSV (single customer record)
  - Parse real-time context CSV (last 50 interactions)
  - Validate data format and handle missing fields gracefully
  - Support UTF-8 encoding for international characters

#### FR-002: AI Recommendation Engine
- **Description**: Generate personalized product recommendations
- **Acceptance Criteria**:
  - Return 3-5 relevant product recommendations
  - Provide explanation for each recommendation
  - Response time under 3 seconds for 95% of requests
  - Support both browsing and cart abandonment scenarios
  - Handle "cold start" (no context) gracefully

#### FR-003: Embeddable Widget
- **Description**: JavaScript widget for easy integration
- **Acceptance Criteria**:
  - Single line JavaScript embed code
  - Responsive design (mobile, tablet, desktop)
  - Customizable appearance (colors, fonts, position)
  - Accessibility compliant (WCAG 2.1 AA)
  - Maximum 50KB compressed JavaScript bundle

#### FR-004: Conversation Interface
- **Description**: Natural language interaction with customers
- **Acceptance Criteria**:
  - Accept free-form text queries
  - Maintain conversation context for session
  - Support clarifying questions
  - Handle product comparisons

#### FR-005: Customer Profile Interface
- **Description**: A visual interface to show current customer profile and the real time customer context
- **Acceptance Criteria**:
  - Show all the context that we have about the customer when we do the recommendations
  - Make sure that the data is update in real time if something changes

### 2.2 Data Schema Requirements

#### Product Catalog CSV Schema
```csv
product_id,name,category,subcategory,brand,price,description,features,stock_status,image_url,ratings,review_count
```
- **Required fields**: product_id, name, category, price, description, rating, reviews
- **Optional fields**: All others
- **Max file size**: 50MB

#### Customer Profile CSV Schema
```csv
customer_id
```
- **Required fields**: customer_id
- **Optional fields**: All others (system works with available data)
- **Max file size**: 50MB

#### Real-Time Context CSV Schema
```csv
timestamp,event_type
```
- **Required fields**: timestamp, event_type
- **Optional fields**: All others based on event type
- **Max file size**: 50MB
- **Time window**: Last 30 days or 500 events (whichever is smaller)

## 3. Non-Functional Requirements

### 3.1 Performance Requirements

#### NFR-001: Response Time
- Initial recommendation: < 3 seconds (P95)
- Follow-up queries: < 2 seconds (P95)
- Widget load time: < 500ms
- CSV parsing: < 1 second per file

#### NFR-002: Scalability
- Support 100 concurrent users (MVP)
- Handle 1,000 requests per hour
- Cache recommendations for 15 minutes
- Queue overflow handling with graceful degradation

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

#### NFR-005: Authentication & Authorization
- API key authentication for widget initialization
- Rate limiting: 100 requests per minute per API key
- CORS configuration for approved domains only
- Input sanitization for all user inputs

#### NFR-006: Privacy Compliance
- No cookies required for basic functionality
- Optional analytics with explicit consent
- Right to deletion (session termination)
- Data processing agreement template provided

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

## 4. Technical Architecture

### 4.1 System Components

```
┌─────────────────────────────────────────────┐
│         Host Website (Any Platform)          │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │   Porta Futuri Widget (iframe)     │     │
│  │  ┌──────────┐  ┌──────────────┐   │     │
│  │  │   Chat   │  │ Recommendation│   │     │
│  │  │    UI    │  │     Cards     │   │     │
│  │  └──────────┘  └──────────────┘   │     │
│  │  ┌──────────────────────────────┐ │     │
│  │  │  Customer Profile View       │ │     │
│  │  │  (Real-time Context Display) │ │     │
│  │  └──────────────────────────────┘ │     │
│  └──────────────┬─────────────────────┘     │
│                 │ API Calls                  │
└─────────────────┼────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        Porta Futuri API Service              │
│                                              │
│  ┌──────────────┐  ┌──────────────────┐    │
│  │ CSV Processor│  │  Request Handler  │    │
│  │   & Cache   │  │   & Rate Limiter   │    │
│  │  (50MB max) │  │  (100 req/min)    │    │
│  └──────┬───────┘  └────────┬─────────┘    │
│         │                    │               │
│         ▼                    ▼               │
│  ┌─────────────────────────────────────┐    │
│  │       AI Recommendation Core         │    │
│  │  ┌─────────┐  ┌──────────────────┐ │    │
│  │  │ Context │  │  LLM Integration  │ │    │
│  │  │ Builder │  │  (Claude/GPT-4)   │ │    │
│  │  └─────────┘  └──────────────────┘ │    │
│  │  ┌─────────────────────────────────┐│    │
│  │  │   Session Memory Manager         ││    │
│  │  │   (30-min expiry)               ││    │
│  │  └─────────────────────────────────┘│    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 4.2 Technology Stack

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
  - Primary: Claude (Anthropic SDK)
  - Fallback: GPT-4 (OpenAI SDK)
- **CSV Processing**: 
  - PapaParse for robust CSV handling
  - Streaming parser for large files
  - In-memory LRU cache with 15-minute TTL
- **Session Management**: 
  - Supabase Auth for API key validation
  - Session expiry after 30 minutes of inactivity

#### Infrastructure (MVP)
- **Hosting**: 
  - Widget: Vercel/Netlify for React app
  - API: Supabase Edge Functions
  - Database: Supabase PostgreSQL
- **CDN**: Cloudflare for widget distribution
- **Monitoring**: 
  - Supabase Analytics for API metrics
  - Error tracking with Sentry (optional)
- **Security**:
  - TLS 1.3 for all communications
  - CORS configuration for approved domains
  - Rate limiting: 100 requests/minute per API key

### 4.3 API Specification

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
    customerProfile: true  // Enable customer profile view (FR-005)
  },
  data: {
    productCatalogUrl: '/path/to/products.csv',    // Max 50MB, up to 10,000 products
    customerProfileUrl: '/path/to/customer.csv',    // Max 50MB, single customer record
    contextUrl: '/path/to/context.csv'              // Max 50MB, last 500 events or 30 days
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
    "previous_searches": ["camera phone", "5G phone"]
  },
  "customer_data": {
    "csv_hash": "sha256_hash_of_customer_csv",  // For cache validation
    "profile_loaded": true,
    "context_loaded": true
  }
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
      "match_score": 0.92
    }
  ],
  "message": "I found 3 phones with excellent cameras that match your needs. The Samsung Galaxy S24 Ultra stands out with its 200MP camera system.",
  "session_id": "uuid",
  "response_time": 2450,  // milliseconds
  "cache_hit": false,
  "fallback_used": false  // true if static recommendations were used
}
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
    ]
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

## 5. Implementation Plan

### Phase 1: Core Development
- [ ] CSV parser and data validation
- [ ] Basic LLM integration with prompt engineering
- [ ] Simple API endpoints
- [ ] Unit tests for data processing

### Phase 2: Widget Development
- [ ] Embeddable JavaScript widget
- [ ] Responsive UI with chat interface
- [ ] PostMessage communication layer
- [ ] Cross-browser testing

### Phase 3: AI Enhancement
- [ ] Context-aware recommendations
- [ ] Conversation memory management
- [ ] Response caching optimization
- [ ] A/B testing framework

### Phase 4: Production Readiness
- [ ] Security hardening and penetration testing
- [ ] Performance optimization
- [ ] Documentation and integration guides
- [ ] Pilot customer onboarding

## 6. Testing Requirements

### 6.1 Unit Testing
- Minimum 80% code coverage
- All data parsers and validators
- LLM prompt generation logic
- Cache invalidation rules

### 6.2 Integration Testing
- CSV file upload and processing
- API endpoint responses
- Widget embedding on test sites
- Cross-origin communication

### 6.3 Performance Testing
- Load testing with 100 concurrent users
- CSV parsing with maximum file sizes
- LLM response time optimization
- Memory leak detection

### 6.4 User Acceptance Testing
- 5 pilot customers minimum
- Recommendation relevance scoring
- UI/UX feedback collection
- Conversion rate baseline measurement

## 7. Success Metrics

### Primary KPIs
- **Recommendation CTR**: > 15%
- **Response Time**: < 3 seconds (P95)
- **Widget Load Time**: < 500ms
- **User Satisfaction**: > 4.0/5.0

### Secondary KPIs
- **API Uptime**: > 99.5%
- **Cache Hit Rate**: > 60%
- **Error Rate**: < 1%
- **Session Duration**: > 2 minutes

## 8. Risks and Mitigations

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|---------|------------|------------|
| LLM API rate limits | High | Medium | Implement caching, use multiple providers |
| Large CSV parsing timeout | Medium | Medium | Streaming parser, file size limits |
| Cross-origin security issues | High | Low | Proper CORS configuration, iframe sandbox |
| Poor recommendation quality | High | Medium | A/B testing, feedback loop, manual curation |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|---------|------------|------------|
| Low adoption rate | High | Medium | Free tier, easy integration, strong documentation |
| LLM cost overrun | Medium | Medium | Token optimization, response caching, usage limits |
| Data privacy concerns | High | Low | Clear privacy policy, no data retention |

## 9. Future Enhancements (Post-MVP)

1. **Real-time Data Integration**: Webhooks and streaming APIs
2. **Multi-language Support**: Internationalization of UI and recommendations
3. **Advanced Analytics Dashboard**: Recommendation performance metrics
4. **Custom Model Training**: Fine-tuned models per customer
5. **Native Platform Plugins**: Shopify, WooCommerce, Magento apps
6. **Batch Processing**: Bulk recommendation generation for email campaigns
7. **Visual Search**: Image-based product recommendations
8. **Voice Interface**: Audio queries and responses

## 10. Acceptance Criteria

The MVP will be considered complete when:
1. Widget successfully embeds on 3 different test sites
2. Processes CSV files up to specified limits without errors
3. Generates relevant recommendations in < 3 seconds
4. Passes security audit with no critical vulnerabilities
5. Achieves 15% CTR in pilot testing
6. Documentation allows developer to integrate in < 30 minutes

---

## Appendix A: Sample CSV Files

### products.csv
```csv
product_id,name,category,subcategory,brand,price,description,features,stock_status,image_url
TEL001,iPhone 15 Pro,Electronics,Smartphones,Apple,1199.00,"Latest iPhone with titanium design","5G|ProRAW|A17 Pro chip",in_stock,https://example.com/iphone15.jpg
TEL002,Galaxy S24 Ultra,Electronics,Smartphones,Samsung,1299.00,"Premium Android flagship","5G|S-Pen|200MP camera",in_stock,https://example.com/s24.jpg
```

### customer.csv
```csv
customer_id,age_group,gender,location,purchase_history,preferences,lifetime_value,segment
CUST123,25-34,M,New York,"iPhone 12|AirPods","premium|photography",3500,high_value
```

### context.csv
```csv
timestamp,event_type,product_id,category_viewed,search_query,cart_action,session_id
2025-08-06T10:30:00,page_view,TEL001,Smartphones,,add,session_456
2025-08-06T10:28:00,search,,,camera phone,,session_456
```

---

*This requirements document defines the MVP scope for Porta Futuri AI Add-On. Any features not explicitly mentioned are out of scope for the initial release.*