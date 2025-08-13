// Debug script to test bearer token handling
const BEARER_TOKEN = "YOUR_ACTUAL_BEARER_TOKEN"; // Paste your actual bearer token here

console.log("Bearer Token Debug Info:");
console.log("========================");
console.log("Length:", BEARER_TOKEN.length);
console.log("First 20 chars:", BEARER_TOKEN.substring(0, 20));
console.log("Last 20 chars:", BEARER_TOKEN.substring(BEARER_TOKEN.length - 20));
console.log("Contains spaces:", BEARER_TOKEN.includes(' '));
console.log("Contains newlines:", BEARER_TOKEN.includes('\n'));
console.log("Contains tabs:", BEARER_TOKEN.includes('\t'));
console.log("Starts with 'Bearer ':", BEARER_TOKEN.startsWith('Bearer '));
console.log("");

// Test encoding
const encoded = btoa(JSON.stringify({ bearer_token: BEARER_TOKEN }));
const decoded = JSON.parse(atob(encoded));

console.log("After encoding/decoding:");
console.log("========================");
console.log("Tokens match:", decoded.bearer_token === BEARER_TOKEN);
console.log("Decoded length:", decoded.bearer_token.length);
console.log("");

// Test JSON stringification
const jsonString = JSON.stringify({
  action: "test",
  config: {
    workspace_id: "765",
    resource_id: "customer_metrics",
    api_url: "https://customer360.exacaster.com/courier/api/v1",
    bearer_token: BEARER_TOKEN
  }
});

const parsed = JSON.parse(jsonString);
console.log("After JSON stringify/parse:");
console.log("============================");
console.log("Tokens match:", parsed.config.bearer_token === BEARER_TOKEN);
console.log("Parsed token length:", parsed.config.bearer_token.length);
console.log("");

console.log("If all tokens match, the issue is likely in the Edge Function or Exacaster API response.");
console.log("If tokens don't match, there's an encoding/parsing issue.");