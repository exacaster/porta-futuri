# PRP: Customer Profile Data Integration (FR-002)

## Document Metadata
- **Feature**: FR-002 - Customer Profile Data Integration with Exacaster CVM Platform
- **Created**: 2025-08-13
- **Priority**: High
- **Complexity**: Medium-High
- **Estimated Effort**: 8-10 hours
- **Dependencies**: Existing admin panel, widget infrastructure, Supabase backend

## 1. Goal
Implement comprehensive Customer Data Platform (CDP) integration that allows Porta Futuri to query real-time customer profiles from Exacaster CVM Platform via REST API, with manual customer ID entry fallback and full admin configuration capabilities.

### Success Criteria
- [ ] Admin can configure Exacaster CDP integration settings (URL, bearer token, workspace_id, resource_id)
- [ ] Widget can accept customer_id from multiple sources (JS variable, URL param, cookie, manual entry)
- [ ] System successfully fetches Customer 360 data from Exacaster API
- [ ] Graceful fallback when CDP is unavailable
- [ ] Customer profile data is displayed in widget UI
- [ ] Integration settings are securely stored and encrypted
- [ ] Response time < 1 second for CDP calls

## 2. Why
**Business Value**: This integration transforms Porta Futuri from a basic recommendation engine to a sophisticated personalization platform that leverages comprehensive customer data.

**User Impact**:
- **Merchants**: Get deeper customer insights for better recommendations
- **End Users**: Receive highly personalized product suggestions based on their complete profile
- **ROI**: Expected 25% increase in recommendation CTR with CDP data

## 3. Context

### 3.1 Existing Codebase Patterns

#### Admin Panel Structure (Reference: `/src/admin/App.tsx`)
```typescript
// Current tab structure - lines 53, 135-169
const [activeTab, setActiveTab] = useState<'upload' | 'products' | 'users' | 'widget'>('upload');

// Tab navigation pattern
<nav className="flex space-x-8">
  <button className={`pb-2 px-1 ${activeTab === 'widget' ? 'border-b-2 border-primary font-medium' : 'text-gray-600'}`}>
    Porta Futuri Widget
  </button>
</nav>
```

#### Widget Configuration Component (Reference: `/src/admin/components/WidgetConfiguration.tsx`)
```typescript
// Current configuration structure - lines 34-40
const [widgetConfig, setWidgetConfig] = useState({
  position: 'bottom-right',
  primaryColor: '#3b82f6',
  apiUrl: window.location.origin.includes('localhost') 
    ? 'http://localhost:54321/functions/v1'
    : 'https://your-domain.com/api/v1'
});
```

#### Database Schema Pattern (Reference: `/supabase/migrations/002_api_tables.sql`)
```sql
-- Existing table creation pattern
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  rate_limit INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Customer Types (Reference: `/src/shared/types/customer.types.ts`)
```typescript
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
```

### 3.2 Exacaster CVM Platform API Specification

#### Endpoint Format
```http
GET https://customer360.exacaster.com/courier/api/v1/workspaces/{workspace_id}/resources/{resource_id}?userId={customer_id}&page=0&size=1&sort=string
Authorization: Bearer {bearer_token}
```

#### Expected Response Structure
```json
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
```

### 3.3 Security Considerations
- Bearer tokens must be encrypted at rest using Supabase vault
- All CDP API calls must be server-side only (never expose tokens to client)
- Implement request signing for additional security
- Audit log all CDP configuration changes

### 3.4 Customer ID Acquisition Priority (from Product Vision)
1. JavaScript variable: `window.PortaFuturi.customerId`
2. URL parameter: `?customer_id=CUST123`
3. Cookie: `porta_futuri_customer_id`
4. Manual entry in widget UI

## 4. Implementation Blueprint

### Phase 1: Database Schema
```sql
-- 1. Create CDP integrations table
CREATE TABLE IF NOT EXISTS cdp_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'exacaster',
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  credentials_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  test_status TEXT DEFAULT 'untested',
  last_tested_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create CDP request logs table
CREATE TABLE IF NOT EXISTS cdp_request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES cdp_integrations(id) ON DELETE CASCADE,
  customer_id TEXT,
  request_url TEXT,
  response_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add RLS policies
