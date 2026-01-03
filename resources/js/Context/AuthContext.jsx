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

        let finalPermissions = [];
        if (!Array.isArray(newPermissions)) {
            if (typeof newPermissions === 'object' && newPermissions !== null) {
                // Check if it's an indexed object (like {0: "perm1", 1: "perm2"})
                const keys = Object.keys(newPermissions);
                const isIndexedObject = keys.length > 0 && keys.every((key, index) => key === String(index));

                if (isIndexedObject) {
                    // Convert indexed object to array
                    finalPermissions = Object.values(newPermissions);
                } else {
                    // It's a regular object, extract values
                    finalPermissions = Object.values(newPermissions);
                }
            } else {
                // If it's something else, use empty array
                finalPermissions = [];
            }
        } else {
            finalPermissions = newPermissions;
        }

        setPermissions(finalPermissions);

        // Handle roles with proper transformation
        const newRoles = pageProps?.auth?.roles || [];

        let finalRoles = [];
        if (!Array.isArray(newRoles)) {
            if (typeof newRoles === 'object' && newRoles !== null) {
                finalRoles = Object.values(newRoles);
            } else {
                finalRoles = [];
            }
        } else {
            finalRoles = newRoles;
        }

        setRoles(finalRoles);
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
