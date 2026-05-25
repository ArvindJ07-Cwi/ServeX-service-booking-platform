import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// ─── SESSION-BASED AUTH ───
// Use sessionStorage so each browser tab/window maintains its own login session.
// This prevents the "two agents in different windows overwrite each other" bug.
const STORAGE_KEY_TOKEN = 'servx_token';
const STORAGE_KEY_USER  = 'servx_user';

// Expose the active token so the Axios interceptor can read it
export const getActiveToken = () => sessionStorage.getItem(STORAGE_KEY_TOKEN);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from token on mount
    useEffect(() => {
        const initAuth = async () => {
            const savedToken = sessionStorage.getItem(STORAGE_KEY_TOKEN);
            const savedUser = sessionStorage.getItem(STORAGE_KEY_USER);

            if (savedToken && savedUser) {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));

                try {
                    const { data } = await authAPI.getProfile();
                    const freshUser = data.user || data;
                    setUser(freshUser);
                    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(freshUser));
                } catch (err) {
                    if (err.response && err.response.status === 401) {
                        // Token expired — clear session
                        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
                        sessionStorage.removeItem(STORAGE_KEY_USER);
                        setToken(null);
                        setUser(null);
                    }
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (credentials) => {
        const { data } = await authAPI.login(credentials);
        const { token: authToken, ...rest } = data.user || data;
        const userData = rest;

        // Store in sessionStorage — scoped to THIS tab only
        sessionStorage.setItem(STORAGE_KEY_TOKEN, authToken);
        sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));

        setToken(authToken);
        setUser(userData);

        return userData;
    }, []);

    const register = useCallback(async (formData) => {
        const { data } = await authAPI.register(formData);
        const { token: authToken, ...rest } = data.user || data;
        const userData = rest;

        if (authToken) {
            sessionStorage.setItem(STORAGE_KEY_TOKEN, authToken);
            sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
            setToken(authToken);
            setUser(userData);
        }

        return userData;
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
        sessionStorage.removeItem(STORAGE_KEY_USER);
        setToken(null);
        setUser(null);
    }, []);

    const value = useMemo(() => ({
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isAgent: user?.role === 'agent',
        isUser: user?.role === 'user',
        login,
        register,
        logout,
    }), [user, token, loading, login, register, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
