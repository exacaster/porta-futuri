import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminApp } from './App';

const root = ReactDOM.createRoot(
  document.getElementById('admin-root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);