// client/src/main.jsx
// React giriş noktası — Sonner Toaster global olarak mount edilir.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {/* Ekranın sağ altından çıkan toast bildirimleri */}
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '13px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)',
        },
      }}
    />
  </React.StrictMode>
);
