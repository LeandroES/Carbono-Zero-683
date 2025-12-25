// src/AuthContext.jsx

import React, { createContext, useState } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // --- NUEVO: Estado de notificación centralizado ---
    const [notification, setNotification] = useState(null);

    const login = (username, password) => {
        if (username === 'admin' && password === 'admin') {
            setUser({ name: 'Administrador', role: 'admin' });
            return true;
        }
        if (username === 'docente' && password === 'docente') {
            setUser({ name: 'Prof. Oak', role: 'docente' });
            return true;
        }
        return false;
    };
    const [settings, setSettings] = useState({
        taxRate: 11,
        co2Good: 800,
        co2Regular: 1200
    });

    const logout = () => {
        setUser(null);
    };

    // El valor del contexto ahora incluye el manejador de notificaciones
    const value = {
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        notification, // Exponemos el estado de la notificación
        setNotification, // Exponemos la función para cambiarla
        settings,
        setSettings
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};