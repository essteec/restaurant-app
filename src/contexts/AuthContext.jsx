import {useEffect, useState, useRef} from "react";
import apiClient from "../api";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./AuthContextExport.jsx";
import { STORAGE_KEYS } from "../utils/constants.js";

// create the auth provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));
    const [loading, setLoading] = useState(true);
    const initRanRef = useRef(false);

    useEffect(() => {
        const initializeAuth = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const decodedToken = jwtDecode(token);
                console.log("Decoded token in initializeAuth:", decodedToken);
                const userRole = decodedToken.role;

                // Fetch appropriate profile
                const profileEndpoint = ['ADMIN','CHEF','WAITER'].includes(userRole) ? '/users/employee/profile' : '/users/profile';
                const userResponse = await apiClient.get(profileEndpoint);
                setUser(userResponse.data);
            } catch (error) {
                console.error("Invalid token or failed to fetch user profile, logging out.", error);
                logout();
            } finally {
                setLoading(false);
            }
        };
        // Prevent double-run in StrictMode development (React 18) by guarding with ref
        if (!initRanRef.current) {
            initRanRef.current = true;
            initializeAuth();
        }
    }, [token]);

    const login = async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { token: newToken } = response.data;
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
        setToken(newToken);

        // decode & set user immediately (optimistic) to avoid null flicker
        try {
            const decodedToken = jwtDecode(newToken);
            const userRole = decodedToken.role;
            const profileEndpoint = userRole === 'CUSTOMER' ? '/users/profile' : '/users/employee/profile';
            const userResponse = await apiClient.get(profileEndpoint);
            setUser(userResponse.data);
        } catch (err) {
            console.error('Failed to fetch user after login', err);
            logout();
            throw err;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        delete apiClient.defaults.headers.common['Authorization'];
    };

    const register = async (userData) => {
        await apiClient.post('/auth/register', userData);
        await login(userData.email, userData.password);
    };

    const isAuthenticated = !!token && !!user; // ensure user object is loaded

    const value = {
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        register,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;