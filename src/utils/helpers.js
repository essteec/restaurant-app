import { ORDER_STATUS, USER_ROLES } from './constants.js';

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
  return `${import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:8080/images'}/${imageName}`;
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
