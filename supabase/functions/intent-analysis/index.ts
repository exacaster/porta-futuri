import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { AIIntentService } from '../_shared/intent-service.ts';

interface IntentAnalysisRequest {
  session_id: string;
  browsing_history: ContextEvent[];
  customer_profile?: CustomerProfile;
  interaction_count: number;
}

interface ContextEvent {
  timestamp: string;
  event_type: 'page_view' | 'product_view' | 'search' | 'cart_action' | 'purchase' | 'interaction';
  session_id: string;
  product_id?: string;
  category_viewed?: string;
  search_query?: string;
  cart_action?: 'add' | 'remove' | 'update_quantity';
  url?: string;
  page_url?: string;
  page_duration?: number;
  quantity?: number;
  price?: number;
  referrer?: string;
  device_type?: string;
}

interface CustomerProfile {
  customer_id?: string;
  cdp_data?: {
    cdp_available: boolean;
    last_updated?: string;
    version?: number;
    fallback_reason?: string;
    fields?: Record<string, {
      value: any;
      type: string;
      display_name?: string;
    }>;
    [key: string]: any;
  };
  age_group?: string;
  gender?: string;
  location?: string;
  purchase_history?: string;
  preferences?: string;
  lifetime_value?: number;
  segment?: string;
  last_purchase_date?: string;
  engagement_score?: number;
  [key: string]: any;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log request details
    console.log('Intent Analysis Function called');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    // Parse request body
    const { 
      session_id, 
      browsing_history, 
      customer_profile, 
      interaction_count 
    }: IntentAnalysisRequest = await req.json();

    console.log('Session ID:', session_id);
    console.log('Browsing History Length:', browsing_history?.length || 0);
    console.log('Interaction Count:', interaction_count);
    console.log('Customer Profile Available:', !!customer_profile);

    // Validate required fields
    if (!session_id) {
      throw new Error('session_id is required');
    }

    if (!browsing_history || browsing_history.length === 0) {
      throw new Error('browsing_history cannot be empty');
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Create service instance
    const intentService = new AIIntentService(geminiApiKey);

    // Analyze intent
    const intentAnalysis = await intentService.analyzeIntent({
      browsingHistory: browsing_history,
      customerProfile: customer_profile,
      interactionCount: interaction_count,
      sessionId: session_id
    });

    console.log('Intent analysis successful:', {
      primary_interest: intentAnalysis.intent.primary_interest,
      confidence: intentAnalysis.intent.confidence
    });

    // Return the analysis
    return new Response(
      JSON.stringify(intentAnalysis),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Intent analysis error:', error);
    
    // Detailed error logging
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });

    // Return error response
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to analyze intent',
        timestamp: new Date().toISOString(),
        fallback_available: true
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: error.message?.includes('required') ? 400 : 500
      }
    );
  }
});