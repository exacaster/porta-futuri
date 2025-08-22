import { useState, useEffect, useCallback, useRef } from 'react';
import { ContextEvent } from '@shared/types/context.types';
import { EventTrackingService, BrowsingIntent } from '../services/eventTracking';

interface UseBrowsingHistoryReturn {
  events: ContextEvent[];
  detectedIntent: BrowsingIntent | null;
  clearHistory: () => void;
  trackEvent: (url: string, title?: string) => void;
  trackProductView: (productId: string, category?: string, price?: number) => void;
  trackSearch: (query: string) => void;
  trackCartAction: (productId: string, action: 'add' | 'remove' | 'update_quantity', quantity?: number, price?: number) => void;
}

export function useBrowsingHistory(sessionId: string): UseBrowsingHistoryReturn {
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
    
    const detectInterval = setInterval(() => {
      detectIntent();
    }, 10000);
    
    return () => {
      clearInterval(detectInterval);
      if (trackingServiceRef.current) {
        trackingServiceRef.current.destroy();
        trackingServiceRef.current = null;
      }
    };
  }, [sessionId]);
  
  const detectIntent = useCallback(() => {
    if (!trackingServiceRef.current) return;
    
    const intent = trackingServiceRef.current.analyzeIntent();
    setDetectedIntent(intent);
  }, []);
  
  const clearHistory = useCallback(() => {
    if (!trackingServiceRef.current) return;
    
    trackingServiceRef.current.clearHistory();
    setEvents([]);
    setDetectedIntent(null);
  }, []);
  
  const trackEvent = useCallback((url: string, title?: string) => {
    if (!trackingServiceRef.current) return;
    
    trackingServiceRef.current.trackPageView(url, title);
    
    setTimeout(() => detectIntent(), 500);
  }, [detectIntent]);
  
  const trackProductView = useCallback((productId: string, category?: string, price?: number) => {
    if (!trackingServiceRef.current) return;
    
    trackingServiceRef.current.trackProductView(productId, category, price);
    
    setTimeout(() => detectIntent(), 500);
  }, [detectIntent]);
  
  const trackSearch = useCallback((query: string) => {
    if (!trackingServiceRef.current) return;
    
    trackingServiceRef.current.trackSearch(query);
    
    setTimeout(() => detectIntent(), 500);
  }, [detectIntent]);
  
  const trackCartAction = useCallback(
    (productId: string, action: 'add' | 'remove' | 'update_quantity', quantity?: number, price?: number) => {
      if (!trackingServiceRef.current) return;
      
      trackingServiceRef.current.trackCartAction(productId, action, quantity, price);
      
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