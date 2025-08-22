#!/usr/bin/env node

/**
 * Deploy cdp-proxy function to Supabase using Management API
 * This bypasses the need for Docker
 */

const fs = require('fs');
const path = require('path');

// Read the function code
const functionPath = path.join(__dirname, '..', 'supabase', 'functions', 'cdp-proxy', 'index.ts');
const functionCode = fs.readFileSync(functionPath, 'utf8');

// Create a deployment bundle
const deploymentCode = `
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-request-id, x-client-version, x-api-key',
  'Access-Control-Max-Age': '86400',
};

${functionCode.replace(/import.*corsHeaders.*from.*'\.\..*cors\.ts';/g, '')}
`;

console.log('CDP Proxy Function Deployment Script');
console.log('=====================================');
console.log('');
console.log('The function code has been prepared for deployment.');
console.log('');
console.log('To deploy manually:');
console.log('1. Go to Supabase Dashboard: https://app.supabase.com/project/rvlbbgdkgneobvlyawix');
console.log('2. Navigate to Edge Functions');
console.log('3. Click on "cdp-proxy" function');
console.log('4. Replace the code with the content below');
console.log('5. Click "Deploy"');
console.log('');
console.log('========== FUNCTION CODE START ==========');
console.log(deploymentCode);
console.log('========== FUNCTION CODE END ==========');

// Save to a file for easier copying
const outputPath = path.join(__dirname, 'cdp-proxy-deploy.ts');
fs.writeFileSync(outputPath, deploymentCode);
console.log('');
console.log(`Function code also saved to: ${outputPath}`);