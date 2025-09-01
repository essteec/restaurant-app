import { ORDER_STATUS, USER_ROLES } from './constants.js';

// ---- Media helpers: consistent URL building and graceful fallbacks ----
const isAbsoluteUrl = (url) => /^(https?:)?\/\//i.test(url) || /^data:/i.test(url);
const stripLeadingSlashes = (s = '') => (s || '').replace(/^\/+/, '');
const joinUrl = (base, path) => {
  const b = (base || '').replace(/\/+$/, '');
  const p = stripLeadingSlashes(path || '');
  return p ? `${b}/${p}` : b || '/';
};
const ensureBase = (envKey, fallbackBase) => {
  const base = import.meta?.env?.[envKey] || fallbackBase;
  return base;
};

/**
 * Format currency value
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date and time
 */
export const formatDateTime = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format date only (without time)
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Get order status badge variant for Bootstrap
 */
export const getOrderStatusVariant = (status) => {
  switch (status) {
    case ORDER_STATUS.COMPLETED:
      return 'success';
    case ORDER_STATUS.CANCELLED:
      return 'danger';
    case ORDER_STATUS.PREPARING:
      return 'info';
    case ORDER_STATUS.PLACED:
      return 'primary';
    case ORDER_STATUS.READY:
      return 'warning';
    case ORDER_STATUS.DELIVERED:
      return 'success';
    default:
      return 'secondary';
  }
};

/**
 * Get table status variant for Bootstrap
 */
export const getTableStatusVariant = (status) => {
  switch (status) {
    case 'AVAILABLE':
      return 'success';
    case 'OCCUPIED':
      return 'danger';
    case 'DIRTY':
      return 'warning';
    case 'RESERVED':
      return 'info';
    default:
      return 'secondary';
  }
};

/**
 * Check if user has required role
 */
export const hasRole = (user, requiredRole) => {
  if (!user || !user.role) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  
  return user.role === requiredRole;
};

/**
 * Check if user has admin privileges
 */
export const isAdmin = (user) => hasRole(user, USER_ROLES.ADMIN);

/**
 * Check if user is staff (admin, waiter, or chef)
 */
export const isStaff = (user) => hasRole(user, [USER_ROLES.ADMIN, USER_ROLES.WAITER, USER_ROLES.CHEF]);

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Debounce function for search inputs
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generate image URL with fallback
 */
export const getImageUrl = (imageName, fallback = '/images/placeholder.jpg') => {
  if (!imageName) return fallback;
  if (isAbsoluteUrl(imageName)) return imageName;

  const base = ensureBase('VITE_IMAGE_BASE_URL', '/images');
  const baseHasImages = /\/images\/?$/i.test(base);
  let name = stripLeadingSlashes(imageName);
  // Prevent double "images/images/..."
  if (baseHasImages && /^images\//i.test(name)) {
    name = name.replace(/^images\//i, '');
  }
  return joinUrl(base, name);
};

export const getQrCodeUrl = (qrCodeName, fallback = '/qr-codes/placeholder.jpg') => {
  if (!qrCodeName) return fallback;
  if (isAbsoluteUrl(qrCodeName)) return qrCodeName;

  const base = ensureBase('VITE_QR_BASE_URL', '/qr-codes');
  const baseHasQr = /\/qr-codes\/?$/i.test(base);
  let name = stripLeadingSlashes(qrCodeName);
  if (baseHasQr && /^qr-codes\//i.test(name)) {
    name = name.replace(/^qr-codes\//i, '');
  }
  return joinUrl(base, name);
};

/**
 * onError helpers: swap to a safe fallback exactly once to avoid loops
 */
export const onImageError = (e, fallback) => {
  const img = e?.target;
  if (!img || img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = '1';
  img.alt = img.alt || 'Image unavailable';
  const svg = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">\n' +
    '<rect width="100%" height="100%" fill="#f0f0f0"/>\n' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="sans-serif" font-size="14">Image not available</text>\n' +
    '</svg>'
  );
  img.src = fallback || `data:image/svg+xml;charset=UTF-8,${svg}`;
};

export const onQrError = (e, fallback) => {
  const img = e?.target;
  if (!img || img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = '1';
  img.alt = img.alt || 'QR code unavailable';
  const svg = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">\n' +
    '<rect width="100%" height="100%" fill="#ffffff"/>\n' +
    '<rect x="20" y="20" width="60" height="60" fill="#ddd"/><rect x="220" y="20" width="60" height="60" fill="#ddd"/>\n' +
    '<rect x="20" y="220" width="60" height="60" fill="#ddd"/><rect x="120" y="120" width="60" height="60" fill="#ddd"/>\n' +
    '<text x="50%" y="95%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="sans-serif" font-size="14">QR not available</text>\n' +
    '</svg>'
  );
  img.src = fallback || `data:image/svg+xml;charset=UTF-8,${svg}`;
};

/**
 * Calculate total price for cart items
 */
export const calculateCartTotal = (cartItems) => {
  return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
};

/**
 * Calculate total quantity for cart items
 */
export const calculateCartQuantity = (cartItems) => {
  return cartItems.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
  }
};

/**
 * Error handling utility
 */
export const handleError = (error, showToast = true) => {
  const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
  
  if (showToast && window.showToast) {
    window.showToast(message, 'error');
  }
  
  console.error('Error occurred:', error);
  return message;
};
