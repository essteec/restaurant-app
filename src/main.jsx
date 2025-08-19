import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CartProvider } from './contexts/CartContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { ConfirmationProvider } from './contexts/ConfirmationContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <ConfirmationProvider>
              <App />
            </ConfirmationProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
