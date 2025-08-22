import { useState, useEffect, useCallback, useRef } from 'react';
import { ContextEvent } from '@shared/types/context.types';
import { EventTrackingService, BrowsingIntent } from '../services/eventTracking';
import { CustomerProfile } from '../types/widget.types';

interface UseBrowsingHistoryReturn {
  events: ContextEvent[];
  detectedIntent: BrowsingIntent | null;
  clearHistory: () => void;
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
      
      setEvents(trackingServiceRef.current.getEvents());
    }
    
    // Define detectIntent inside useEffect to avoid circular dependency
    const runDetection = async () => {
      if (!trackingServiceRef.current) return;
      
      // Use AI-based intent detection if API key is provided and enabled
      if (options.useAIIntentDetection && options.apiKey) {
        const intent = await trackingServiceRef.current.analyzeIntentWithAI(
          options.apiKey,
          options.customerProfile
        );
        setDetectedIntent(intent);
      } else {
        // Fall back to rule-based detection
        const intent = trackingServiceRef.current.analyzeIntent();
        setDetectedIntent(intent);
      }
    };
    
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
  
  const detectIntent = useCallback(async () => {
    if (!trackingServiceRef.current) return;
    
    // Use AI-based intent detection if API key is provided and enabled
    if (options.useAIIntentDetection && options.apiKey) {
      const intent = await trackingServiceRef.current.analyzeIntentWithAI(
        options.apiKey,
        options.customerProfile
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
    trackEvent,
    trackProductView,
    trackSearch,
    trackCartAction
  };
}