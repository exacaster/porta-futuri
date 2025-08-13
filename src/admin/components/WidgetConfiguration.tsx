import React, { useState, useEffect } from 'react';
import { Copy, Plus, Trash2, RefreshCw, Check, AlertCircle } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [showWidgetPreview, setShowWidgetPreview] = useState(false);
  
  // Widget configuration options
  const [widgetConfig, setWidgetConfig] = useState({
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    apiUrl: window.location.origin.includes('localhost') 
      ? 'http://localhost:54321/functions/v1'
      : 'https://your-domain.com/api/v1'
  });

  useEffect(() => {
    // Small delay to ensure Supabase client is ready
    const timer = setTimeout(() => {
      fetchApiKeys();
    }, 100);
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching API keys using Supabase client...');
      
      // First check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'Authenticated' : 'Not authenticated');
      
      // Use Supabase client with proper error handling
      const { data, error, status } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error, status });

      if (error) {
        // Check if it's an auth issue
        if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          console.error('Authentication issue, trying without RLS...');
          // For development, we've disabled RLS on api_keys table
          throw new Error('Authentication error: ' + error.message);
        }
        throw error;
      }
      
      setApiKeys(data || []);
      
      // Select first active key by default
      const activeKey = data?.find((k: ApiKey) => k.is_active);
      if (activeKey) {
        setSelectedKey(activeKey.key);
      }
    } catch (err: any) {
      console.error('Error fetching API keys:', err);
      
      // Fallback to direct fetch if Supabase client fails
      try {
        console.log('Falling back to direct fetch...');
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rvlbbgdkgneobvlyawix.supabase.co';
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const response = await fetch(`${supabaseUrl}/rest/v1/api_keys?select=*&order=created_at.desc`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setApiKeys(data || []);
          const activeKey = data?.find((k: ApiKey) => k.is_active);
          if (activeKey) {
            setSelectedKey(activeKey.key);
          }
          setError('Note: Using direct connection. Some features may be limited.');
        } else {
          throw new Error(`Fallback also failed: ${response.statusText}`);
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        // Use hardcoded fallback as last resort
        setApiKeys([{
          id: 'default-1',
          key: 'dev_key_porta_futuri_2024',
          name: 'Development Key',
          rate_limit: 100,
          is_active: true,
          created_at: new Date().toISOString()
        }]);
        setSelectedKey('dev_key_porta_futuri_2024');
        setError('Could not connect to database. Using local defaults.');
      }
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
      
      // Use Supabase client for better security and type safety
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

      if (error) {
        throw error;
      }
      
      setApiKeys([data, ...apiKeys]);
      setSelectedKey(data.key);
      setNewKeyName('');
      setShowNewKeyForm(false);
      
      onApiKeyAction?.('create', data.id);
    } catch (error: any) {
      console.error('Error creating API key:', error);
      alert(`Failed to create API key: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleKeyStatus = async (key: ApiKey) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !key.is_active })
        .eq('id', key.id);

      if (error) {
        throw error;
      }
      
      setApiKeys(apiKeys.map(k => 
        k.id === key.id ? { ...k, is_active: !k.is_active } : k
      ));
      
      onApiKeyAction?.('toggle', key.id);
    } catch (error: any) {
      console.error('Error toggling API key:', error);
      alert(`Failed to toggle API key: ${error.message || 'Unknown error'}`);
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

      if (error) {
        throw error;
      }
      
      setApiKeys(apiKeys.filter(k => k.id !== key.id));
      if (selectedKey === key.key) {
        setSelectedKey('');
      }
      
      onApiKeyAction?.('delete', key.id);
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      alert(`Failed to delete API key: ${error.message || 'Unknown error'}`);
    }
  };

  const getEmbedCode = () => {
    const scriptUrl = window.location.origin.includes('localhost')
      ? `${window.location.origin}/widget-loader.js`
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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading widget configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 mb-4">
          <AlertCircle className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-red-600 font-semibold">Error Loading Configuration</p>
        <p className="text-gray-600 mt-2">{error}</p>
        <button
          onClick={() => fetchApiKeys()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Retry
        </button>
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Live Preview</h2>
          <p className="text-sm text-gray-600">Click the widget button to open the chat</p>
        </div>
        <div className="relative bg-gray-100 rounded h-96 flex items-center justify-center">
          <div className="text-gray-500">
            <p>Widget preview will appear here</p>
            <p className="text-sm mt-2">Position: {widgetConfig.position}</p>
          </div>
          
          {/* Interactive widget button */}
          <div
            onClick={() => setShowWidgetPreview(!showWidgetPreview)}
            className={`absolute w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110`}
            style={{
              backgroundColor: widgetConfig.primaryColor,
              ...(widgetConfig.position.includes('bottom') ? { bottom: '20px' } : { top: '20px' }),
              ...(widgetConfig.position.includes('right') ? { right: '20px' } : { left: '20px' }),
            }}
            title="Click to toggle preview chat window"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          
          {/* Preview Chat Window */}
          {showWidgetPreview && (
            <div
              className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all"
              style={{
                width: '380px',
                height: '500px',
                ...(widgetConfig.position.includes('bottom') ? { bottom: '80px' } : { top: '80px' }),
                ...(widgetConfig.position.includes('right') ? { right: '20px' } : { left: '20px' }),
              }}
            >
              {/* Chat Header */}
              <div 
                className="flex items-center justify-between p-4 border-b"
                style={{ backgroundColor: widgetConfig.primaryColor }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Porta Futuri Assistant</h3>
                    <p className="text-white/80 text-xs">Online</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWidgetPreview(false);
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Chat Body */}
              <div className="p-4 h-[380px] overflow-y-auto bg-gray-50">
                <div className="space-y-4">
                  {/* Welcome Message */}
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: widgetConfig.primaryColor }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-800">👋 Hello! I'm your AI shopping assistant.</p>
                        <p className="text-sm text-gray-800 mt-2">I can help you find the perfect products based on your needs. What are you looking for today?</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Just now</p>
                    </div>
                  </div>
                  
                  {/* Example User Message */}
                  <div className="flex items-start space-x-2 justify-end">
                    <div className="flex-1 text-right">
                      <div className="bg-blue-500 text-white rounded-lg p-3 shadow-sm inline-block">
                        <p className="text-sm">I'm looking for a laptop for programming</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Just now</p>
                    </div>
                  </div>
                  
                  {/* Example Assistant Response */}
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: widgetConfig.primaryColor }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-sm text-gray-800">Great choice! For programming, I'd recommend looking at laptops with:</p>
                        <ul className="text-sm text-gray-800 mt-2 space-y-1">
                          <li>• At least 16GB RAM</li>
                          <li>• SSD storage (512GB+)</li>
                          <li>• Good keyboard quality</li>
                          <li>• Long battery life</li>
                        </ul>
                        <p className="text-sm text-gray-800 mt-2">Would you like to see some specific recommendations?</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Just now</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Chat Input */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ focusRingColor: widgetConfig.primaryColor }}
                    disabled
                  />
                  <button
                    className="p-2 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: widgetConfig.primaryColor }}
                    disabled
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">Preview Mode - Not connected</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};