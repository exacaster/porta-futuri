import { useState, useEffect, useCallback, useRef } from 'react';
import { ContextEvent } from '@shared/types/context.types';
import { EventTrackingService, BrowsingIntent } from '../services/eventTracking';
import { CustomerProfile } from '../types/widget.types';

interface UseBrowsingHistoryReturn {
  events: ContextEvent[];
  detectedIntent: BrowsingIntent | null;
  clearHistory: () => void;
  refreshIntent: () => void;
  trackEvent: (url: string, title?: string) => void;
  trackProductView: (productId: string, category?: string, price?: number) => void;
  trackSearch: (query: string) => void;
  trackCartAction: (productId: string, action: 'add' | 'remove' | 'update_quantity', quantity?: number, price?: number) => void;
}

interface UseBrowsingHistoryOptions {
  apiKey?: string;
  customerProfile?: CustomerProfile;
  useAIIntentDetection?: boolean;
}

export function useBrowsingHistory(
  sessionId: string, 
  options: UseBrowsingHistoryOptions = {}
): UseBrowsingHistoryReturn {
  const [events, setEvents] = useState<ContextEvent[]>([]);
  const [detectedIntent, setDetectedIntent] = useState<BrowsingIntent | null>(null);
  const trackingServiceRef = useRef<EventTrackingService | null>(null);
  
  useEffect(() => {
    if (!trackingServiceRef.current) {
      trackingServiceRef.current = new EventTrackingService(sessionId);
      
      trackingServiceRef.current.addListener((updatedEvents) => {
        setEvents(updatedEvents);
      });
      
      // Restore events from storage
      setEvents(trackingServiceRef.current.getEvents());
      
      // Restore intent from storage if available
      const storedIntent = trackingServiceRef.current.getCurrentIntent();
      if (storedIntent) {
        setDetectedIntent(storedIntent);
        console.log('[useBrowsingHistory] Restored intent from storage');
      }
    }
    
    // Define detectIntent inside useEffect to avoid circular dependency
    const runDetection = async () => {
      if (!trackingServiceRef.current) return;
      
      // Use AI-based intent detection if API key is provided and enabled
      if (options.useAIIntentDetection && options.apiKey) {
        const intent = await trackingServiceRef.current.analyzeIntentWithAI(
          options.apiKey,
          options.customerProfile,
          false // Not forced refresh for automatic detection
        );
        setDetectedIntent(intent);
      } else {
        // Fall back to rule-based detection
        const intent = trackingServiceRef.current.analyzeIntent();
        setDetectedIntent(intent);
      }
    };
    
    // Run initial detection after a short delay (only if no intent is already loaded)
    if (!trackingServiceRef.current?.getCurrentIntent()) {
      setTimeout(() => runDetection(), 1000);
    }
    
    const detectInterval = setInterval(() => {
      runDetection();
    }, 10000);
    
    return () => {
      clearInterval(detectInterval);
      if (trackingServiceRef.current) {
        trackingServiceRef.current.destroy();
        trackingServiceRef.current = null;
      }
    };
  }, [sessionId, options.apiKey, options.customerProfile, options.useAIIntentDetection]);
  
  const detectIntent = useCallback(async (forceRefresh: boolean = false) => {
    if (!trackingServiceRef.current) return;
    
    // Use AI-based intent detection if API key is provided and enabled
    if (options.useAIIntentDetection && options.apiKey) {
      const intent = await trackingServiceRef.current.analyzeIntentWithAI(
        options.apiKey,
        options.customerProfile,
        forceRefresh
      );
      setDetectedIntent(intent);
    } else {
      // Fall back to rule-based detection
      const intent = trackingServiceRef.current.analyzeIntent();
      setDetectedIntent(intent);
    }
  }, [options.apiKey, options.customerProfile, options.useAIIntentDetection]);
  
  const clearHistory = useCallback(() => {
    if (!trackingServiceRef.current) return;
    
    trackingServiceRef.current.clearHistory();
    setEvents([]);
    setDetectedIntent(null);
  }, []);
  
  const refreshIntent = useCallback(() => {
    console.log('[Manual Refresh] Triggering intent analysis');
    detectIntent(true); // Force refresh
  }, [detectIntent]);
  
  const trackEvent = useCallback((url: string, title?: string) => {
    if (!trackingServiceRef.current) return;
    
    trackingServiceRef.current.trackPageView(url, title);
    
    // Trigger intent detection after tracking
    setTimeout(() => detectIntent(), 500);
  }, [detectIntent]);
  
  const trackProductView = useCallback((productId: string, category?: string, price?: number) => {
    if (!trackingServiceRef.current) return;
    
    trackingServiceRef.current.trackProductView(productId, category, price);
    
    // Trigger intent detection after tracking
    setTimeout(() => detectIntent(), 500);
  }, [detectIntent]);
  
  const trackSearch = useCallback((query: string) => {
    if (!trackingServiceRef.current) return;
    
    trackingServiceRef.current.trackSearch(query);
    
    // Trigger intent detection after tracking
    setTimeout(() => detectIntent(), 500);
  }, [detectIntent]);
  
  const trackCartAction = useCallback(
    (productId: string, action: 'add' | 'remove' | 'update_quantity', quantity?: number, price?: number) => {
      if (!trackingServiceRef.current) return;
      
      trackingServiceRef.current.trackCartAction(productId, action, quantity, price);
      
      // Trigger intent detection after tracking
      setTimeout(() => detectIntent(), 500);
    },
    [detectIntent]
  );
  
  return {
    events,
    detectedIntent,
    clearHistory,
    refreshIntent,
    trackEvent,
    trackProductView,
    trackSearch,
    trackCartAction
  };
}