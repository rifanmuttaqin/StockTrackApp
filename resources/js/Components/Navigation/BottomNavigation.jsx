import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Home,
  Package,
  Users,
  Settings,
  Menu
} from 'lucide-react';
import { useAuth } from '../../Context/AuthContext';

const BottomNavigation = () => {
  const { url } = usePage();
  const { hasPermission } = useAuth();

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
      name: 'Pengguna',
      href: '/users',
      icon: Users,
      active: url === '/users' || url.startsWith('/users'),
      permission: 'users.index'
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

  // Adjust grid columns based on number of items
  const gridColsClass = filteredNavigationItems.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 border-t border-blue-700"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className={`grid ${gridColsClass} h-16`}>
        {filteredNavigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
                item.active
                  ? 'text-white'
                  : 'text-blue-200 hover:text-white'
              }`}
              style={{ minHeight: '44px' }}
              aria-label={item.name}
              aria-current={item.active ? 'page' : undefined}
            >
              <Icon
                size={20}
                className={`${item.active ? 'text-white' : 'text-blue-200'}`}
                aria-hidden="true"
              />
              <span
                className={`text-xs font-poppins ${
                  item.active ? 'text-white font-medium' : 'text-blue-200'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
