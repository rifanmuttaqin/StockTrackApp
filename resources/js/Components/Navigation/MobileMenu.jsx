import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  X,
  Home,
  Package,
  Users,
  Settings,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import { Button } from '../UI/button';

const MobileMenu = ({ isOpen, onClose }) => {
  const { url, props } = usePage();
  const { auth } = props;
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: url === '/dashboard' || url.startsWith('/dashboard')
    },
    {
      name: 'Produk',
      href: '/products',
      icon: Package,
      active: url === '/products' || url.startsWith('/products')
    },
    {
      name: 'Pengguna',
      href: '/users',
      icon: Users,
      active: url === '/users' || url.startsWith('/users')
    },
    {
      name: 'Pengaturan',
      href: '/settings',
      icon: Settings,
      active: url === '/settings' || url.startsWith('/settings')
    }
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600">
          <h2 className="text-lg font-semibold text-white font-poppins">Menu</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-blue-700"
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
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  item.active
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={{ minHeight: '44px' }}
              >
                <Icon
                  size={18}
                  className={item.active ? 'text-blue-700' : 'text-gray-500'}
                />
                <span className="text-sm font-medium font-poppins">
                  {item.name}
                </span>
              </Link>
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
