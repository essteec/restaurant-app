// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/rest/api',
  IMAGE_BASE_URL: 'http://localhost:8080',
  TIMEOUT: 10000,
};

// App Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Restaurant Management System',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  WAITER: 'WAITER',
  CHEF: 'CHEF',
  CUSTOMER: 'CUSTOMER',
};

// Order Status
export const ORDER_STATUS = {
  PLACED: 'PLACED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// Table Status
export const TABLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  DIRTY: 'DIRTY',
};

// Call Request Types
export const CALL_REQUEST_TYPES = {
  WATER: 'WATER',
  ASSISTANCE: 'ASSISTANCE',
  NEED: 'NEED',
  PAYMENT: 'PAYMENT',
  PACK: 'PACK',
};

// Pagination Configuration
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_VISIBLE_PAGES: 5,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_PREFERENCES: 'userPreferences',
  CART_ITEMS: 'cartItems',
  SELECTED_TABLE: 'selectedTable',
  IS_TABLE_FROM_QR: 'isTableFromQr',
  CART_NOTES: 'cartNotes',
  SELECTED_ADDRESS: 'selectedAddress',
};

// Route Protection
export const PROTECTED_ROUTES = {
  ADMIN_ONLY: ['/admin'],
  STAFF_ONLY: ['/admin', '/waiter', '/chef'],
  AUTHENTICATED_ONLY: ['/profile', '/orders', '/cart', '/checkout'],
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'An unexpected error occurred.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  REGISTER_SUCCESS: 'Account created successfully!',
  ORDER_PLACED: 'Order placed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
};

// Supported Languages
export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];
