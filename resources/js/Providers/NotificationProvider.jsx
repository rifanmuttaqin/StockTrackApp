import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await axios.get('/notifications/unread-count');
            if (response.data.success) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, []);

    // Fetch unread notifications (for dropdown)
    const fetchUnreadNotifications = useCallback(async (limit = 5) => {
        try {
            setIsLoading(true);
            const response = await axios.get(`/notifications/unread?limit=${limit}`);
            if (response.data.success) {
                setNotifications(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Mark single notification as read
    const markAsRead = useCallback(async (id) => {
        try {
            const response = await axios.patch(`/notifications/${id}/read`);
            if (response.data.success) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            return response.data;
        } catch (error) {
            console.error('Failed to mark as read:', error);
            return { success: false };
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await axios.patch('/notifications/read-all');
            if (response.data.success) {
                setNotifications([]);
                setUnreadCount(0);
            }
            return response.data;
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            return { success: false };
        }
    }, []);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        fetchUnreadCount();

        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    const value = {
        unreadCount,
        notifications,
        isLoading,
        fetchUnreadNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
