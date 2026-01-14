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
        
        console.log('[AuthContext] getInitialPermissions - pageProps?.auth?.permissions:', perms);
        console.log('[AuthContext] getInitialPermissions - type:', typeof perms, 'isArray:', Array.isArray(perms));

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
    const [isLoading, setIsLoading] = useState(!pageProps?.auth?.user);
    const [isInitialized, setIsInitialized] = useState(false);
    
    console.log('[AuthContext] Initial state - user:', user);
    console.log('[AuthContext] Initial state - permissions:', permissions);
    console.log('[AuthContext] Initial state - roles:', roles);
    console.log('[AuthContext] Initial state - isLoading:', isLoading);
    console.log('[AuthContext] Initial state - isInitialized:', isInitialized);

    useEffect(() => {
        console.log('[AuthContext] useEffect triggered - pageProps?.auth:', pageProps?.auth);
        console.log('[AuthContext] useEffect - pageProps?.auth?.permissions:', pageProps?.auth?.permissions);
        
        setUser(pageProps?.auth?.user || null);

        // Handle permissions with proper transformation
        const newPermissions = pageProps?.auth?.permissions || [];
        
        // Check if we have data to load
        const hasAuthData = pageProps?.auth?.user ||
                           (pageProps?.auth?.permissions && pageProps?.auth?.permissions.length > 0) ||
                           (pageProps?.auth?.roles && pageProps?.auth?.roles.length > 0) ||
                           pageProps?.auth === null; // Explicitly handle null (not authenticated)
        
        console.log('[AuthContext] useEffect - hasAuthData:', hasAuthData);

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
        
        console.log('[AuthContext] useEffect - setPermissions called with:', finalPermissions);

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
        
        console.log('[AuthContext] useEffect - setRoles called with:', finalRoles);
        console.log('[AuthContext] useEffect - State updated complete');
        
        // Mark as loaded after state is updated
        setIsLoading(false);
        console.log('[AuthContext] useEffect - isLoading set to false');
        
        // Mark as initialized only after all auth data is ready
        setIsInitialized(true);
        console.log('[AuthContext] useEffect - isInitialized set to true - AuthContext fully initialized');
    }, [pageProps?.auth]);
    
    // Fallback: set isLoading to false if auth data is available and still loading
    useEffect(() => {
        if (isLoading) {
            const hasAuthData = pageProps?.auth?.user ||
                               (pageProps?.auth?.permissions && pageProps?.auth?.permissions.length > 0) ||
                               (pageProps?.auth?.roles && pageProps?.auth?.roles.length > 0) ||
                               pageProps?.auth === null;
            
            if (hasAuthData) {
                console.log('[AuthContext] Initial mount - auth data available, setting isLoading to false');
                setIsLoading(false);
                
                // Also mark as initialized on initial mount if data is available
                if (!isInitialized) {
                    setIsInitialized(true);
                    console.log('[AuthContext] Initial mount - isInitialized set to true');
                }
            }
        }
    }, []); // Run once on mount

    const hasPermission = (permission) => {
        console.log('[AuthContext] hasPermission called - permission:', permission);
        console.log('[AuthContext] hasPermission - isInitialized:', isInitialized);
        console.log('[AuthContext] hasPermission - current permissions:', permissions);
        console.log('[AuthContext] hasPermission - permissions type:', typeof permissions, 'isArray:', Array.isArray(permissions));
        
        // If not yet initialized, log a warning and return false to prevent premature checks
        if (!isInitialized) {
            console.warn('[AuthContext] hasPermission - WARNING: Permission check attempted before AuthContext is initialized. Returning false to prevent race condition.');
            return false;
        }
        
        // Handle case where permissions might be an object instead of array
        if (!Array.isArray(permissions)) {
            // If it's an object, convert to array of values
            if (typeof permissions === 'object' && permissions !== null) {
                const permArray = Object.values(permissions);
                console.log('[AuthContext] hasPermission - converted to array:', permArray);
                const result = permArray.includes(permission);
                console.log('[AuthContext] hasPermission - result:', result);
                return result;
            }
            // If it's something else, return false
            console.log('[AuthContext] hasPermission - not array or object, returning false');
            return false;
        }

        const result = permissions.includes(permission);
        console.log('[AuthContext] hasPermission - result:', result);
        return result;
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

    /**
     * Login function to be called after successful authentication
     * This immediately loads permissions and sets isInitialized to true
     * @param {Object} authData - Auth data containing user, permissions, and roles
     */
    const login = async (authData) => {
        console.log('[AuthContext] login function called with authData:', authData);
        
        const { user: userData, permissions: userPermissions, roles: userRoles } = authData;
        
        // Set user state
        setUser(userData);
        console.log('[AuthContext] login - user state set:', userData);
        
        // Handle permissions with proper transformation
        let finalPermissions = [];
        if (!Array.isArray(userPermissions)) {
            if (typeof userPermissions === 'object' && userPermissions !== null) {
                // Check if it's an indexed object (like {0: "perm1", 1: "perm2"})
                const keys = Object.keys(userPermissions);
                const isIndexedObject = keys.length > 0 && keys.every((key, index) => key === String(index));

                if (isIndexedObject) {
                    // Convert indexed object to array
                    finalPermissions = Object.values(userPermissions);
                } else {
                    // It's a regular object, extract values
                    finalPermissions = Object.values(userPermissions);
                }
            } else {
                // If it's something else, use empty array
                finalPermissions = [];
            }
        } else {
            finalPermissions = userPermissions;
        }
        
        setPermissions(finalPermissions);
        console.log('[AuthContext] login - permissions state set:', finalPermissions);
        
        // Handle roles with proper transformation
        let finalRoles = [];
        if (!Array.isArray(userRoles)) {
            if (typeof userRoles === 'object' && userRoles !== null) {
                finalRoles = Object.values(userRoles);
            } else {
                finalRoles = [];
            }
        } else {
            finalRoles = userRoles;
        }
        
        setRoles(finalRoles);
        console.log('[AuthContext] login - roles state set:', finalRoles);
        
        // Set loading states
        setIsLoading(false);
        console.log('[AuthContext] login - isLoading set to false');
        
        // Mark as initialized immediately after all data is loaded
        setIsInitialized(true);
        console.log('[AuthContext] login - isInitialized set to true - AuthContext fully initialized after login');
        
        console.log('[AuthContext] login - All auth state updated immediately after login');
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
