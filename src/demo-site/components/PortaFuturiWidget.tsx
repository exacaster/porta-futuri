import React, { useEffect } from 'react';

// Extend the existing window interface for demo site
interface PortaFuturiConfig {
  apiKey: string;
  customerId?: string;
  config?: {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
    };
  };
}

export function PortaFuturiWidget() {
  useEffect(() => {
    // Set up widget configuration
    (window as any).PortaFuturi = {
      apiKey: import.meta.env.VITE_WIDGET_API_KEY || 'demo-api-key',
      customerId: localStorage.getItem('itelecom_customer_id') || 'DEMO_USER_001',
      config: {
        position: 'bottom-right',
        theme: {
          primaryColor: '#6d02a3',
          secondaryColor: '#b12df4',
          fontFamily: 'Inter, sans-serif'
        }
      }
    };

    // Load widget script
    const loadWidget = () => {
      const existingScript = document.getElementById('porta-futuri-widget-script');
      if (existingScript) {
        return; // Widget already loaded
      }

      const script = document.createElement('script');
      script.id = 'porta-futuri-widget-script';
      script.src = import.meta.env.VITE_WIDGET_URL || 'http://localhost:5173/widget.iife.js';
      script.dataset.apiKey = (window as any).PortaFuturi.apiKey;
      script.async = true;
      
      script.onload = () => {
        console.log('Porta Futuri widget loaded successfully');
        
        // Send initial context about the demo site
        setTimeout(() => {
          const event = new CustomEvent('porta-futuri-context', {
            detail: {
              site: 'iTelecom Demo',
              page: window.location.pathname,
              customerType: 'demo'
            }
          });
          window.dispatchEvent(event);
        }, 1000);
      };

      script.onerror = (error) => {
        console.error('Failed to load Porta Futuri widget:', error);
      };

      document.body.appendChild(script);
    };

    // Check if we're in development and the widget server is running
    if (import.meta.env.DEV) {
      // In development, try to load from the widget dev server
      fetch('http://localhost:5173/widget.iife.js', { method: 'HEAD' })
        .then(() => {
          console.log('Widget dev server is running');
          loadWidget();
        })
        .catch(() => {
          console.warn('Widget dev server not running. Start it with: npm run dev:widget');
          // Try loading the built widget instead
          const builtWidgetUrl = '/dist/widget.iife.js';
          (window as any).PortaFuturi.config = {
            ...(window as any).PortaFuturi.config,
          };
          
          // Update the URL to use built widget
          const script = document.createElement('script');
          script.id = 'porta-futuri-widget-script';
          script.src = builtWidgetUrl;
          script.dataset.apiKey = (window as any).PortaFuturi.apiKey;
          script.async = true;
          
          script.onload = () => {
            console.log('Using built widget');
          };
          
          script.onerror = () => {
            console.info('Widget not available. Run "npm run build:widget" to build it.');
          };
          
          document.body.appendChild(script);
        });
    } else {
      // In production, load the built widget
      loadWidget();
    }

    // Listen for widget open events (can be triggered from anywhere in the app)
    const handleOpenWidget = () => {
      const widgetTrigger = document.querySelector('[data-porta-futuri-trigger]');
      if (widgetTrigger) {
        (widgetTrigger as HTMLElement).click();
      }
    };

    window.addEventListener('porta-futuri-open', handleOpenWidget);

    // Cleanup function
    return () => {
      window.removeEventListener('porta-futuri-open', handleOpenWidget);
      
      // Don't remove the widget on component unmount as it should persist
      // Only remove if navigating away from the demo site entirely
    };
  }, []);

  // The widget renders itself, this component just handles the integration
  return null;
}

// Helper hook to interact with the widget
export function usePortaFuturiWidget() {
  const openWidget = () => {
    const event = new CustomEvent('porta-futuri-open');
    window.dispatchEvent(event);
  };

  const closeWidget = () => {
    const event = new CustomEvent('porta-futuri-close');
    window.dispatchEvent(event);
  };

  const sendContext = (context: any) => {
    const event = new CustomEvent('porta-futuri-context', {
      detail: context
    });
    window.dispatchEvent(event);
  };

  return {
    openWidget,
    closeWidget,
    sendContext
  };
}