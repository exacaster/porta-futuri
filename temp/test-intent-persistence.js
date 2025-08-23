// Test script to verify AI intent persistence across page refreshes
// Run this in the browser console on the demo site

console.log('=== Testing Intent Analysis Persistence ===');

function checkIntentPersistence() {
  console.log('\n1. Checking SessionStorage for Intent Data:');
  
  // Check if intent is stored
  const storedIntent = sessionStorage.getItem('porta_futuri_intent_analysis');
  
  if (storedIntent) {
    try {
      const { intent, timestamp } = JSON.parse(storedIntent);
      const age = Date.now() - timestamp;
      
      console.log('✅ Intent found in storage:');
      console.log('   - Intent:', intent.intent);
      console.log('   - Confidence:', (intent.confidence * 100).toFixed(0) + '%');
      console.log('   - Age:', Math.floor(age / 1000), 'seconds');
      console.log('   - Signals:', intent.signals);
      console.log('   - Message:', intent.suggestedMessage);
      
      if (age < 5 * 60 * 1000) {
        console.log('   ✅ Intent is fresh (< 5 minutes old) - will be restored on reload');
      } else {
        console.log('   ⚠️ Intent is stale (> 5 minutes old) - will be discarded on reload');
      }
    } catch (e) {
      console.error('❌ Failed to parse stored intent:', e);
    }
  } else {
    console.log('❌ No intent found in storage');
  }
  
  console.log('\n2. Checking Other Persisted Data:');
  
  // Check browsing history
  const history = sessionStorage.getItem('porta_futuri_browsing_history');
  if (history) {
    const events = JSON.parse(history);
    console.log('   ✅ Browsing history:', events.length, 'events');
  } else {
    console.log('   ❌ No browsing history');
  }
  
  // Check interaction count
  const count = sessionStorage.getItem('porta_futuri_interaction_count');
  if (count) {
    console.log('   ✅ Interaction count:', count);
  } else {
    console.log('   ❌ No interaction count');
  }
  
  // Check widget state
  const widgetState = sessionStorage.getItem('porta_futuri_widget_state');
  if (widgetState) {
    const state = JSON.parse(widgetState);
    console.log('   ✅ Widget state persisted (tab:', state.activeTab + ')');
  }
}

function simulateIntentGeneration() {
  console.log('\n3. Simulating Intent Generation:');
  console.log('   Dispatching events to trigger intent analysis...');
  
  // Simulate smartphone browsing to trigger intent
  const events = [
    { url: '/atnaujinti_telefonai', title: 'Smartphones' },
    { url: '/atnaujinti_telefonai/apple-iphone-14-pro', title: 'iPhone 14 Pro' },
    { url: '/atnaujinti_telefonai/apple-iphone-13', title: 'iPhone 13' },
    { url: '/atnaujinti_telefonai', title: 'Back to Smartphones' }
  ];
  
  events.forEach((event, index) => {
    setTimeout(() => {
      const customEvent = new CustomEvent('porta-futuri-page-view', {
        detail: event
      });
      window.dispatchEvent(customEvent);
      console.log(`   - Event ${index + 1}: ${event.title}`);
      
      if (index === events.length - 1) {
        // Check persistence after last event
        setTimeout(() => {
          console.log('\n4. Checking if Intent was Generated and Persisted:');
          checkIntentPersistence();
          
          console.log('\n5. Testing Page Refresh Behavior:');
          console.log('   💡 To test persistence across refresh:');
          console.log('   1. Reload the page (F5 or Cmd+R)');
          console.log('   2. Open the widget');
          console.log('   3. Go to "Browsing Activity & Intent" tab');
          console.log('   4. Click on "AI Intent Analysis"');
          console.log('   5. The intent should be there immediately!');
          console.log('\n   Run this script again after refresh to verify persistence.');
        }, 1000);
      }
    }, index * 500);
  });
}

// Function to clear all persisted data
function clearAllData() {
  console.log('\n🗑️ Clearing all persisted data...');
  sessionStorage.removeItem('porta_futuri_intent_analysis');
  sessionStorage.removeItem('porta_futuri_browsing_history');
  sessionStorage.removeItem('porta_futuri_interaction_count');
  console.log('   ✅ All intent data cleared');
}

// Main execution
console.log('Choose an action:');
console.log('1. checkIntentPersistence() - Check current persistence status');
console.log('2. simulateIntentGeneration() - Generate and persist new intent');
console.log('3. clearAllData() - Clear all persisted intent data');

// Auto-run check
checkIntentPersistence();

// Make functions available globally
window.testIntentPersistence = {
  check: checkIntentPersistence,
  simulate: simulateIntentGeneration,
  clear: clearAllData
};

console.log('\nFunctions available via: window.testIntentPersistence.check(), .simulate(), .clear()');