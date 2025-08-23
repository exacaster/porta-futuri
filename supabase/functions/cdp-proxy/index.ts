import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RequestBody {
  action?: 'fetch' | 'test';
  customer_id?: string;
  config?: {
    workspace_id: string;
    resource_id: string;
    api_url: string;
    bearer_token?: string;
  };
}

interface CDPResponse {
  userIdType: string;
  userId: string;
  dt: string;
  has_amazon_prime: number;
  has_hbo: number;
  has_netflix: number;
  home_subscriptions_count_daily: number;
  mobile_subscriptions_count_daily: number;
  mobile_subscriptions_revenue: number;
  current_phone: string;
  version: number;
  [key: string]: any;
}

// Helper functions for dynamic field transformation
function transformAllFields(rawData: CDPResponse): Record<string, any> {
  const fields: Record<string, any> = {};
  
  Object.entries(rawData).forEach(([key, value]) => {
    // Skip metadata
    if (['userIdType', 'userId', 'dt', 'version'].includes(key)) return;
    
    fields[key] = {
      value,
      type: detectFieldType(value),
      display_name: generateDisplayName(key)
    };
  });
  
  return fields;
}

function detectFieldType(value: any): string {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
  return 'string';
}

function generateDisplayName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Parse request body first to check action
    const body: RequestBody = await req.json();
    const action = body.action || 'fetch';
    
    // Skip API key validation for test action (it's invoked from admin panel)
    if (action !== 'test') {
      // Validate API key for non-test actions
      const apiKey = req.headers.get('X-API-Key');
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Missing API key' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { data: validKey } = await supabase
        .from('api_keys')
        .select('id, rate_limit')
        .eq('key', apiKey)
        .eq('is_active', true)
        .single();

      if (!validKey) {
        return new Response(
          JSON.stringify({ error: 'Invalid or inactive API key' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Handle test action
    if (action === 'test' && body.config) {
      return await handleTestConnection(body.config, supabase);
    }

    // Handle fetch action
    if (action === 'fetch' && body.customer_id) {
      return await handleFetchCustomer(body.customer_id, supabase, startTime);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or missing parameters' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('CDP Proxy Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleTestConnection(
  config: RequestBody['config'],
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  if (!config || !config.workspace_id || !config.resource_id) {
    return new Response(
      JSON.stringify({ 
        error: 'Missing required configuration',
        success: false 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const testUrl = `${config.api_url}/workspaces/${config.workspace_id}/resources/${config.resource_id}?userId=TEST_USER&page=0&size=1`;
    
    // Log the request details for debugging
    console.log('CDP Test Request Details:');
    console.log('URL:', testUrl);
    console.log('Bearer Token Length:', config.bearer_token?.length || 0);
    console.log('Bearer Token First 10 chars:', config.bearer_token?.substring(0, 10) || 'NOT PROVIDED');
    console.log('Full Headers:', {
      'Authorization': `Bearer ${config.bearer_token?.substring(0, 10)}...`,
      'Accept': 'application/json'
    });
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.bearer_token}`,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    console.log('CDP Test Response Status:', response.status);
    console.log('CDP Test Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.status === 401) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Invalid credentials - please check your bearer token'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (response.status === 404) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Invalid workspace or resource ID'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: `API returned status ${response.status}`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Connection successful'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Connection timeout - API took too long to respond'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: `Connection failed: ${error.message}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleFetchCustomer(
  customerId: string,
  supabase: ReturnType<typeof createClient>,
  startTime: number
): Promise<Response> {
  try {
    // Get active CDP integration
    const { data: integration, error: integrationError } = await supabase
      .from('cdp_integrations')
      .select('*')
      .eq('is_active', true)
      .eq('provider', 'exacaster')
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ 
          error: 'No active CDP integration',
          customer_id: customerId,
          cdp_available: false,
          fallback_reason: 'No active CDP integration configured'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Decrypt credentials (in production, use proper encryption)
    let credentials: { bearer_token?: string } = {};
    if (integration.credentials_encrypted) {
      try {
        console.log('Attempting to decrypt credentials...');
        console.log('credentials_encrypted length:', integration.credentials_encrypted.length);
        console.log('credentials_encrypted preview:', integration.credentials_encrypted.substring(0, 20));
        
        const decoded = atob(integration.credentials_encrypted);
        console.log('Base64 decoded, length:', decoded.length);
        console.log('Decoded content:', decoded.substring(0, 100));
        
        if (!decoded || decoded.length === 0) {
          throw new Error('Decoded credentials are empty');
        }
        
        credentials = JSON.parse(decoded);
        console.log('CDP Credentials parsed successfully');
        console.log('Bearer token exists:', !!credentials.bearer_token);
        console.log('Bearer token length:', credentials.bearer_token?.length || 0);
        console.log('Bearer token preview:', credentials.bearer_token?.substring(0, 20) || 'N/A');
      } catch (err) {
        console.error('Failed to decrypt credentials:', err);
        console.error('Error message:', err.message);
        console.error('Raw credentials_encrypted:', integration.credentials_encrypted);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to decrypt credentials',
            customer_id: customerId,
            cdp_available: false,
            fallback_reason: 'Failed to decrypt CDP credentials'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      console.error('No credentials_encrypted field in integration');
      return new Response(
        JSON.stringify({ 
          error: 'No CDP credentials configured',
          customer_id: customerId,
          cdp_available: false,
          fallback_reason: 'No CDP credentials in database'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Build CDP URL
    const cdpUrl = `${integration.config.api_url}/workspaces/${integration.config.workspace_id}/resources/${integration.config.resource_id}?userId=${encodeURIComponent(customerId)}&page=0&size=1`;

    // Log the request for debugging
    console.log('CDP Fetch Request:');
    console.log('URL:', cdpUrl);
    console.log('Bearer token being used:', credentials.bearer_token ? `${credentials.bearer_token.substring(0, 20)}...` : 'MISSING');

    // Make CDP API call with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const cdpResponse = await fetch(cdpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.bearer_token}`,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;

    // Log request
    await supabase.from('cdp_request_logs').insert({
      integration_id: integration.id,
      customer_id: customerId,
      request_url: cdpUrl,
      response_status: cdpResponse.status,
      response_time_ms: responseTime,
      error_message: cdpResponse.ok ? null : `HTTP ${cdpResponse.status}`
    });

    if (!cdpResponse.ok) {
      // Update integration status if authentication failed
      if (cdpResponse.status === 401) {
        await supabase
          .from('cdp_integrations')
          .update({
            is_active: false,
            test_status: 'failed',
            last_error: 'Invalid credentials',
            last_tested_at: new Date().toISOString()
          })
          .eq('id', integration.id);
      }

      return new Response(
        JSON.stringify({ 
          error: `CDP API error: ${cdpResponse.status}`,
          customer_id: customerId,
          cdp_available: false,
          fallback_reason: `CDP API returned ${cdpResponse.status}`
        }),
        { 
          status: cdpResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse and transform response
    const rawData: CDPResponse[] = await cdpResponse.json();
    const customerData = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!customerData) {
      return new Response(
        JSON.stringify({ 
          customer_id: customerId,
          cdp_available: false,
          fallback_reason: 'Customer not found in CDP'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Transform response dynamically
    const transformedData = {
      cdp_available: true,
      last_updated: customerData.dt,
      version: customerData.version,
      // Pass through all fields dynamically
      fields: transformAllFields(customerData),
      response_time_ms: responseTime
    };

    return new Response(
      JSON.stringify(transformedData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('CDP Fetch Error:', error);
    
    const errorMessage = error.name === 'AbortError' 
      ? 'CDP request timeout (>2s)' 
      : error.message;

    // Log error
    await supabase.from('cdp_request_logs').insert({
      integration_id: null,
      customer_id: customerId,
      request_url: '',
      response_status: 0,
      response_time_ms: Date.now() - startTime,
      error_message: errorMessage
    });

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        customer_id: customerId,
        cdp_available: false,
        fallback_reason: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}