ALTER TABLE cdp_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdp_request_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create indexes
CREATE INDEX idx_cdp_integrations_provider ON cdp_integrations(provider);
CREATE INDEX idx_cdp_request_logs_integration ON cdp_request_logs(integration_id, created_at);
```

### Phase 2: Admin Panel Integration Tab Component
```typescript
// New file: /src/admin/components/IntegrationsTab.tsx
interface CDPIntegration {
  id: string;
  provider: 'exacaster' | 'segment' | 'custom';
  name: string;
  config: {
    workspace_id?: string;
    resource_id?: string;
    api_url?: string;
  };
  is_active: boolean;
  test_status: 'untested' | 'success' | 'failed';
  last_tested_at?: string;
}

// Component structure following WidgetConfiguration pattern
export const IntegrationsTab: React.FC<{supabase: SupabaseClient}> = ({supabase}) => {
  const [integrations, setIntegrations] = useState<CDPIntegration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<CDPIntegration | null>(null);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  
  // CRUD operations
  const saveIntegration = async (integration: CDPIntegration) => {
    // Encrypt credentials using Supabase vault
    // Save to database
  };
  
  const testIntegration = async (integration: CDPIntegration) => {
    // Make test API call
    // Update test_status
  };
}
```

### Phase 3: CDP Service Implementation
```typescript
// New file: /src/api/services/cdp.service.ts
export class CDPService {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, {data: any; timestamp: number}>();
  
