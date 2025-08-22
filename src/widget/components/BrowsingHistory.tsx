import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ContextEvent } from '@shared/types/context.types';
import { Clock, TrendingUp, AlertCircle, ShoppingCart, Search, Package } from 'lucide-react';
import { BrowsingIntent } from '../services/eventTracking';

interface BrowsingHistoryProps {
  events: ContextEvent[];
  detectedIntent: BrowsingIntent | null;
  onClearHistory: () => void;
  onClose: () => void;
}

export const BrowsingHistory: React.FC<BrowsingHistoryProps> = ({
  events,
  detectedIntent,
  onClearHistory,
  onClose
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const extractProductName = (url?: string) => {
    if (!url) return 'Unknown Page';
    
    if (url === '/') return 'Home Page';
    if (url === '/cart') return 'Shopping Cart';
    if (url === '/checkout') return 'Checkout';
    
    const match = url.match(/\/[^\/]+\/([^\/]+)$/);
    if (match) {
      return match[1]
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    const categoryMatch = url.match(/^\/([^\/]+)\/?$/);
    if (categoryMatch) {
      return categoryMatch[1]
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + ' Category';
    }
    
    return url;
  };
  
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'product_view':
        return <Package className="w-3 h-3" />;
      case 'cart_action':
        return <ShoppingCart className="w-3 h-3" />;
      case 'search':
        return <Search className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };
  
  const getEventDescription = (event: ContextEvent) => {
    switch (event.event_type) {
      case 'product_view':
        return `Viewed product${event.product_id ? `: ${event.product_id.replace(/-/g, ' ')}` : ''}`;
      case 'cart_action':
        if (event.cart_action === 'add') {
          return `Added to cart${event.product_id ? `: ${event.product_id.replace(/-/g, ' ')}` : ''}`;
        } else if (event.cart_action === 'remove') {
          return `Removed from cart${event.product_id ? `: ${event.product_id.replace(/-/g, ' ')}` : ''}`;
        }
        return 'Cart action';
      case 'search':
        return `Searched for: "${event.search_query}"`;
      case 'page_view':
        return extractProductName(event.page_url);
      default:
        return event.event_type.replace(/_/g, ' ');
    }
  };
  
  return (
    <div className="pf-browsing-history" style={{ height: 'calc(100% - 60px)', background: '#f7f7f8' }}>
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          background: 'white',
          borderBottom: '1px solid #e5e5e7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: '#0d0d0d',
          }}
        >
          Browsing Activity & Intent
        </h3>
        <button
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'background 0.2s',
            color: '#6e6e80',
            fontSize: '18px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ✕
        </button>
      </div>
      <Tabs.Root defaultValue="history" className="flex-1 flex flex-col" style={{ background: 'white', margin: '20px', borderRadius: '12px', overflow: 'hidden' }}>
        <Tabs.List className="flex border-b border-gray-200 px-3">
          <Tabs.Trigger 
            value="history" 
            className="flex-1 px-3 py-2 text-sm font-medium hover:bg-gray-50 data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors"
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Browsing History
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="intent" 
            className="flex-1 px-3 py-2 text-sm font-medium hover:bg-gray-50 data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors"
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            AI Intent Analysis
          </Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="history" className="data-[state=active]:flex flex-1 overflow-hidden flex-col p-4" style={{ minHeight: 0 }}>
          <div className="mb-3 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Your Recent Activity</h3>
            {events.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No browsing history yet
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Start exploring products to see your activity here
                </p>
              </div>
            ) : (
              events.map((event, index) => (
                <div 
                  key={`${event.timestamp}-${index}`} 
                  className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="mt-1 text-gray-400">
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getEventDescription(event)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {event.category_viewed && (
                        <span className="text-xs text-gray-500">
                          in {event.category_viewed}
                        </span>
                      )}
                      {event.price && (
                        <span className="text-xs text-gray-500">
                          €{event.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Tabs.Content>
        
        <Tabs.Content value="intent" className="data-[state=active]:flex flex-1 overflow-hidden flex-col p-4" style={{ minHeight: 0 }}>
          {detectedIntent ? (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-green-900 text-sm">
                      Detected Shopping Intent
                    </h3>
                    <p className="text-sm text-green-800 mt-1 font-medium">
                      {detectedIntent.intent
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-600">Confidence</span>
                    <p className="text-lg font-bold text-green-600">
                      {(detectedIntent.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${detectedIntent.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-2 font-semibold">Behavior Signals:</p>
                  <ul className="space-y-1">
                    {detectedIntent.signals.map((signal, i) => (
                      <li key={i} className="flex items-start text-xs text-gray-700">
                        <span className="text-green-500 mr-2 mt-0.5">•</span>
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {detectedIntent.suggestedMessage && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 mb-1 font-semibold">
                          AI Suggested Engagement:
                        </p>
                        <p className="text-sm text-blue-900 italic">
                          "{detectedIntent.suggestedMessage}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mt-auto">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">How this works:</span> Our AI analyzes your browsing patterns 
                  to understand your shopping intent and provide personalized assistance.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-sm font-medium mb-2">
                  Intent Analysis Pending
                </p>
                <p className="text-gray-500 text-xs max-w-xs mx-auto">
                  Browse a few more products and I'll analyze your shopping intent to provide personalized recommendations
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-600">Minimum 3 interactions required</span>
                </div>
              </div>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};