import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminApp } from './App';

console.log('[index.tsx] Script loaded');

const rootElement = document.getElementById('admin-root');
console.log('[index.tsx] Root element:', rootElement);

if (!rootElement) {
  console.error('[index.tsx] Could not find admin-root element!');
  document.body.innerHTML = '<div style="color: red; padding: 20px;">ERROR: Could not find admin-root element</div>';
} else {
  console.log('[index.tsx] Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('[index.tsx] Rendering AdminApp...');
  root.render(
    <React.StrictMode>
      <AdminApp />
    </React.StrictMode>
  );
  console.log('[index.tsx] Render called');
}