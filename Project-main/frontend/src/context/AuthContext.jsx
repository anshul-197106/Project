/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await api.post('/auth/login/', { email, password });
        const { user: userData, tokens } = res.data;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('tokens', JSON.stringify(tokens));
        setUser(userData);
        return userData;
    }, []);

    const register = useCallback(async (username, email, password, password2, is_freelancer) => {
        const res = await api.post('/auth/register/', {
            username, email, password, password2, is_freelancer,
        });
        const { user: userData, tokens } = res.data;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('tokens', JSON.stringify(tokens));
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('tokens');
        setUser(null);
    }, []);

    const updateUser = useCallback((userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
