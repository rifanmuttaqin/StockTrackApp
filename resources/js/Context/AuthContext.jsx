import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

function normalizeToArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && value !== null) {
        return Object.values(value);
    }
    return [];
}

export const AuthProvider = ({ children, pageProps }) => {
    const [user, setUser] = useState(pageProps?.auth?.user || null);
    const [permissions, setPermissions] = useState(() => normalizeToArray(pageProps?.auth?.permissions));
    const [roles, setRoles] = useState(() => normalizeToArray(pageProps?.auth?.roles));
    const [isLoading, setIsLoading] = useState(!pageProps?.auth?.user);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        setUser(pageProps?.auth?.user || null);
        setPermissions(normalizeToArray(pageProps?.auth?.permissions));
        setRoles(normalizeToArray(pageProps?.auth?.roles));
        setIsLoading(false);
        setIsInitialized(true);
    }, [pageProps?.auth]);

    // Fallback: set isLoading to false if auth data is available and still loading
    useEffect(() => {
        if (isLoading) {
            const hasAuthData = pageProps?.auth?.user ||
                               (pageProps?.auth?.permissions && pageProps?.auth?.permissions.length > 0) ||
                               (pageProps?.auth?.roles && pageProps?.auth?.roles.length > 0) ||
                               pageProps?.auth === null;

            if (hasAuthData) {
                setIsLoading(false);
                if (!isInitialized) {
                    setIsInitialized(true);
                }
            }
        }
    }, []); // Run once on mount

    const hasPermission = (permission) => {
        // If not yet initialized, return false to prevent race condition.
        if (!isInitialized) {
            return false;
        }

        return normalizeToArray(permissions).includes(permission);
    };

    const hasRole = (role) => {
        return normalizeToArray(roles).includes(role);
    };

    const hasAnyPermission = (permissionArray) => {
        const permArray = normalizeToArray(permissions);
        return permissionArray.some(permission => permArray.includes(permission));
    };

    const hasAnyRole = (roleArray) => {
        const roleList = normalizeToArray(roles);
        return roleArray.some(role => roleList.includes(role));
    };

    /**
     * Login function to be called after successful authentication
     * This immediately loads permissions and sets isInitialized to true
     * @param {Object} authData - Auth data containing user, permissions, and roles
     */
    const login = async (authData) => {
        const { user: userData, permissions: userPermissions, roles: userRoles } = authData;

        setUser(userData);
        setPermissions(normalizeToArray(userPermissions));
        setRoles(normalizeToArray(userRoles));
        setIsLoading(false);
        setIsInitialized(true);
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
        isLoading,
        isInitialized,
        login,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
