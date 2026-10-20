import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProveedorAuth } from '@/features/auth/auth-context';
import App from '@/App';
import '@/styles/index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProveedorAuth>
          <App />
        </ProveedorAuth>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);