  async fetchCustomer360(customerId: string): Promise<CDPCustomerData | null> {
    // Check cache first
    const cached = this.cache.get(customerId);
    if (cached && Date.now() - cached.timestamp < CDPService.CACHE_TTL) {
      return cached.data;
    }
    
    // Get active integration
    const integration = await this.getActiveIntegration();
    if (!integration) return null;
    
    // Decrypt credentials
    const credentials = await this.decryptCredentials(integration.credentials_encrypted);
    
    // Make API call
    const response = await fetch(this.buildUrl(integration, customerId), {
      headers: {
        'Authorization': `Bearer ${credentials.bearer_token}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    
    // Transform and cache response
    const data = await this.transformResponse(response);
    this.cache.set(customerId, {data, timestamp: Date.now()});
    
    return data;
  }
  
  private transformResponse(raw: any): CDPCustomerData {
    // Map Exacaster fields to our schema
    return {
      customer_id: raw.userId,
      current_phone: raw.current_phone,
      subscriptions: {
        netflix: Boolean(raw.has_netflix),
        hbo: Boolean(raw.has_hbo),
        amazon_prime: Boolean(raw.has_amazon_prime),
        mobile_count: raw.mobile_subscriptions_count_daily,
        home_count: raw.home_subscriptions_count_daily
      },
      // ... map other fields
    };
  }
}
```

### Phase 4: Widget Customer ID Handling
```typescript
// Update: /src/widget/App.tsx
const getCustomerId = (): string | null => {
  // 1. Check JavaScript variable (highest priority)
  if (window.PortaFuturi?.customerId) return window.PortaFuturi.customerId;
  
  // 2. Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlCustomerId = urlParams.get('customer_id');
  if (urlCustomerId) return urlCustomerId;
  
  // 3. Check cookie
  const cookieValue = getCookie('porta_futuri_customer_id');
  if (cookieValue) return cookieValue;
  
  // 4. Check sessionStorage (for persistence)
  const sessionValue = sessionStorage.getItem('porta_futuri_customer_id');
  if (sessionValue) return sessionValue;
  
  // 5. Return null to trigger manual entry UI
  return null;
};

// Add manual entry component
const CustomerIdInput: React.FC<{onSubmit: (id: string) => void}> = ({onSubmit}) => {
  const [customerId, setCustomerId] = useState('');
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">Enter Customer ID</h3>
      <input
        type="text"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
        placeholder="e.g., CUST123"
        className="w-full px-3 py-2 border rounded"
      />
      <button 
        onClick={() => {
          onSubmit(customerId);
          sessionStorage.setItem('porta_futuri_customer_id', customerId);
        }}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Continue
      </button>
    </div>
  );
};
```

### Phase 5: Supabase Edge Function for CDP Proxy
```typescript
// New file: /supabase/functions/cdp-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Validate API key
  const apiKey = req.headers.get('X-API-Key');
  const {data: validKey} = await supabase
    .from('api_keys')
    .select('id')
    .eq('key', apiKey)
    .single();
    
  if (!validKey) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), {status: 401});
  }
  
  // Get CDP integration config
  const {data: integration} = await supabase
    .from('cdp_integrations')
    .select('*')
    .eq('is_active', true)
    .single();
    
  if (!integration) {
    return new Response(JSON.stringify({error: 'No active CDP integration'}), {status: 404});
  }
  
  // Decrypt credentials (using Supabase vault)
  const credentials = await decryptCredentials(integration.credentials_encrypted);
  
  // Extract customer ID from request
  const {customer_id} = await req.json();
  
  // Make CDP API call
  const cdpUrl = `https://customer360.exacaster.com/courier/api/v1/workspaces/${integration.config.workspace_id}/resources/${integration.config.resource_id}?userId=${customer_id}&page=0&size=1`;
  
  const cdpResponse = await fetch(cdpUrl, {
    headers: {
      'Authorization': `Bearer ${credentials.bearer_token}`,
      'Accept': 'application/json'
    }
  });
  
  // Log request
  await supabase.from('cdp_request_logs').insert({
    integration_id: integration.id,
    customer_id,
    request_url: cdpUrl,
    response_status: cdpResponse.status,
    response_time_ms: Date.now() - startTime
  });
  
  // Return transformed response
  const data = await cdpResponse.json();
  return new Response(JSON.stringify(transformCDPResponse(data[0])), {
    headers: {'Content-Type': 'application/json'}
  });
});
```

## 5. Task Execution Order

1. **Database Setup** (30 min)
   - Create migration file: `/supabase/migrations/011_cdp_integrations.sql`
   - Run migration
   - Test table creation

2. **Admin Panel Integration Tab** (2 hours)
   - Create `IntegrationsTab.tsx` component
   - Add tab to Admin App navigation
   - Implement CRUD operations for integrations
   - Add encryption for credentials

3. **CDP Service Implementation** (2 hours)
   - Create CDP service class
   - Implement caching mechanism
   - Add response transformation
   - Handle errors and timeouts

4. **Supabase Edge Function** (1 hour)
   - Create CDP proxy function
   - Implement security checks
   - Add request logging
   - Deploy function

5. **Widget Customer ID Handling** (1.5 hours)
   - Implement multi-source customer ID acquisition
   - Add manual entry UI component
   - Update widget state management
   - Test all acquisition methods

6. **Integration Testing** (1 hour)
   - Test with mock Exacaster API
   - Verify fallback scenarios
   - Performance testing
   - End-to-end flow validation

7. **Documentation & Polish** (30 min)
   - Update API documentation
   - Add integration guide
   - Update environment variables

## 6. Validation Gates

### Unit Tests
```bash
# Run unit tests for CDP service
npm run test:unit -- cdp.service.test.ts

# Test widget customer ID acquisition
npm run test:unit -- customer-id.test.ts

# Test admin integration component
npm run test:unit -- IntegrationsTab.test.tsx
```

### Integration Tests
```bash
# Test CDP API integration
npm run test:integration -- cdp-integration.test.ts

# Test end-to-end flow
npm run test:e2e -- customer-profile-flow.test.ts
```

### Manual Testing Checklist
- [ ] Can create new CDP integration in admin
- [ ] Can test connection to Exacaster API
- [ ] Widget acquires customer ID from JS variable
- [ ] Widget acquires customer ID from URL parameter
- [ ] Widget acquires customer ID from cookie
- [ ] Manual customer ID entry works
- [ ] CDP data appears in widget UI
- [ ] Fallback works when CDP unavailable
- [ ] Response time < 1 second
- [ ] Credentials are encrypted in database

### Performance Benchmarks
```typescript
// Expected metrics
const performanceTargets = {
  cdpResponseTime: 1000, // < 1 second
  cacheHitRate: 0.6,     // > 60%
  errorRate: 0.01,        // < 1%
  fallbackActivation: 50 // < 50ms to activate fallback
};
```

## 7. Error Handling

### CDP Unavailable
```typescript
try {
  const cdpData = await cdpService.fetchCustomer360(customerId);
  return cdpData;
} catch (error) {
  console.warn('CDP unavailable, using fallback', error);
  // Mark customer profile as unavailable
  return {
    customer_id: customerId,
    cdp_available: false,
    fallback_reason: error.message
  };
}
```

### Invalid Credentials
```typescript
if (response.status === 401) {
  // Deactivate integration
  await supabase
    .from('cdp_integrations')
    .update({
      is_active: false,
      test_status: 'failed',
      last_error: 'Invalid credentials'
    })
    .eq('id', integrationId);
    
  // Notify admin
  await notifyAdmin('CDP Integration Failed: Invalid Credentials');
}
```

## 8. Security Requirements

### Credential Encryption
```typescript
// Use Supabase Vault for encryption
const encryptCredentials = async (credentials: any): Promise<string> => {
  const {data, error} = await supabase.rpc('vault_encrypt', {
    data: JSON.stringify(credentials),
    key_name: 'cdp_credentials_key'
  });
  
  if (error) throw new Error('Failed to encrypt credentials');
  return data;
};
```

### API Key Validation
- All CDP requests must include valid Porta Futuri API key
- Rate limiting applies to CDP requests
- Audit log all CDP queries

## 9. Migration Path

### For Existing Users
1. Default to CSV-based customer data (current behavior)
2. Show "Connect CDP" prompt in admin panel
3. Gradual rollout with feature flag

### Feature Flag
```typescript
const CDP_ENABLED = process.env.FEATURE_CDP_ENABLED === 'true';

if (CDP_ENABLED) {
  // Show integrations tab
  // Enable CDP fetching
}
```

## 10. Documentation Updates

### Environment Variables
```env
# CDP Integration
EXACASTER_WORKSPACE_ID=your_workspace_id
EXACASTER_RESOURCE_ID=your_resource_id
EXACASTER_BEARER_TOKEN=your_bearer_token
EXACASTER_API_URL=https://customer360.exacaster.com/courier/api/v1
FEATURE_CDP_ENABLED=true
CDP_CACHE_TTL=300
CDP_REQUEST_TIMEOUT=2000
```

### Admin Guide
1. Navigate to Admin Panel > Integrations
2. Click "Add Integration"
3. Select "Exacaster CVM Platform"
4. Enter configuration details
5. Test connection
6. Save and activate

### Widget Integration Guide
```javascript
// Option 1: Pass customer ID via JavaScript
window.PortaFuturi = {
  customerId: 'CUST123'
};

// Option 2: Pass via URL
// https://example.com?customer_id=CUST123

// Option 3: Set cookie
document.cookie = "porta_futuri_customer_id=CUST123; path=/";
```

## 11. Rollback Plan

If issues arise:
1. Disable CDP integration via feature flag
2. System automatically falls back to CSV data
3. No data loss as CDP is read-only
4. Can re-enable after fixes

## 12. Success Metrics

### Technical Metrics
- CDP integration success rate > 95%
- Response time P95 < 1 second
- Cache hit rate > 60%
- Zero credential leaks

### Business Metrics
- Recommendation CTR increase by 25%
- Customer profile completeness > 80%
- Integration adoption rate > 50% in first month

## 13. References

### Internal Code References
- Admin Panel: `/src/admin/App.tsx`
- Widget Configuration: `/src/admin/components/WidgetConfiguration.tsx`
- Customer Types: `/src/shared/types/customer.types.ts`
- Database Migrations: `/supabase/migrations/`
- Widget Entry: `/src/widget/index.tsx`

### External Documentation
- Supabase Vault: https://supabase.com/docs/guides/database/vault
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- React Query: https://tanstack.com/query/latest
- TypeScript Handbook: https://www.typescriptlang.org/docs/

### API Documentation
- Exacaster CVM Platform: Contact integration team for latest docs
- Expected endpoint: `GET /courier/api/v1/workspaces/{workspace_id}/resources/{resource_id}`

## Quality Score: 9/10

**Confidence Level**: This PRP provides comprehensive context for one-pass implementation. The only uncertainty is the exact Exacaster API response format in production, which is handled through robust error handling and transformation logic.

**Risk Areas**:
- Exacaster API availability (mitigated by fallback)
- Credential security (mitigated by Supabase Vault)
- Performance at scale (mitigated by caching)

---

*This PRP is ready for execution. All necessary context, patterns, and implementation details are included for successful one-pass implementation.*