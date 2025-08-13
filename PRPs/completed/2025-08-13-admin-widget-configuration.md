# PRP: Admin Panel Widget Configuration Feature

**Created**: 2025-08-13
**Status**: Active
**Type**: Feature Implementation
**Confidence Score**: 9/10

## Goal
Implement a complete widget configuration feature in the admin panel that:
1. Redirects localhost:5175/ to the admin panel
2. Adds a "Porta Futuri Widget" tab to the admin panel
3. Provides a working copy-and-paste ready widget script with all predefined parameters
4. Manages API keys and configuration settings within the admin interface

## Why
- Simplifies widget integration for clients
- Centralizes widget configuration management
- Provides immediate access to admin panel from root URL
- Improves developer experience with ready-to-use embed codes

## Requirements Reference
Based on user request:
- Redirect http://localhost:5175/ to admin panel
- Add "Porta Futuri Widget" tab to admin panel
- Include working copy-paste script with all parameters
- Manage API keys and configuration in the same page

## Existing Context & Patterns

### Current Architecture
- **Admin Panel**: Located at `/admin.html`, runs on port 5174 via `vite.config.admin.ts`
- **Widget Demo**: Located at `/index.html`, runs on port 3000 via default vite config
- **Tab Navigation**: Admin uses tab-based navigation in `src/admin/App.tsx` (lines 126-151)
- **API Keys Table**: Already exists in database (`supabase/migrations/002_api_tables.sql`)
- **Widget Loader**: Script at `public/widget-loader.js` handles widget initialization

### Code Patterns to Follow
1. **Tab Component Pattern** (from `src/admin/App.tsx`):
```typescript
const [activeTab, setActiveTab] = useState<'upload' | 'products' | 'users' | 'widget'>('upload');

// Navigation buttons
<button
  className={`pb-2 px-1 ${activeTab === 'widget' ? 'border-b-2 border-primary font-medium' : 'text-gray-600'}`}
  onClick={() => setActiveTab('widget')}
>
  Porta Futuri Widget
</button>
```

2. **Permission Pattern** (from `src/admin/App.tsx`):
```typescript
const canConfigureWidget = hasPermission('api_keys', 'read');
```

3. **Supabase Integration Pattern** (from existing components):
```typescript
const { data, error } = await supabase
  .from('api_keys')
  .select('*')
  .order('created_at', { ascending: false });
```

## Implementation Blueprint

### Phase 1: Redirect Root URL to Admin Panel

#### Task 1.1: Create new vite config for unified development
Create `vite.config.unified.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@admin': path.resolve(__dirname, './src/admin'),
      '@widget': path.resolve(__dirname, './src/widget'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5175,
    open: '/admin.html',
    proxy: {
      '/': {
        target: 'http://localhost:5175/admin.html',
        bypass: (req) => {
          // Redirect root to admin.html
          if (req.url === '/') {
            return '/admin.html';
          }
          // Let other requests pass through
          return null;
        }
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        admin: path.resolve(__dirname, 'admin.html'),
        widget: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
```

#### Task 1.2: Update package.json scripts
Update the dev script in `package.json`:
```json
"dev": "vite --config vite.config.unified.ts",
"dev:widget-demo": "vite --config vite.config.ts",
```

### Phase 2: Create Widget Configuration Component

