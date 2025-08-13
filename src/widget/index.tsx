import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Widget initialization interface
interface PortaFuturiWidget {
  init: (config: any) => void;
  destroy: () => void;
  update: (config: any) => void;
  getMetrics: () => any;
  trackEvent: (event: any) => void;
  customerId?: string;
  metrics: {
    loadTime: number;
    responseTime: number[];
    ctr: number;
    sessionDuration: number;
    errorRate: number;
  };
}

// Global widget object
declare global {
  interface Window {
    PortaFuturi: PortaFuturiWidget;
  }
}

// Widget root element
let widgetRoot: ReactDOM.Root | null = null;
let widgetContainer: HTMLElement | null = null;
const startTime = Date.now();

// Initialize widget
function init(config: any) {
  // Validate config
  if (!config.apiKey) {
    console.error('[Porta Futuri] API key is required');
    return;
  }

  // Create or get container
  if (config.containerId) {
    widgetContainer = document.getElementById(config.containerId);
    if (!widgetContainer) {
      console.error(`[Porta Futuri] Container with ID "${config.containerId}" not found`);
      return;
    }
  } else {
    // Create container at body level
    widgetContainer = document.createElement('div');
    widgetContainer.id = 'porta-futuri-widget';
    widgetContainer.style.position = 'fixed';
    widgetContainer.style.zIndex = '9999';
    // Remove pointer-events: none to allow interaction
    document.body.appendChild(widgetContainer);
  }

  // Set container styles for proper positioning
  const position = config.position || 'bottom-right';
  
  // Special handling for relative positioning (used in preview)
  if (position === 'relative') {
    widgetContainer.style.position = 'relative';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';
    widgetContainer.style.pointerEvents = 'auto';
  } else {
    // Only set position styles if not using a provided container
    if (!config.containerId) {
      switch (position) {
        case 'bottom-right':
          widgetContainer.style.bottom = '20px';
          widgetContainer.style.right = '20px';
          widgetContainer.style.top = 'auto';
          widgetContainer.style.left = 'auto';
          break;
        case 'bottom-left':
          widgetContainer.style.bottom = '20px';
          widgetContainer.style.left = '20px';
          widgetContainer.style.top = 'auto';
          widgetContainer.style.right = 'auto';
          break;
        case 'top-right':
          widgetContainer.style.top = '20px';
          widgetContainer.style.right = '20px';
          widgetContainer.style.bottom = 'auto';
          widgetContainer.style.left = 'auto';
          break;
        case 'top-left':
          widgetContainer.style.top = '20px';
          widgetContainer.style.left = '20px';
          widgetContainer.style.bottom = 'auto';
          widgetContainer.style.right = 'auto';
          break;
      }
    }
  }

  // Create React root and render
  widgetRoot = ReactDOM.createRoot(widgetContainer);
  widgetRoot.render(
    <React.StrictMode>
      <App config={config} />
    </React.StrictMode>
  );

  // Track load time
  if (window.PortaFuturi && window.PortaFuturi.metrics) {
    window.PortaFuturi.metrics.loadTime = Date.now() - startTime;
    
    // Track widget loaded event
    window.PortaFuturi.trackEvent({
      event_type: 'widget_loaded',
      timestamp: new Date().toISOString(),
      load_time: window.PortaFuturi.metrics.loadTime
    });
  }

}

// Destroy widget
function destroy() {
  try {
    if (widgetRoot) {
      widgetRoot.unmount();
      widgetRoot = null;
    }
    
    if (widgetContainer) {
      // Only remove if it's our created container
      if (widgetContainer.id === 'porta-futuri-widget') {
        widgetContainer.remove();
      } else {
        // Clear the contents if it's a provided container
        widgetContainer.innerHTML = '';
      }
    }
    
    widgetContainer = null;
  } catch (error) {
    console.error('[Porta Futuri] Error destroying widget:', error);
  }
}

// Update widget configuration
function update(config: any) {
  if (!widgetRoot || !widgetContainer) {
    console.error('[Porta Futuri] Widget not initialized');
    return;
  }

  // Re-render with new config
  widgetRoot.render(
    <React.StrictMode>
      <App config={config} />
    </React.StrictMode>
  );
  
}

// Get widget metrics
function getMetrics() {
  return window.PortaFuturi.metrics;
}

// Track custom events
function trackEvent(event: any) {
  // Add to metrics
  if (event.event_type === 'recommendation_clicked') {
    const totalClicks = window.PortaFuturi.metrics.ctr * window.PortaFuturi.metrics.responseTime.length;
    window.PortaFuturi.metrics.ctr = (totalClicks + 1) / (window.PortaFuturi.metrics.responseTime.length + 1);
  }
  
  if (event.response_time) {
    window.PortaFuturi.metrics.responseTime.push(event.response_time);
  }
  
  // Send to analytics if configured
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event.event_type, {
      event_category: 'Porta Futuri Widget',
      event_label: event.label,
      value: event.value
    });
  }
  
}

// Initialize global widget object
window.PortaFuturi = {
  init,
  destroy,
  update,
  getMetrics,
  trackEvent,
  metrics: {
    loadTime: 0,
    responseTime: [],
    ctr: 0,
    sessionDuration: 0,
    errorRate: 0
  }
};

// Auto-initialize if config is present in script tag
if (typeof document !== 'undefined') {
  const script = document.currentScript as HTMLScriptElement;
  if (script && script.dataset.apiKey) {
    // Auto-init with data attributes
    const config = {
      apiKey: script.dataset.apiKey,
      apiUrl: script.dataset.apiUrl,
      position: script.dataset.position,
      containerId: script.dataset.containerId,
      theme: {
        primaryColor: script.dataset.themePrimary,
        secondaryColor: script.dataset.themeSecondary,
        fontFamily: script.dataset.themeFont
      },
      data: {
        productCatalogUrl: script.dataset.productCatalogUrl,
        customerProfileUrl: script.dataset.customerProfileUrl,
        contextUrl: script.dataset.contextUrl
      }
    };
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init(config));
    } else {
      init(config);
    }
  }
}

// Export for module usage
export { init, destroy, update, getMetrics, trackEvent };