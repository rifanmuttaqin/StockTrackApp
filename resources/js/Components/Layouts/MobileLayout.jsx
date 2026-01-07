import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import BottomNavigation from '../Navigation/BottomNavigation';
import MobileMenu from '../Navigation/MobileMenu';
import { Menu } from 'lucide-react';
import { Button } from '../UI/button';

const MobileLayout = ({ title, children, header }) => {
  const { isMobile, isSmallMobile } = useMobileDetection();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isMobile) {
    // Jika bukan mobile, render children tanpa wrapper mobile
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Head title={title} />

      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Menu size={20} />
          </Button>

          {/* Page Title */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900 font-poppins truncate">
              {title || 'StockTrackApp'}
            </h1>
          </div>

          {/* Spacer untuk balance */}
          <div style={{ width: '44px' }}></div>
        </div>

        {/* Optional Header Content */}
        {header && (
          <div className="px-4 pb-3">
            {header}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 custom-scrollbar">
        <div className="px-4 py-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
};

export default MobileLayout;
