import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Helper: get the token key for a given role
const tokenKey = (role) => `token_${role || 'user'}`;
const userKey = (role) => `user_${role || 'user'}`;

// Expose the active role so the Axios interceptor can read the correct token
let activeRole = localStorage.getItem('activeRole') || null;
export const getActiveToken = () => {
    const role = activeRole || localStorage.getItem('activeRole');
    return role ? localStorage.getItem(tokenKey(role)) : null;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from token on mount
    useEffect(() => {
        const initAuth = async () => {
            const savedRole = localStorage.getItem('activeRole');
            if (!savedRole) {
                setLoading(false);
                return;
            }

            const savedToken = localStorage.getItem(tokenKey(savedRole));
            const savedUser = localStorage.getItem(userKey(savedRole));

            if (savedToken && savedUser) {
                activeRole = savedRole;
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
                try {
                    const { data } = await authAPI.getProfile();
                    const freshUser = data.user || data;
                    setUser(freshUser);
                    localStorage.setItem(userKey(savedRole), JSON.stringify(freshUser));
                } catch (err) {
                    if (err.response && err.response.status === 401) {
                        // Token expired for this role — clear it
                        localStorage.removeItem(tokenKey(savedRole));
                        localStorage.removeItem(userKey(savedRole));
                        localStorage.removeItem('activeRole');
                        activeRole = null;
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
        const role = userData.role || 'user';

        // Store per-role
        localStorage.setItem(tokenKey(role), authToken);
        localStorage.setItem(userKey(role), JSON.stringify(userData));
        localStorage.setItem('activeRole', role);
        activeRole = role;

        setToken(authToken);
        setUser(userData);

        return userData;
    }, []);

    const register = useCallback(async (formData) => {
        const { data } = await authAPI.register(formData);
        const { token: authToken, ...rest } = data.user || data;
        const userData = rest;
        const role = userData.role || 'user';

        if (authToken) {
            localStorage.setItem(tokenKey(role), authToken);
            localStorage.setItem(userKey(role), JSON.stringify(userData));
            localStorage.setItem('activeRole', role);
            activeRole = role;

            setToken(authToken);
            setUser(userData);
        }

        return userData;
    }, []);

    const logout = useCallback(() => {
        const role = activeRole || localStorage.getItem('activeRole') || 'user';
        localStorage.removeItem(tokenKey(role));
        localStorage.removeItem(userKey(role));
        localStorage.removeItem('activeRole');
        activeRole = null;
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

