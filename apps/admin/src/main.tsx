import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ProveedorAuth } from '@/features/auth/auth-context';
import App from '@/App';
import '@/styles/index.css';

const modoConsulta =
  import.meta.env.VITE_APP_MOBILE === 'true' || window.location.pathname === '/app/consulta';

// En consulta ciudadana los datos se refrescan solos para mostrar siempre lo más reciente.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: modoConsulta
      ? { refetchInterval: 15_000, refetchOnWindowFocus: true, refetchOnReconnect: true, staleTime: 0 }
      : {},
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProveedorAuth>
          <App />
          <Toaster position="top-right" richColors closeButton />
        </ProveedorAuth>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
