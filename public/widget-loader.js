/**
 * Porta Futuri Widget Loader
 * Simple embed script for website integration
 */
(function() {
  'use strict';

  // Configuration from script tag
  const script = document.currentScript;
  const config = {
    apiKey: script.dataset.apiKey,
    apiUrl: script.dataset.apiUrl || 'https://api.portafuturi.com/functions/v1',
    position: script.dataset.position || 'bottom-right',
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

  // Validate API key
  if (!config.apiKey) {
    console.error('[Porta Futuri] API key is required. Add data-api-key to the script tag.');
    return;
  }

  // Create widget container
  const container = document.createElement('div');
  container.id = 'porta-futuri-widget-loader';
  container.style.cssText = 'position: fixed; z-index: 9999; pointer-events: none;';

  // Position the container
  switch (config.position) {
    case 'bottom-left':
      container.style.bottom = '20px';
      container.style.left = '20px';
      break;
    case 'top-right':
      container.style.top = '20px';
      container.style.right = '20px';
      break;
    case 'top-left':
      container.style.top = '20px';
      container.style.left = '20px';
      break;
    default: // bottom-right
      container.style.bottom = '20px';
      container.style.right = '20px';
  }

  // Add to body
  document.body.appendChild(container);

  // Load the main widget script
  const widgetScript = document.createElement('script');
  widgetScript.src = script.src.replace('widget-loader.js', 'widget.js');
  widgetScript.async = true;
  
  widgetScript.onload = function() {
    // Initialize widget when loaded
    if (window.PortaFuturi && window.PortaFuturi.init) {
      window.PortaFuturi.init({
        ...config,
        containerId: container.id
      });
    } else {
      console.error('[Porta Futuri] Widget initialization failed.');
    }
  };

  widgetScript.onerror = function() {
    console.error('[Porta Futuri] Failed to load widget script.');
  };

  document.head.appendChild(widgetScript);

  // Load widget styles
  const widgetStyles = document.createElement('link');
  widgetStyles.rel = 'stylesheet';
  widgetStyles.href = script.src.replace('widget-loader.js', 'widget.css');
  document.head.appendChild(widgetStyles);

  // Expose global API
  window.PortaFuturi = window.PortaFuturi || {
    init: function() { console.log('[Porta Futuri] Widget not yet loaded.'); },
    destroy: function() { console.log('[Porta Futuri] Widget not yet loaded.'); },
    update: function() { console.log('[Porta Futuri] Widget not yet loaded.'); },
    getMetrics: function() { return {}; },
    trackEvent: function() { },
    metrics: {
      loadTime: 0,
      responseTime: [],
      ctr: 0,
      sessionDuration: 0,
      errorRate: 0
    }
  };

  // Track page load time
  if (window.performance && window.performance.timing) {
    const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    window.PortaFuturi.metrics.loadTime = loadTime;
  }

})();