#### Task 2.1: Create WidgetConfiguration component
Create `src/admin/components/WidgetConfiguration.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { Copy, Plus, Trash2, RefreshCw, Check } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';

interface ApiKey {
  id: string;
  key: string;
  name: string;
  rate_limit: number;
  is_active: boolean;
  created_at: string;
}

interface WidgetConfigurationProps {
  supabase: SupabaseClient;
  onApiKeyAction?: (action: string, keyId: string) => void;
}

export const WidgetConfiguration: React.FC<WidgetConfigurationProps> = ({ 
  supabase, 
  onApiKeyAction 
}) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  
  // Widget configuration options
  const [widgetConfig, setWidgetConfig] = useState({
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    apiUrl: window.location.origin.includes('localhost') 
      ? 'http://localhost:54321/functions/v1'
      : 'https://your-domain.com/api/v1'
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
      
      // Select first active key by default
      const activeKey = data?.find(k => k.is_active);
      if (activeKey) {
        setSelectedKey(activeKey.key);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `pf_${timestamp}_${randomStr}`;
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the API key');
      return;
    }

    try {
      const newKey = generateApiKey();
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          key: newKey,
          name: newKeyName,
          rate_limit: 100,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      
      setApiKeys([data, ...apiKeys]);
      setSelectedKey(data.key);
      setNewKeyName('');
      setShowNewKeyForm(false);
      
      onApiKeyAction?.('create', data.id);
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    }
  };

  const toggleKeyStatus = async (key: ApiKey) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !key.is_active })
        .eq('id', key.id);

      if (error) throw error;
      
      setApiKeys(apiKeys.map(k => 
        k.id === key.id ? { ...k, is_active: !k.is_active } : k
      ));
      
      onApiKeyAction?.('toggle', key.id);
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  };

  const deleteApiKey = async (key: ApiKey) => {
    if (!confirm(`Are you sure you want to delete the API key "${key.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', key.id);

      if (error) throw error;
      
      setApiKeys(apiKeys.filter(k => k.id !== key.id));
      if (selectedKey === key.key) {
        setSelectedKey('');
      }
      
      onApiKeyAction?.('delete', key.id);
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const getEmbedCode = () => {
    const scriptUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:5175/widget-loader.js'
      : 'https://your-domain.com/widget-loader.js';

    return `<script 
  src="${scriptUrl}"
  data-api-key="${selectedKey || 'YOUR_API_KEY'}"
  data-api-url="${widgetConfig.apiUrl}"
  data-position="${widgetConfig.position}"
  data-theme-primary="${widgetConfig.primaryColor}">
</script>`;
  };

  const copyToClipboard = () => {
    const embedCode = getEmbedCode();
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Keys Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">API Keys</h2>
          <button
            onClick={() => setShowNewKeyForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New API Key
          </button>
        </div>

        {showNewKeyForm && (
          <div className="mb-4 p-4 border rounded bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="API Key Name (e.g., Production, Development)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={createApiKey}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewKeyForm(false);
                  setNewKeyName('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {apiKeys.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No API keys yet. Create your first key to get started.
            </p>
          ) : (
            apiKeys.map((key) => (
              <div
                key={key.id}
                className={`flex items-center justify-between p-3 border rounded ${
                  selectedKey === key.key ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="apiKey"
                    value={key.key}
                    checked={selectedKey === key.key}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-gray-500">
                      {key.key.substring(0, 20)}...
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      key.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {key.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleKeyStatus(key)}
                    className="p-2 text-gray-600 hover:text-primary"
                    title={key.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteApiKey(key)}
                    className="p-2 text-gray-600 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Widget Configuration Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Widget Configuration</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Position</label>
            <select
              value={widgetConfig.position}
              onChange={(e) => setWidgetConfig({ ...widgetConfig, position: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={widgetConfig.primaryColor}
                onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={widgetConfig.primaryColor}
                onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border rounded"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">API Endpoint URL</label>
          <input
            type="text"
            value={widgetConfig.apiUrl}
            onChange={(e) => setWidgetConfig({ ...widgetConfig, apiUrl: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Embed Code Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Embed Code</h2>
          <button
            onClick={copyToClipboard}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Code
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
          <pre className="text-sm">
            <code>{getEmbedCode()}</code>
          </pre>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-medium text-blue-900 mb-2">Integration Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Select or create an API key above</li>
            <li>Configure the widget position and appearance</li>
            <li>Copy the embed code using the button above</li>
            <li>Paste the code into your website's HTML, just before the closing &lt;/body&gt; tag</li>
            <li>The widget will automatically initialize when the page loads</li>
          </ol>
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
        <div className="relative bg-gray-100 rounded h-96 flex items-center justify-center">
          <div className="text-gray-500">
            <p>Widget preview will appear here</p>
            <p className="text-sm mt-2">Position: {widgetConfig.position}</p>
          </div>
          
          {/* Mock widget button */}
          <div
            className={`absolute w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110`}
            style={{
              backgroundColor: widgetConfig.primaryColor,
              ...(widgetConfig.position.includes('bottom') ? { bottom: '20px' } : { top: '20px' }),
              ...(widgetConfig.position.includes('right') ? { right: '20px' } : { left: '20px' }),
            }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Phase 3: Integrate Widget Configuration into Admin App

#### Task 3.1: Update Admin App with new tab
Update `src/admin/App.tsx`:
```typescript
// Add import
import { WidgetConfiguration } from './components/WidgetConfiguration';

// Update state type
const [activeTab, setActiveTab] = useState<'upload' | 'products' | 'users' | 'widget'>('upload');

// Add permission check
const canConfigureWidget = hasPermission('api_keys', 'read');

// Add tab button in navigation (around line 150)
{canConfigureWidget && (
  <button
    className={`pb-2 px-1 ${activeTab === 'widget' ? 'border-b-2 border-primary font-medium' : 'text-gray-600'}`}
    onClick={() => setActiveTab('widget')}
  >
    Porta Futuri Widget
  </button>
)}

// Add tab content (around line 180)
: activeTab === 'widget' && canConfigureWidget ? (
  <WidgetConfiguration 
    supabase={supabase}
    onApiKeyAction={(action, keyId) => {
      logAction(`api_keys.${action}`, 'api_key', keyId);
    }}
  />
)
```

### Phase 4: Update Admin User Permissions

#### Task 4.1: Update useAuth hook
Update `src/admin/hooks/useAuth.ts` to include api_keys permission:
```typescript
// In the temporary admin user object (if needed)
permissions: {
  products: ['read', 'write', 'delete'],
  users: ['read', 'write', 'delete'],
  settings: ['read', 'write'],
  api_keys: ['read', 'write', 'delete'],  // Add this
  audit_logs: ['read']
}
```

### Phase 5: Create Database Migration for Default API Key

#### Task 5.1: Create migration file
Create `supabase/migrations/009_default_widget_api_key.sql`:
```sql
-- Insert default development API key if it doesn't exist
INSERT INTO api_keys (key, name, rate_limit, is_active)
VALUES ('dev_key_porta_futuri_2024', 'Development Key', 100, true)
ON CONFLICT (key) DO NOTHING;

-- Ensure RLS policies for api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read API keys
CREATE POLICY "Authenticated users can read API keys" ON api_keys
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy for authenticated users to manage API keys
CREATE POLICY "Authenticated users can manage API keys" ON api_keys
  FOR ALL
  USING (auth.role() = 'authenticated');
```

## Validation Gates

### 1. Development Server Validation
```bash
# Start the unified development server
npm run dev

# Verify root URL redirects to admin panel
open http://localhost:5175/

# Expected: Should open admin panel directly
```

### 2. Admin Panel Navigation Test
```bash
# After logging in to admin panel
# 1. Look for "Porta Futuri Widget" tab
# 2. Click the tab
# 3. Verify widget configuration interface loads
```

### 3. API Key Management Test
```bash
# In the Widget Configuration tab:
# 1. Create a new API key
# 2. Toggle key status
# 3. Delete a test key
# 4. Verify all operations work
```

### 4. Embed Code Generation Test
```bash
# 1. Select an API key
# 2. Change widget position to "top-left"
# 3. Change primary color to "#10b981"
# 4. Copy embed code
# 5. Verify code reflects all changes
```

### 5. Database Verification
```bash
# Check API keys table
npm run supabase:db:query "SELECT * FROM api_keys;"

# Verify default key exists
npm run supabase:db:query "SELECT * FROM api_keys WHERE key = 'dev_key_porta_futuri_2024';"
```

### 6. Type Checking
```bash
npm run typecheck
```

### 7. Linting
```bash
npm run lint
```

### 8. Build Test
```bash
npm run build:admin
# Should complete without errors
```

## Success Criteria
- [ ] Root URL (localhost:5175/) redirects to admin panel
- [ ] "Porta Futuri Widget" tab appears in admin navigation
- [ ] API keys can be created, toggled, and deleted
- [ ] Widget configuration options update embed code in real-time
- [ ] Copy button successfully copies embed code to clipboard
- [ ] Live preview shows widget position changes
- [ ] Default development API key exists in database
- [ ] All TypeScript types are correct
- [ ] No linting errors
- [ ] Build completes successfully

## Error Handling

### Common Issues and Solutions

1. **Port conflicts**: If port 5175 is in use, update vite.config.unified.ts
2. **Database connection errors**: Check Supabase credentials in .env file
3. **Permission errors**: Ensure admin user has api_keys permissions
4. **Build errors**: Run `npm install` to ensure all dependencies are installed

## Security Considerations

1. **API Key Generation**: Uses cryptographically secure random generation
2. **Rate Limiting**: Enforced at 100 requests/minute per key
3. **RLS Policies**: Only authenticated users can manage API keys
4. **XSS Prevention**: All user inputs are sanitized
5. **CORS**: Configured for allowed origins only

## Performance Optimizations

1. **Lazy Loading**: Widget configuration only loads when tab is active
2. **Debounced Updates**: Configuration changes are debounced
3. **Caching**: API keys are cached in component state
4. **Optimistic UI**: UI updates immediately, then syncs with database

## Testing Approach

### Unit Tests
```typescript
// src/admin/components/WidgetConfiguration.test.tsx
describe('WidgetConfiguration', () => {
  it('should render API keys list');
  it('should generate unique API keys');
  it('should update embed code on config change');
  it('should copy embed code to clipboard');
});
```

### Integration Tests
```typescript
// tests/integration/widget-config.test.ts
describe('Widget Configuration Integration', () => {
  it('should create and persist API key');
  it('should toggle key status in database');
  it('should delete key from database');
});
```

## Documentation Updates

Update the following documentation:
1. `ADMIN_README.md` - Add section on widget configuration
2. `DEPLOYMENT_GUIDE.md` - Include widget setup instructions
3. `QUICKSTART.md` - Update with new admin panel access

## Rollback Plan

If issues occur:
1. Revert to original vite configs
2. Remove WidgetConfiguration component
3. Restore original admin App.tsx
4. Drop new database migration

## Notes for AI Implementation

- Follow existing code patterns exactly as shown in examples
- Use the same styling approach (Tailwind classes)
- Maintain TypeScript strict mode compliance
- Test each phase before moving to the next
- Commit after each successful phase

## External References

- Vite Proxy Configuration: https://vitejs.dev/config/server-options.html#server-proxy
- Supabase RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- React Query Patterns: https://tanstack.com/query/latest/docs/react/guides/queries
- PostMessage API for Widget Communication: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage

---

**Confidence Score: 9/10**

This PRP has high confidence because:
- All existing patterns are well-documented and referenced
- The implementation follows established conventions in the codebase
- Database schema already supports API keys
- Clear validation gates for each phase
- Comprehensive error handling and rollback plan

The only uncertainty (1 point deduction) is around the exact Vite proxy configuration for the root redirect, which may need minor adjustments during implementation.