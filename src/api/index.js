import axios from 'axios';
import { API_CONFIG, ERROR_MESSAGES, STORAGE_KEYS } from '../utils/constants.js';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Public API client without authentication
const publicApiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token (only for an authenticated client)
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling (for both clients)
const responseInterceptor = (response) => response;
const errorInterceptor = (error) => {
    if (error.response) {
        // Server responded with error status
        const { status } = error.response;
        
        switch (status) {
            case 401:
                // Unauthorized - only clear token for authenticated requests
                if (error.config?.headers?.Authorization) {
                    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                    window.location.href = '/login';
                }
                error.message = ERROR_MESSAGES.UNAUTHORIZED;
                break;
            case 403:
                error.message = ERROR_MESSAGES.FORBIDDEN;
                break;
            case 404:
                error.message = ERROR_MESSAGES.NOT_FOUND;
                break;
            case 500:
                error.message = ERROR_MESSAGES.SERVER_ERROR;
                break;
            default:
                error.message = error.response.data?.message || ERROR_MESSAGES.GENERIC_ERROR;
        }
    } else if (error.request) {
        // Network error
        error.message = ERROR_MESSAGES.NETWORK_ERROR;
    } else {
        // Other error
        error.message = ERROR_MESSAGES.GENERIC_ERROR;
    }
    
    return Promise.reject(error);
};

apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);
publicApiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

export default apiClient;
export { publicApiClient };