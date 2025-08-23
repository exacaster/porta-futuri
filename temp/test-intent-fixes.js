// Test script to verify AI intent analysis fixes
// Run this in the browser console when on the demo site

console.log('=== Testing AI Intent Analysis Fixes ===');

// Check if EventTrackingService is properly initialized
const checkTrackingService = () => {
  const historyData = sessionStorage.getItem('porta_futuri_browsing_history');
  const interactionCount = sessionStorage.getItem('porta_futuri_interaction_count');
  
  console.log('1. Session Storage Check:');
  console.log('   - Browsing History:', historyData ? JSON.parse(historyData).length + ' events' : 'No data');
  console.log('   - Interaction Count:', interactionCount || 'Not stored');
  
  if (historyData && !interactionCount) {
    console.warn('   ⚠️ Issue: Events exist but interaction count not persisted');
  } else if (historyData && interactionCount) {
    const events = JSON.parse(historyData);
    console.log('   ✅ Both events and interaction count are persisted');
    console.log('   - Event count:', events.length);
    console.log('   - Interaction count:', interactionCount);
    
    if (events.length != parseInt(interactionCount)) {
      console.log('   ℹ️ Note: Event count and interaction count differ (this is expected after clearing old events)');
    }
  }
};

// Simulate browsing activity
const simulateBrowsing = () => {
  console.log('\n2. Simulating Browsing Activity:');
  
  // Dispatch custom events that the widget listens to
  const urls = [
    '/atnaujinti_telefonai/apple-iphone-12-pro-atnaujintas',
    '/atnaujinti_telefonai/apple-iphone-14-pro-max-atnaujintas',
    '/atnaujinti_telefonai',
    '/atnaujinti_telefonai/samsung-galaxy-s22-ultra'
  ];
  
  urls.forEach((url, index) => {
    setTimeout(() => {
      const event = new CustomEvent('porta-futuri-page-view', {
        detail: { url, title: `Product ${index + 1}` }
      });
      window.dispatchEvent(event);
      console.log(`   - Simulated visit to: ${url}`);
    }, index * 500);
  });
  
  console.log('   ✅ Simulated 4 page views - check the widget in 2 seconds');
};

// Check for manual refresh button
const checkRefreshButton = () => {
  console.log('\n3. Manual Refresh Button Check:');
  
  const refreshButton = document.querySelector('button[title*="refresh intent"]');
  if (refreshButton) {
    console.log('   ✅ Refresh button found in the UI');
  } else {
    console.log('   ℹ️ Refresh button not visible (may need to switch to AI Intent Analysis tab)');
  }
};

// Run all checks
checkTrackingService();
simulateBrowsing();
setTimeout(() => {
  console.log('\n=== Re-checking after simulated activity ===');
  checkTrackingService();
  checkRefreshButton();
  console.log('\n✅ Test complete. Check the widget UI for:');
  console.log('   1. Browsing history should show the simulated events');
  console.log('   2. AI Intent Analysis tab should have a "Refresh Analysis" button');
  console.log('   3. Interaction count should match the total interactions');
}, 3000);