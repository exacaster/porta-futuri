import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminApp } from './App';

const rootElement = document.getElementById('admin-root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">ERROR: Could not find admin-root element</div>';
} else {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <AdminApp />
    </React.StrictMode>
  );
}