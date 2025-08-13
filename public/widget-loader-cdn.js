(function() {
  'use strict';
  
  // Widget configuration
  const WIDGET_VERSION = '1.0.0';
  const CDN_BASE = window.PORTA_FUTURI_CDN || '';
  
  // Load React and ReactDOM from CDN if not already present
  function loadDependencies(callback) {
    const scripts = [];
    
    // Check if React is already loaded
    if (typeof React === 'undefined') {
      scripts.push({
        src: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
        global: 'React'
      });
    }
    
    // Check if ReactDOM is already loaded
    if (typeof ReactDOM === 'undefined') {
      scripts.push({
        src: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
        global: 'ReactDOM'
      });
    }
    
    // Load scripts sequentially
    let index = 0;
    
    function loadNext() {
      if (index >= scripts.length) {
        callback();
        return;
      }
      
      const script = scripts[index];
      const scriptEl = document.createElement('script');
      scriptEl.src = script.src;
      scriptEl.onload = function() {
        index++;
        loadNext();
      };
      scriptEl.onerror = function() {
        console.error('[Porta Futuri] Failed to load dependency:', script.src);
      };
      document.head.appendChild(scriptEl);
    }
    
    if (scripts.length > 0) {
      loadNext();
    } else {
      callback();
    }
  }
  
  // Load widget CSS
  function loadStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CDN_BASE + '/widget.css?v=' + WIDGET_VERSION;
    document.head.appendChild(link);
  }
  
  // Load widget script
  function loadWidget() {
    const script = document.createElement('script');
    script.src = CDN_BASE + '/widget.iife.js?v=' + WIDGET_VERSION;
    script.onload = function() {
      console.log('[Porta Futuri] Widget loaded successfully');
      
      // Auto-initialize if data attributes are present
      const currentScript = document.currentScript || document.querySelector('script[data-porta-futuri]');
      if (currentScript && currentScript.dataset.apiKey) {
        if (window.PortaFuturi && window.PortaFuturi.init) {
          window.PortaFuturi.init({
            apiKey: currentScript.dataset.apiKey,
            apiUrl: currentScript.dataset.apiUrl || 'https://rvlbbgdkgneobvlyawix.supabase.co',
            position: currentScript.dataset.position || 'bottom-right',
            containerId: currentScript.dataset.containerId || null,
            theme: {
              primaryColor: currentScript.dataset.themePrimary || '#007bff',
              secondaryColor: currentScript.dataset.themeSecondary || '#6c757d',
              fontFamily: currentScript.dataset.themeFont || 'Inter, sans-serif'
            }
          });
        }
      }
    };
    script.onerror = function() {
      console.error('[Porta Futuri] Failed to load widget script');
    };
    document.body.appendChild(script);
  }
  
  // Initialize
  function init() {
    // Load styles immediately
    loadStyles();
    
    // Load dependencies then widget
    loadDependencies(function() {
      // Small delay to ensure DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadWidget);
      } else {
        loadWidget();
      }
    });
  }
  
  // Start initialization
  init();
})();