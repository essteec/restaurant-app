import { useMemo } from 'react';
import { APP_CONFIG } from '../utils/constants.js';

/**
 * Custom hook for accessing environment configuration
 */
export const useEnvironment = () => {
  return useMemo(() => ({
    ...APP_CONFIG,
    isDevelopment: import.meta.env.MODE === 'development',
    isProduction: import.meta.env.MODE === 'production',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    imageBaseUrl: import.meta.env.VITE_IMAGE_BASE_URL,
  }), []);
};

export default useEnvironment;
