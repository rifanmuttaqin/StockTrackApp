import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Home,
  Package,
  Users,
  Settings,
  User,
  ChevronDown,
  UserPlus,
  FileText,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../Context/AuthContext';
import { PERMISSIONS } from '../../Utils/constants';

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
      name: 'Stock In',
      href: '/stock-in',
      icon: ArrowRight,
      active: url === '/stock-in' || url.startsWith('/stock-in'),
      permission: 'stock_in.view'
    },
    {
      name: 'Stock Opname',
      href: '/stock-opname',
      icon: ClipboardCheck,
      active: url === '/stock-opname' || url.startsWith('/stock-opname'),
      permission: 'stock_opname.view'
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
      href: '/settings/whatsapp',
      icon: Settings,
      active: url === '/settings' || url.startsWith('/settings'),
      permission: PERMISSIONS.MANAGE_SETTINGS
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

  const avatarSrc =
    auth?.user?.avatar_url ?? (auth?.user?.avatar ? `/storage/${auth.user.avatar}` : null);

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
        className="fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi utama"
        ref={menuRef}
      >
        {/* User Profile */}
        <div className="px-4 pt-6 pb-5 border-b border-slate-200 bg-appbg">
          <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center overflow-hidden">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={auth?.user?.name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : auth?.user?.name ? (
              <span className="text-xl font-semibold text-ink font-poppins">
                {auth.user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="text-ink" size={28} />
            )}
          </div>
          <p className="mt-3 text-sm font-semibold text-ink font-poppins text-left truncate max-w-full">
            {auth?.user?.name || 'User'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 font-poppins text-left truncate max-w-full">
            {auth?.user?.email || 'user@example.com'}
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" role="navigation" aria-label="Main navigation">
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
                          ? 'bg-brand-100 text-brand-800'
                          : 'text-ink hover:bg-slate-100'
                      }`}
                      style={{ minHeight: '44px' }}
                      aria-expanded={isMenuOpen}
                      aria-haspopup="true"
                      aria-controls={`submenu-${item.name}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon
                          size={18}
                          className={item.active ? 'text-brand-700' : 'text-slate-500'}
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
                                  ? 'bg-brand-100 text-brand-800'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                              style={{ minHeight: '44px' }}
                              role="menuitem"
                            >
                              <SubIcon
                                size={16}
                                className={url === subItem.href ? 'text-brand-700' : 'text-slate-400'}
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
                        ? 'bg-brand-100 text-brand-800'
                        : 'text-ink hover:bg-slate-100'
                    }`}
                    style={{ minHeight: '44px' }}
                    role="menuitem"
                  >
                    <Icon
                      size={18}
                      className={item.active ? 'text-brand-700' : 'text-slate-500'}
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
      </div>
    </>
  );
};

export default MobileMenu;
