import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { WidgetConfig, TrackingEvent } from "./types/widget.types";

// Widget initialization interface
interface PortaFuturiWidget {
  init: (config: WidgetConfig) => void;
  destroy: () => void;
  update: (config: Partial<WidgetConfig>) => void;
  getMetrics: () => WidgetMetrics;
  trackEvent: (event: TrackingEvent) => void;
  customerId?: string;
  apiKey?: string;
  config?: WidgetConfig;
  metrics: WidgetMetrics;
}

interface WidgetMetrics {
  loadTime: number;
  responseTime: number[];
  ctr: number;
  sessionDuration: number;
  errorRate: number;
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
function init(config: WidgetConfig) {
  // Validate config
  if (!config.apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("[Porta Futuri] API key is required");
    }
    return;
  }

  // Create or get container
  if (config.containerId) {
    widgetContainer = document.getElementById(config.containerId);
    if (!widgetContainer) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          `[Porta Futuri] Container with ID "${config.containerId}" not found`,
        );
      }
      return;
    }
  } else {
    // Create container at body level
    widgetContainer = document.createElement("div");
    widgetContainer.id = "porta-futuri-widget";
    widgetContainer.style.position = "fixed";
    widgetContainer.style.zIndex = "9999";
    // Remove pointer-events: none to allow interaction
    document.body.appendChild(widgetContainer);
  }

  // Set container styles for proper positioning
  const position = config.position || "bottom-right";

  // Special handling for relative positioning (used in preview)
  if (position === "relative") {
    widgetContainer.style.position = "relative";
    widgetContainer.style.width = "100%";
    widgetContainer.style.height = "100%";
    widgetContainer.style.pointerEvents = "auto";
  } else {
    // Only set position styles if not using a provided container
    if (!config.containerId) {
      switch (position) {
        case "bottom-right":
          widgetContainer.style.bottom = "20px";
          widgetContainer.style.right = "20px";
          widgetContainer.style.top = "auto";
          widgetContainer.style.left = "auto";
          break;
        case "bottom-left":
          widgetContainer.style.bottom = "20px";
          widgetContainer.style.left = "20px";
          widgetContainer.style.top = "auto";
          widgetContainer.style.right = "auto";
          break;
        case "top-right":
          widgetContainer.style.top = "20px";
          widgetContainer.style.right = "20px";
          widgetContainer.style.bottom = "auto";
          widgetContainer.style.left = "auto";
          break;
        case "top-left":
          widgetContainer.style.top = "20px";
          widgetContainer.style.left = "20px";
          widgetContainer.style.bottom = "auto";
          widgetContainer.style.right = "auto";
          break;
      }
    }
  }

  // Create React root and render
  widgetRoot = ReactDOM.createRoot(widgetContainer);
  widgetRoot.render(
    <React.StrictMode>
      <App config={config} />
    </React.StrictMode>,
  );

  // Track load time
  if (window.PortaFuturi && window.PortaFuturi.metrics) {
    window.PortaFuturi.metrics.loadTime = Date.now() - startTime;

    // Track widget loaded event
    window.PortaFuturi.trackEvent({
      event_type: "widget_loaded",
      timestamp: new Date().toISOString(),
      load_time: window.PortaFuturi.metrics.loadTime,
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
      if (widgetContainer.id === "porta-futuri-widget") {
        widgetContainer.remove();
      } else {
        // Clear the contents if it's a provided container
        widgetContainer.innerHTML = "";
      }
    }

    widgetContainer = null;
  } catch (error) {
    // Silently handle destruction errors
  }
}

// Update widget configuration
function update(config: Partial<WidgetConfig>) {
  if (!widgetRoot || !widgetContainer) {
    return;
  }

  // Re-render with merged config
  const currentConfig = window.PortaFuturi.config || { apiKey: '' };
  const mergedConfig = { ...currentConfig, ...config } as WidgetConfig;
  widgetRoot.render(
    <React.StrictMode>
      <App config={mergedConfig} />
    </React.StrictMode>,
  );
}

// Get widget metrics
function getMetrics() {
  return window.PortaFuturi.metrics;
}

// Track custom events
function trackEvent(event: TrackingEvent) {
  // Add to metrics
  if (event.event_type === "recommendation_clicked") {
    const totalClicks =
      window.PortaFuturi.metrics.ctr *
      window.PortaFuturi.metrics.responseTime.length;
    window.PortaFuturi.metrics.ctr =
      (totalClicks + 1) / (window.PortaFuturi.metrics.responseTime.length + 1);
  }

  if (event.response_time) {
    window.PortaFuturi.metrics.responseTime.push(event.response_time);
  }

  // Send to analytics if configured
  if (typeof window !== "undefined" && 'gtag' in window) {
    const gtag = (window as Window & { gtag?: Function }).gtag;
    if (gtag) {
      gtag("event", event.event_type, {
        event_category: event.event_category || "Porta Futuri Widget",
        event_label: event.event_label,
        value: event.event_value,
      });
    }
  }
}

// Initialize global widget object - preserve any existing config
const existingConfig = window.PortaFuturi || {};

window.PortaFuturi = {
  ...existingConfig, // Preserve any existing properties (like apiKey, customerId, config)
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
    errorRate: 0,
  },
};

// Auto-initialize if config is present
if (typeof document !== "undefined") {
  // Check if there's already a config on window.PortaFuturi (from demo site setup)
  if (window.PortaFuturi && window.PortaFuturi.apiKey) {
    const config: WidgetConfig = {
      apiKey: window.PortaFuturi.apiKey,
      ...window.PortaFuturi.config,
      position: window.PortaFuturi.config?.position || "bottom-right",
    };

    // Wait for DOM ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => init(config));
    } else {
      // Small delay to ensure DOM is fully ready
      setTimeout(() => init(config), 100);
    }
  }
  // Fallback to script tag attributes
  else {
    const script = document.currentScript as HTMLScriptElement;
    if (script && script.dataset.apiKey) {
      // Auto-init with data attributes
      const config: WidgetConfig = {
        apiKey: script.dataset.apiKey,
        apiUrl: script.dataset.apiUrl,
        position: script.dataset.position as any,
        containerId: script.dataset.containerId,
        theme: {
          primaryColor: script.dataset.themePrimary,
          secondaryColor: script.dataset.themeSecondary,
          fontFamily: script.dataset.themeFont,
        },
        data: {
          productCatalogUrl: script.dataset.productCatalogUrl,
          customerProfileUrl: script.dataset.customerProfileUrl,
          contextUrl: script.dataset.contextUrl,
        },
      };

      // Wait for DOM ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => init(config));
      } else {
        init(config);
      }
    }
  }
}

// Export for module usage
export { init, destroy, update, getMetrics, trackEvent };
