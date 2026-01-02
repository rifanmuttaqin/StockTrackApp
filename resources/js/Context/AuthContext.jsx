import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children, pageProps }) => {
    const [user, setUser] = useState(pageProps?.auth?.user || null);
    const [permissions, setPermissions] = useState(pageProps?.auth?.permissions || []);
    const [roles, setRoles] = useState(pageProps?.auth?.roles || []);

    useEffect(() => {
        setUser(pageProps?.auth?.user || null);
        setPermissions(pageProps?.auth?.permissions || []);
        setRoles(pageProps?.auth?.roles || []);
    }, [pageProps?.auth]);

    const hasPermission = (permission) => {
        return permissions.includes(permission);
    };

    const hasRole = (role) => {
        return roles.includes(role);
    };

    const hasAnyPermission = (permissionArray) => {
        return permissionArray.some(permission => permissions.includes(permission));
    };

    const hasAnyRole = (roleArray) => {
        return roleArray.some(role => roles.includes(role));
    };

    const value = {
        user,
        permissions,
        roles,
        hasPermission,
        hasRole,
        hasAnyPermission,
        hasAnyRole,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
