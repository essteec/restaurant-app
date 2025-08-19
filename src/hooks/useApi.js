import { useState, useEffect } from 'react';
import apiClient from '../api/index.js';

/**
 * Custom hook for API calls with loading and error states
 */
export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    dependencies = [],
    immediate = true,
    onSuccess,
    onError,
  } = options;

  const execute = async (customUrl = url, customOptions = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(customUrl, customOptions);
      setData(response.data);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate && url) {
      execute();
    }
  }, [url, immediate, ...dependencies]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: () => execute(url),
  };
};

/**
 * Custom hook for POST/PUT/DELETE operations
 */
export const useMutation = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    onSuccess,
    onError,
  } = options;

  const mutate = async (url, data, method = 'POST') => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      switch (method.toUpperCase()) {
        case 'POST':
          response = await apiClient.post(url, data);
          break;
        case 'PUT':
          response = await apiClient.put(url, data);
          break;
        case 'PATCH':
          response = await apiClient.patch(url, data);
          break;
        case 'DELETE':
          response = await apiClient.delete(url);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    mutate,
    loading,
    error,
    post: (url, data) => mutate(url, data, 'POST'),
    put: (url, data) => mutate(url, data, 'PUT'),
    patch: (url, data) => mutate(url, data, 'PATCH'),
    delete: (url) => mutate(url, null, 'DELETE'),
  };
};

export default useApi;
