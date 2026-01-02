import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  Home,
  Package,
  Users,
  Settings,
  Menu
} from 'lucide-react';

const BottomNavigation = () => {
  const { url } = usePage();

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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 border-t border-blue-700">
      <div className="grid grid-cols-4 h-16">
        {navigationItems.map((item) => {
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
            >
              <Icon
                size={20}
                className={`${item.active ? 'text-white' : 'text-blue-200'}`}
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
