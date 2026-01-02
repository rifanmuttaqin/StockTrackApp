import React, { useState, useEffect, useRef } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useAuth } from '../Context/AuthContext';
import { Badge } from './UI';
import {
    Bars3Icon,
    BellIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    UserGroupIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';

export default function Navbar() {
    const { url, props } = usePage();
    const { user, hasPermission } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userStats, setUserStats] = useState({
        pendingUsers: 0,
        suspendedUsers: 0,
    });

    // Refs for dropdown menus
    const userMenuRef = useRef(null);
    const profileMenuRef = useRef(null);
    const notificationMenuRef = useRef(null);

    const { post } = useForm();

    // Check if current page is user management related
    const isUserManagementActive = url.startsWith('/users');

    // User management menu items with permission checks
    const userMenuItems = [
        {
            name: 'Daftar Pengguna',
            href: '/users',
            permission: 'users.index',
            icon: UserGroupIcon,
            badge: userStats.pendingUsers > 0 ? userStats.pendingUsers : null,
            badgeVariant: 'warning'
        },
        {
            name: 'Buat Pengguna Baru',
            href: '/users/create',
            permission: 'users.create',
            icon: UserCircleIcon,
        },
        {
            name: 'Pengguna Ditangguhkan',
            href: '/users?status=suspended',
            permission: 'users.suspend',
            icon: UserCircleIcon,
            badge: userStats.suspendedUsers > 0 ? userStats.suspendedUsers : null,
            badgeVariant: 'error'
        },
    ];

    // Fetch user statistics when component mounts
    useEffect(() => {
        if (hasPermission('users.index')) {
            fetchUserStats();
        }
    }, [hasPermission]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
            if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event) => {
            // ESC key closes all dropdowns
            if (event.key === 'Escape') {
                setShowUserMenu(false);
                setShowProfileMenu(false);
                setShowNotifications(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const fetchUserStats = async () => {
        try {
            const response = await fetch('/api/users/stats', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUserStats({
                    pendingUsers: data.pending || 0,
                    suspendedUsers: data.suspended || 0,
                });
            }
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
        }
    };

    const handleLogout = (e) => {
        e.preventDefault();
        post('/logout');
    };

    // Handle keyboard navigation for dropdown menus
    const handleUserMenuKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowUserMenu(!showUserMenu);
        }
    };

    const handleProfileMenuKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowProfileMenu(!showProfileMenu);
        }
    };

    const handleNotificationKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowNotifications(!showNotifications);
        }
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200" role="navigation" aria-label="Main navigation">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <button
                            type="button"
                            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle sidebar"
                            aria-expanded={sidebarOpen}
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                        <div className="hidden md:flex items-center">
                            <Link href="/dashboard" className="text-xl font-semibold text-gray-900" aria-label="Go to dashboard">
                                StockTrackApp
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* User Management Menu - Only show if user has permission */}
                        {hasPermission('users.index') && (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    type="button"
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                        isUserManagementActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    onKeyDown={handleUserMenuKeyDown}
                                    aria-label="Menu Manajemen Pengguna"
                                    aria-expanded={showUserMenu}
                                    aria-haspopup="true"
                                >
                                    <UserGroupIcon className="h-5 w-5 mr-2" />
                                    <span className="hidden md:block">Manajemen Pengguna</span>
                                    {/* Show badge if there are pending or suspended users */}
                                    {(userStats.pendingUsers > 0 || userStats.suspendedUsers > 0) && (
                                        <Badge
                                            variant="warning"
                                            size="sm"
                                            className="ml-2 -mr-1"
                                            aria-label={`${userStats.pendingUsers + userStats.suspendedUsers} pending actions`}
                                        >
                                            {userStats.pendingUsers + userStats.suspendedUsers}
                                        </Badge>
                                    )}
                                    <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showUserMenu && (
                                    <div
                                        className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                                        role="menu"
                                        aria-orientation="vertical"
                                        aria-labelledby="user-management-menu"
                                    >
                                        <div className="py-1">
                                            {userMenuItems.map((item) => {
                                                const Icon = item.icon;
                                                return hasPermission(item.permission) ? (
                                                    <Link
                                                        key={item.name}
                                                        href={item.href}
                                                        className={`flex items-center justify-between px-4 py-2 text-sm ${
                                                            url.startsWith(item.href)
                                                                ? 'bg-blue-50 text-blue-700'
                                                                : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                        onClick={() => setShowUserMenu(false)}
                                                        role="menuitem"
                                                    >
                                                        <div className="flex items-center">
                                                            <Icon className="mr-3 h-5 w-5 text-gray-400" />
                                                            {item.name}
                                                        </div>
                                                        {item.badge && (
                                                            <Badge variant={item.badgeVariant} size="sm">
                                                                {item.badge}
                                                            </Badge>
                                                        )}
                                                    </Link>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notifications */}
                        <div className="relative" ref={notificationMenuRef}>
                            <button
                                type="button"
                                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() => setShowNotifications(!showNotifications)}
                                onKeyDown={handleNotificationKeyDown}
                                aria-label="Notifications"
                                aria-expanded={showNotifications}
                            >
                                <BellIcon className="h-6 w-6" />
                                {/* Show notification badge if there are pending users */}
                                {userStats.pendingUsers > 0 && (
                                    <span
                                        className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"
                                        aria-label={`${userStats.pendingUsers} notifications`}
                                        aria-hidden="true"
                                    ></span>
                                )}
                            </button>

                            {showNotifications && (
                                <div
                                    className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="notification-menu"
                                >
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-sm text-gray-700">
                                            <div className="font-medium">Notifikasi</div>
                                            {userStats.pendingUsers > 0 ? (
                                                <div className="text-orange-600">
                                                    {userStats.pendingUsers} pengguna menunggu persetujuan
                                                </div>
                                            ) : (
                                                <div className="text-gray-500">Tidak ada notifikasi baru</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile dropdown */}
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                type="button"
                                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                onKeyDown={handleProfileMenuKeyDown}
                                aria-label="User menu"
                                aria-expanded={showProfileMenu}
                                aria-haspopup="true"
                            >
                                <span className="sr-only">Open user menu</span>
                                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                    <span className="text-white font-medium">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </button>

                            {showProfileMenu && (
                                <div
                                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="profile-menu"
                                >
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                            <div className="font-medium truncate">{user?.name}</div>
                                            <div className="text-gray-500 truncate">{user?.email}</div>
                                        </div>
                                        <Link
                                            href="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem"
                                        >
                                            <div className="flex items-center">
                                                <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                                                Profile
                                            </div>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem"
                                        >
                                            <div className="flex items-center">
                                                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                                                Logout
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
