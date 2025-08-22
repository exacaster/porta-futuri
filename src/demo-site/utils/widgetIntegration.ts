// Listen for widget navigation messages
export function initWidgetNavigationHandler() {
  window.addEventListener('message', (event) => {
    // Validate message type
    if (event.data?.type === 'porta-futuri-navigation') {
      if (event.data.action === 'navigate-to-product') {
        // Use React Router navigation
        window.location.href = `/product/${event.data.productId}`;
      }
    }
  });
}

// Call this in demo site's App.tsx useEffect