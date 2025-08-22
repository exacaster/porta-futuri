import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { AIRecommendationService } from '../_shared/ai-service.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Import types
interface RecommendationRequest {
  session_id: string;
  query?: string;
  conversation_history?: any[];
  context: any;
  customer_data: {
    csv_hash: string;
    profile_loaded: boolean;
    context_loaded: boolean;
  };
  products?: any[];
  customer_profile?: any;
  context_events?: any[];
}

interface RecommendationResponse {
  recommendations: any[];
  message: string;
  session_id: string;
  response_time: number;
  cache_hit: boolean;
  fallback_used: boolean;
}

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

serve(async (req: Request) => {
  const startTime = Date.now();

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate API key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');

    // Check API key in database
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('id, rate_limit')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const currentMinute = new Date();
    currentMinute.setSeconds(0, 0);
    
    const { data: rateLimitData } = await supabase
      .from('rate_limits')
      .select('request_count')
      .eq('api_key_id', apiKeyData.id)
      .eq('minute_bucket', currentMinute.toISOString())
      .single();

    const currentCount = rateLimitData?.request_count || 0;
    
    if (currentCount >= apiKeyData.rate_limit) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retry_after: 60 - new Date().getSeconds()
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(apiKeyData.rate_limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor((currentMinute.getTime() + 60000) / 1000))
          } 
        }
      );
    }

    // Update rate limit counter
    if (rateLimitData) {
      await supabase
        .from('rate_limits')
        .update({ request_count: currentCount + 1 })
        .eq('api_key_id', apiKeyData.id)
        .eq('minute_bucket', currentMinute.toISOString());
    } else {
      await supabase
        .from('rate_limits')
        .insert({
          api_key_id: apiKeyData.id,
          minute_bucket: currentMinute.toISOString(),
          request_count: 1
        });
    }

    // Parse request body
    const body: RecommendationRequest = await req.json();

    // Check cache
    const cacheKey = generateCacheKey(body);
    const cachedResponse = getFromCache(cacheKey);
    
    if (cachedResponse) {
      // Update rate limit counter even for cached responses
      await supabase
        .from('rate_limits')
        .update({ request_count: currentCount + 1 })
        .eq('api_key_id', apiKeyData.id)
        .eq('minute_bucket', currentMinute.toISOString());

      return new Response(
        JSON.stringify({
          ...cachedResponse,
          cache_hit: true,
          response_time: Date.now() - startTime
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(apiKeyData.rate_limit),
            'X-RateLimit-Remaining': String(apiKeyData.rate_limit - currentCount - 1),
            'X-Cache': 'HIT'
          } 
        }
      );
    }

    // Get or create session
    let sessionData = null;
    if (body.session_id) {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', body.session_id)
        .eq('is_active', true)
        .single();
      
      sessionData = data;
    }

    if (!sessionData) {
      // Create new session
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          api_key_id: apiKeyData.id,
          session_id: body.session_id,
          customer_data: body.customer_profile || {},
          context_data: body.context || {},
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();
      
      if (!error) {
        sessionData = data;
      }
    }

    // Generate recommendations using AI (simplified for now)
    const recommendations = await generateRecommendations(body);

    // Build full response object
    const fullResponse = {
      ...recommendations,
      session_id: body.session_id,
      response_time: Date.now() - startTime,
      cache_hit: false
    };

    // Cache the full response (without response_time and cache_hit which are dynamic)
    setCache(cacheKey, {
      recommendations: recommendations.recommendations,
      message: recommendations.message,
      session_id: body.session_id,
      fallback_used: recommendations.fallback_used
    });

    // Log recommendation
    if (sessionData) {
      await supabase
        .from('recommendation_logs')
        .insert({
          session_id: sessionData.id,
          query: body.query,
          recommendations: recommendations.recommendations,
          response_time_ms: Date.now() - startTime,
          cache_hit: false,
          fallback_used: recommendations.fallback_used
        });
    }

    // Return response
    return new Response(
      JSON.stringify(fullResponse),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(apiKeyData.rate_limit),
          'X-RateLimit-Remaining': String(apiKeyData.rate_limit - currentCount - 1),
          'X-Cache': 'MISS'
        } 
      }
    );

  } catch (error) {
    console.error('Error in recommendations endpoint:', error);
    
    // Return static fallback recommendations
    const fallbackRecommendations = getStaticRecommendations();
    
    return new Response(
      JSON.stringify({
        recommendations: fallbackRecommendations,
        message: 'Here are some popular products you might like',
        session_id: '',
        response_time: Date.now() - startTime,
        cache_hit: false,
        fallback_used: true
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Helper functions
function generateCacheKey(request: RecommendationRequest): string {
  const parts = [
    request.query || 'default',
    request.customer_data.csv_hash || 'no-hash',
    JSON.stringify(request.context)
  ];
  return parts.join(':');
}

function getFromCache(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: any): void {
  // Limit cache size
  if (cache.size >= 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

async function generateRecommendations(request: RecommendationRequest): Promise<any> {
  try {
    // Get products from database if not provided
    let products = request.products || [];
    if (products.length === 0) {
      const { data: dbProducts } = await supabase
        .from('products')
        .select('*')
        .order('ratings', { ascending: false })
        .limit(500);
      
      products = dbProducts || [];
    }

    // Check if we have a Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    console.log('Gemini API key exists:', !!geminiApiKey);
    console.log('Gemini API key length:', geminiApiKey?.length || 0);
    console.log('Gemini API key starts with:', geminiApiKey?.substring(0, 10) || 'N/A');
    console.log('Number of products:', products.length);
    console.log('Query:', request.query);
    
    if (geminiApiKey && products.length > 0) {
      // Use AI service for recommendations
      console.log('Using AI service for recommendations...');
      console.log('Creating AI service with API key length:', geminiApiKey.length);
      const aiService = new AIRecommendationService(geminiApiKey);
      
      const result = await aiService.generateRecommendations({
        query: request.query || '',
        products: products,
        customerProfile: request.customer_profile,
        conversationHistory: request.conversation_history,
        context: request.context
      });
      
      console.log('AI service result:', { 
        hasRecommendations: result.recommendations?.length > 0,
        fallbackUsed: result.fallback_used,
        message: result.message?.substring(0, 50) + '...'
      });
      
      return result;
    } else {
      // Fallback to simple recommendations if no API key or no products
      console.log('Using fallback recommendations - API key exists:', !!geminiApiKey, 'Products:', products.length);
      return getFallbackRecommendations(request, products);
    }
  } catch (error) {
    console.error('AI generation failed, using fallback:', error);
    return getFallbackRecommendations(request, request.products || []);
  }
}

function getFallbackRecommendations(request: RecommendationRequest, products: any[]): any {
  const topProducts = products
    .filter((p: any) => p.stock_status === 'in_stock')
    .sort((a: any, b: any) => (b.ratings || 0) - (a.ratings || 0))
    .slice(0, 5);

  return {
    recommendations: topProducts.map((p: any, index: number) => ({
      ...p,
      reasoning: `Highly rated product in ${p.category}`,
      match_score: 90 - (index * 10),
      position: index + 1
    })),
    message: request.query 
      ? `Based on your search for "${request.query}", here are my recommendations:`
      : 'Here are some products you might like:',
    intent: {
      understood: request.query || 'General browsing',
      confidence: 0.5
    },
    fallback_used: true
  };
}

function getStaticRecommendations(): any[] {
  // Static fallback recommendations
  return [
    {
      product_id: 'FALLBACK_1',
      name: 'Popular Product 1',
      category: 'Electronics',
      price: 99.99,
      description: 'A popular product in our catalog',
      stock_status: 'in_stock',
      reasoning: 'Bestseller in Electronics',
      match_score: 80
    },
    {
      product_id: 'FALLBACK_2',
      name: 'Popular Product 2',
      category: 'Home & Garden',
      price: 49.99,
      description: 'Customer favorite',
      stock_status: 'in_stock',
      reasoning: 'Highly rated by customers',
      match_score: 75
    },
    {
      product_id: 'FALLBACK_3',
      name: 'Popular Product 3',
      category: 'Fashion',
      price: 79.99,
      description: 'Trending item',
      stock_status: 'in_stock',
      reasoning: 'Currently trending',
      match_score: 70
    }
  ];
}