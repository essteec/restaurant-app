import { useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { ToastContext } from './toastContext.js';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, variant = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      variant,
      delay: options.delay || 5000,
      autohide: options.autohide !== false,
      ...options,
    };

    setToasts(prev => [...prev, toast]);

    if (toast.autohide) {
      setTimeout(() => {
        removeToast(id);
      }, toast.delay);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, options) => addToast(message, 'success', options);
  const showError = (message, options) => addToast(message, 'danger', options);
  const showWarning = (message, options) => addToast(message, 'warning', options);
  const showInfo = (message, options) => addToast(message, 'info', options);

  const value = {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            bg={toast.variant}
            onClose={() => removeToast(toast.id)}
            show={true}
            autohide={toast.autohide}
            delay={toast.delay}
          >
            <Toast.Header>
              <strong className="me-auto">
                {toast.variant === 'success' && '✅ Success'}
                {toast.variant === 'danger' && '❌ Error'}
                {toast.variant === 'warning' && '⚠️ Warning'}
                {toast.variant === 'info' && 'ℹ️ Info'}
              </strong>
            </Toast.Header>
            <Toast.Body className={toast.variant === 'danger' ? 'text-white' : ''}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};
