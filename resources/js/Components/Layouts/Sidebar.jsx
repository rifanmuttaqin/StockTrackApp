import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '../../Context/AuthContext';
import {
    HomeIcon,
    UserGroupIcon,
    ShoppingCartIcon,
    CubeIcon,
    ChartBarIcon,
    CogIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    XMarkIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function Sidebar() {
    const { url } = usePage();
    const { hasPermission, hasRole, permissions, user, isAuthenticated } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({});

    // Refs for keyboard navigation
    const sidebarRef = useRef(null);

    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({
            ...prev,
            [menu]: !prev[menu]
        }));
    };

    const isActive = (path) => {
        return url.startsWith(path);
    };

    const menuItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: HomeIcon,
            permission: 'view_dashboard',
        },
        {
            name: 'Pengguna',
            icon: UserGroupIcon,
            permission: 'manage_users',
            subMenu: [
                {
                    name: 'Daftar Pengguna',
                    href: '/users',
                    permission: 'users.index',
                },
                {
                    name: 'Roles',
                    href: '/roles',
                    permission: 'manage_users',
                },
                {
                    name: 'Permissions',
                    href: '/permissions',
                    permission: 'manage_users',
                },
            ],
        },
        {
            name: 'Produk',
            icon: CubeIcon,
            permission: 'create_stock_entries',
            subMenu: [
                {
                    name: 'Daftar Produk',
                    href: '/products',
                    permission: 'create_stock_entries',
                }
            ],
        },
        {
            name: 'Template',
            icon: DocumentTextIcon,
            permission: 'templates.view',
            href: '/templates',
        },
        {
            name: 'Laporan',
            icon: ChartBarIcon,
            permission: 'view_reports',
            subMenu: [
                {
                    name: 'Pergerakan Stok',
                    href: '/reports/stock',
                    permission: 'view_reports',
                },
            ],
        },
        {
            name: 'Pengaturan',
            icon: CogIcon,
            permission: 'manage_users',
            href: '/settings',
        },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        // Dashboard always shows for authenticated users
        if (item.name === 'Dashboard' && isAuthenticated) {
            return true;
        }

        if (!item.permission) {
            return true;
        }

        const hasPerm = hasPermission(item.permission);
        return hasPerm;
    });

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event) => {
            // ESC key closes sidebar on mobile
            if (event.key === 'Escape' && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [sidebarOpen]);

    return (
        <>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                    role="presentation"
                    aria-hidden="true"
                >
                    <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
                </div>
            )}

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
                    md:translate-x-0 md:static md:inset-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                role="navigation"
                aria-label="Main navigation"
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    <h1 className="text-xl font-semibold text-gray-900">StockTrackApp</h1>
                    <button
                        type="button"
                        className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-5 px-2" role="menu">
                    <ul className="space-y-1">
                        {filteredMenuItems.map((item) => {
                            const Icon = item.icon;
                            const hasSubMenu = item.subMenu && item.subMenu.length > 0;
                            const isMenuOpen = openMenus[item.name];

                            // Filter sub-menu items based on permissions
                            const filteredSubMenu = hasSubMenu
                                ? item.subMenu.filter(subItem =>
                                    !subItem.permission || hasPermission(subItem.permission)
                                )
                                : [];

                            // Don't show menu if all sub-items are filtered out
                            if (hasSubMenu && filteredSubMenu.length === 0) {
                                return null;
                            }

                            return (
                                <li key={item.name}>
                                    {hasSubMenu ? (
                                        <div>
                                            <button
                                                onClick={() => toggleMenu(item.name)}
                                                className={`
                                                    w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors
                                                    ${isActive(item.href) || filteredSubMenu.some(subItem => isActive(subItem.href))
                                                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                    }
                                                `}
                                                aria-expanded={isMenuOpen}
                                                aria-haspopup="true"
                                                aria-controls={`submenu-${item.name}`}
                                            >
                                                <div className="flex items-center">
                                                    <Icon className="mr-3 h-5 w-5" />
                                                    {item.name}
                                                </div>
                                                {isMenuOpen ? (
                                                    <ChevronDownIcon className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRightIcon className="h-4 w-4" />
                                                )}
                                            </button>

                                            {isMenuOpen && (
                                                <ul
                                                    id={`submenu-${item.name}`}
                                                    className="mt-1 ml-8 space-y-1"
                                                    role="menu"
                                                    aria-orientation="vertical"
                                                >
                                                    {filteredSubMenu.map((subItem) => (
                                                        <li key={subItem.name}>
                                                            <Link
                                                                href={subItem.href}
                                                                className={`
                                                                    block px-3 py-2 rounded-md text-sm font-medium transition-colors
                                                                    ${isActive(subItem.href)
                                                                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                    }
                                                                `}
                                                                role="menuitem"
                                                            >
                                                                {subItem.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={`
                                                flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                                                ${isActive(item.href)
                                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                }
                                            `}
                                            role="menuitem"
                                        >
                                            <Icon className="mr-3 h-5 w-5" />
                                            {item.name}
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </>
    );
}
