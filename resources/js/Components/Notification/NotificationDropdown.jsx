import { useState, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { useNotifications } from '@/Providers/NotificationProvider';

export default function NotificationDropdown() {
    const {
        unreadCount,
        notifications,
        isLoading,
        fetchUnreadNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchUnreadNotifications(5);
        }
    }, [isOpen, fetchUnreadNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        if (type === 'out_of_stock') {
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                </div>
            );
        }
        return (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
            </div>
        );
    };

    // Format relative time
    const getRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Baru saja';
        if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} jam lalu`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} hari lalu`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative inline-flex items-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
            >
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                </svg>

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={async () => {
                                    await markAllAsRead();
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-500">
                                Tidak ada notifikasi baru
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <li
                                        key={notification.id}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                    >
                                        {getNotificationIcon(notification.data?.type)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {notification.data?.product_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {notification.data?.variant_name} - Stok: {notification.data?.stock_current}/{notification.data?.stock_threshold}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {getRelativeTime(notification.created_at)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification.id);
                                            }}
                                            className="shrink-0 text-gray-400 hover:text-gray-600"
                                            title="Tandai dibaca"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-4 py-3">
                        <Link
                            href={route('notifications.index')}
                            onClick={() => setIsOpen(false)}
                            className="block text-center text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                            Lihat semua notifikasi
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
