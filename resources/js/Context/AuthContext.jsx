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
    // Initialize with proper data transformation
    const getInitialPermissions = () => {
        const perms = pageProps?.auth?.permissions || [];
        // Ensure permissions is always an array
        if (!Array.isArray(perms)) {
            console.warn('AuthProvider: Initial permissions is not an array, converting:', perms);
            if (typeof perms === 'object' && perms !== null) {
                return Object.values(perms);
            }
            return [];
        }
        return perms;
    };

    const getInitialRoles = () => {
        const roles = pageProps?.auth?.roles || [];
        // Ensure roles is always an array
        if (!Array.isArray(roles)) {
            console.warn('AuthProvider: Initial roles is not an array, converting:', roles);
            if (typeof roles === 'object' && roles !== null) {
                return Object.values(roles);
            }
            return [];
        }
        return roles;
    };

    const [user, setUser] = useState(pageProps?.auth?.user || null);
    const [permissions, setPermissions] = useState(getInitialPermissions());
    const [roles, setRoles] = useState(getInitialRoles());

    useEffect(() => {

        setUser(pageProps?.auth?.user || null);

        // Handle permissions with proper transformation
        const newPermissions = pageProps?.auth?.permissions || [];
        if (!Array.isArray(newPermissions)) {
            console.warn('AuthProvider: New permissions is not an array, converting:', newPermissions);
            if (typeof newPermissions === 'object' && newPermissions !== null) {
                setPermissions(Object.values(newPermissions));
            } else {
                // Don't set to empty array if it's not an object
                // Keep the original value if it's something else
                console.warn('AuthProvider: Permissions is neither array nor object, keeping as is:', newPermissions);
                setPermissions([]);
            }
        } else {
            setPermissions(newPermissions);
        }

        // Handle roles with proper transformation
        const newRoles = pageProps?.auth?.roles || [];
        if (!Array.isArray(newRoles)) {
            console.warn('AuthProvider: New roles is not an array, converting:', newRoles);
            if (typeof newRoles === 'object' && newRoles !== null) {
                setRoles(Object.values(newRoles));
            } else {
                setRoles([]);
            }
        } else {
            setRoles(newRoles);
        }
    }, [pageProps?.auth]);

    const hasPermission = (permission) => {
        // Handle case where permissions might be an object instead of array
        if (!Array.isArray(permissions)) {
            // If it's an object, convert to array of values
            if (typeof permissions === 'object' && permissions !== null) {
                const permArray = Object.values(permissions);
                return permArray.includes(permission);
            }
            // If it's something else, return false
            return false;
        }

        return permissions.includes(permission);
    };

    const hasRole = (role) => {
        // Handle case where roles might be an object instead of array
        if (!Array.isArray(roles)) {
            // If it's an object, convert to array of values
            if (typeof roles === 'object' && roles !== null) {
                const roleArray = Object.values(roles);
                return roleArray.includes(role);
            }
            // If it's something else, return false
            return false;
        }

        return roles.includes(role);
    };

    const hasAnyPermission = (permissionArray) => {
        // Handle case where permissions might be an object instead of array
        if (!Array.isArray(permissions)) {
            // If it's an object, convert to array of values
            if (typeof permissions === 'object' && permissions !== null) {
                const permArray = Object.values(permissions);
                return permissionArray.some(permission => permArray.includes(permission));
            }
            // If it's something else, return false
            return false;
        }
        return permissionArray.some(permission => permissions.includes(permission));
    };

    const hasAnyRole = (roleArray) => {
        // Handle case where roles might be an object instead of array
        if (!Array.isArray(roles)) {
            // If it's an object, convert to array of values
            if (typeof roles === 'object' && roles !== null) {
                const roleArray = Object.values(roles);
                return roleArray.some(role => roleArray.includes(role));
            }
            // If it's something else, return false
            return false;
        }
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
