import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useAuth } from '../Context/AuthContext';
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
} from '@heroicons/react/24/outline';

export default function Sidebar() {
    const { url } = usePage();
    const { hasPermission, hasRole } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({});

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
            permission: null,
        },
        {
            name: 'Manajemen Pengguna',
            icon: UserGroupIcon,
            permission: 'users.index',
            subMenu: [
                {
                    name: 'Daftar Pengguna',
                    href: '/users',
                    permission: 'users.index',
                },
                {
                    name: 'Roles',
                    href: '/roles',
                    permission: 'roles.view',
                },
                {
                    name: 'Permissions',
                    href: '/permissions',
                    permission: 'permissions.view',
                },
            ],
        },
        {
            name: 'Produk',
            icon: CubeIcon,
            permission: 'products.view',
            subMenu: [
                {
                    name: 'Daftar Produk',
                    href: '/products',
                    permission: 'products.view',
                },
                {
                    name: 'Kategori',
                    href: '/categories',
                    permission: 'categories.view',
                },
            ],
        },
        {
            name: 'Transaksi',
            icon: ShoppingCartIcon,
            permission: 'transactions.view',
            subMenu: [
                {
                    name: 'Penjualan',
                    href: '/sales',
                    permission: 'sales.view',
                },
                {
                    name: 'Pembelian',
                    href: '/purchases',
                    permission: 'purchases.view',
                },
            ],
        },
        {
            name: 'Laporan',
            icon: ChartBarIcon,
            permission: 'reports.view',
            subMenu: [
                {
                    name: 'Laporan Penjualan',
                    href: '/reports/sales',
                    permission: 'reports.sales',
                },
                {
                    name: 'Laporan Stok',
                    href: '/reports/stock',
                    permission: 'reports.stock',
                },
            ],
        },
        {
            name: 'Pengaturan',
            icon: CogIcon,
            permission: 'settings.view',
            href: '/settings',
        },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (!item.permission) return true;
        return hasPermission(item.permission);
    });

    return (
        <>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                >
                    <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
                </div>
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
                md:translate-x-0 md:static md:inset-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    <h1 className="text-xl font-semibold text-gray-900">StockTrackApp</h1>
                    <button
                        type="button"
                        className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-5 px-2">
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
                                                    ${isActive(item.href)
                                                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                    }
                                                `}
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
                                                <ul className="mt-1 ml-8 space-y-1">
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
