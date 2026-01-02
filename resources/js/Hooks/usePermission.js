import { useAuth } from '../Context/AuthContext';

// Custom hook for permission checking
export const usePermission = () => {
    const { hasPermission, hasAnyPermission, hasRole, hasAnyRole } = useAuth();

    return {
        hasPermission,
        hasAnyPermission,
        hasRole,
        hasAnyRole,
    };
};
