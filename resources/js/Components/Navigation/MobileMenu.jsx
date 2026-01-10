import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  X,
  Home,
  Package,
  Users,
  Settings,
  LogOut,
  User,
  ChevronDown,
  UserPlus,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../UI/button';
import { useAuth } from '../../Context/AuthContext';

const MobileMenu = ({ isOpen, onClose }) => {
  const { url, props } = usePage();
  const { auth } = props;
  const { hasPermission } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Refs for keyboard navigation
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: url === '/dashboard' || url.startsWith('/dashboard'),
      permission: null
    },
    {
      name: 'Produk',
      href: '/products',
      icon: Package,
      active: url === '/products' || url.startsWith('/products'),
      permission: null
    },
    {
      name: 'Template',
      href: '/templates',
      icon: FileText,
      active: url === '/templates' || url.startsWith('/templates'),
      permission: 'templates.view'
    },
    {
      name: 'Stock Out',
      href: '/stock-out',
      icon: ArrowLeft,
      active: url === '/stock-out' || url.startsWith('/stock-out'),
      permission: 'stock_out.view'
    },
    {
      name: 'Pengguna',
      href: '/users',
      icon: Users,
      active: url === '/users' || url.startsWith('/users'),
      permission: 'users.index',
      subMenu: [
        {
          name: 'Daftar Pengguna',
          href: '/users',
          icon: Users,
          permission: 'users.index'
        },
        {
          name: 'Buat Pengguna Baru',
          href: '/users/create',
          icon: UserPlus,
          permission: 'users.create'
        }
      ]
    },
    {
      name: 'Pengaturan',
      href: '/settings',
      icon: Settings,
      active: url === '/settings' || url.startsWith('/settings'),
      permission: null
    }
  ];

  // Filter navigation items based on permissions
  const filteredNavigationItems = navigationItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // ESC key closes the menu
      if (event.key === 'Escape') {
        onClose();
      }

      // Handle arrow key navigation within the menu
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        // Focus management for keyboard navigation would go here
        // For simplicity, we're just preventing default behavior
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className="fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        ref={menuRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600">
          <h2 id="mobile-menu-title" className="text-lg font-semibold text-white font-poppins">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-blue-700"
            aria-label="Tutup menu"
          >
            <X size={20} />
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 font-poppins">
                {auth?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 font-poppins">
                {auth?.user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2" role="navigation" aria-label="Main navigation">
          {filteredNavigationItems.map((item) => {
            const Icon = item.icon;
            const hasSubMenu = item.subMenu && item.subMenu.length > 0;
            const isMenuOpen = userMenuOpen === item.name;

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
              <div key={item.name}>
                {hasSubMenu ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(isMenuOpen ? null : item.name)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors duration-200 ${
                        item.active
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      style={{ minHeight: '44px' }}
                      aria-expanded={isMenuOpen}
                      aria-haspopup="true"
                      aria-controls={`submenu-${item.name}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon
                          size={18}
                          className={item.active ? 'text-blue-700' : 'text-gray-500'}
                        />
                        <span className="text-sm font-medium font-poppins">
                          {item.name}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isMenuOpen && (
                      <div
                        id={`submenu-${item.name}`}
                        className="ml-4 mt-1 space-y-1"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        {filteredSubMenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={onClose}
                              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                                url === subItem.href
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              style={{ minHeight: '44px' }}
                              role="menuitem"
                            >
                              <SubIcon
                                size={16}
                                className={url === subItem.href ? 'text-blue-700' : 'text-gray-400'}
                              />
                              <span className="text-sm font-medium font-poppins">
                                {subItem.name}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                      item.active
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={{ minHeight: '44px' }}
                    role="menuitem"
                  >
                    <Icon
                      size={18}
                      className={item.active ? 'text-blue-700' : 'text-gray-500'}
                    />
                    <span className="text-sm font-medium font-poppins">
                      {item.name}
                    </span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/logout"
            method="post"
            as="button"
            className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            style={{ minHeight: '44px' }}
            role="menuitem"
          >
            <LogOut size={18} />
            <span className="font-poppins">Keluar</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
