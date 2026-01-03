import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import StatCard from './StatCard';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import { MobileAlert } from '@/Components/UI/MobileAlert';
import { MobileLoadingSpinner } from '@/Components/UI/MobileLoadingSpinner';
import { cn } from '@/lib/utils';
import { useDebouncedCallback, useStableCallback, measurePerformance } from '@/utils/performance';
import { useMobileDetection } from '@/Hooks/useMobileDetection';
import MobileLayout from '@/Components/Layouts/MobileLayout';

const MobileDashboard = ({
  user,
  stats = [],
  activities = [],
  quickActions = [],
  isLoading = false,
  error = null,
  className,
  ...props
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e) => {
    touchEndX.current = 0;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeTab === 'overview') {
      setActiveTab('activity');
    }
    if (isRightSwipe && activeTab === 'activity') {
      setActiveTab('overview');
    }
  }, [activeTab]);

  const handleRefresh = useStableCallback(async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  });

  const defaultStats = [
    {
      title: "Total Produk",
      value: "1,234",
      change: "+12%",
      changeType: "positive",
      trend: "up",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Stok Menipis",
      value: "23",
      change: "-5%",
      changeType: "negative",
      trend: "down",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Penjualan Hari Ini",
      value: "Rp 2.5M",
      change: "+18%",
      changeType: "positive",
      trend: "up",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Pesanan Baru",
      value: "45",
      change: "+8%",
      changeType: "positive",
      trend: "up",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
      )
    }
  ];

  const defaultActivities = [
    {
      type: 'inventory',
      title: 'Produk baru ditambahkan',
      description: 'Laptop ASUS ROG Gaming Series',
      timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    },
    {
      type: 'user',
      title: 'Pengguna baru terdaftar',
      description: 'John Doe bergabung sebagai admin',
      timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
    },
    {
      type: 'report',
      title: 'Laporan stok dibuat',
      description: 'Laporan stok bulanan November 2023',
      timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    },
    {
      type: 'inventory',
      title: 'Stok produk diperbarui',
      description: 'Mouse Gaming Logitech G502',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
      type: 'settings',
      title: 'Pengaturan sistem diubah',
      description: 'Update konfigurasi notifikasi email',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
    }
  ];

  const defaultQuickActions = [
    {
      label: 'Tambah Produk',
      icon: 'add',
      variant: 'primary',
      onClick: () => console.log('Add product clicked')
    },
    {
      label: 'Kelola Stok',
      icon: 'inventory',
      variant: 'success',
      onClick: () => console.log('Manage inventory clicked')
    },
    {
      label: 'Laporan',
      icon: 'report',
      variant: 'warning',
      onClick: () => console.log('Reports clicked')
    },
    {
      label: 'Pengguna',
      icon: 'users',
      variant: 'default',
      onClick: () => console.log('Users clicked')
    }
  ];

  const statsData = useMemo(() => stats.length > 0 ? stats : defaultStats, [stats]);
  const activitiesData = useMemo(() => activities.length > 0 ? activities : defaultActivities, [activities]);
  const quickActionsData = useMemo(() => quickActions.length > 0 ? quickActions : defaultQuickActions, [quickActions]);

  const { isMobile } = useMobileDetection();

  // Custom header for MobileLayout
  const customHeader = (
    <div className="bg-white border-b border-gray-200">
      {/* Tab Navigation */}
      <div className="px-4 py-2">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'py-2 px-1 border-b-2 font-poppins text-sm font-medium transition-colors',
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={cn(
              'py-2 px-1 border-b-2 font-poppins text-sm font-medium transition-colors',
              activeTab === 'activity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Aktivitas
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <MobileLayout
      title="Dashboard"
      header={customHeader}
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Head title="Dashboard" />

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {error && (
          <MobileAlert variant="destructive">
            {error}
          </MobileAlert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <MobileLoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {statsData.map((stat, index) => (
                    <StatCard key={`stat-${stat.title}-${index}`} {...stat} />
                  ))}
                </div>

                {/* Quick Actions */}
                <QuickActions
                  actions={quickActionsData}
                  columns={2}
                />
              </>
            )}

            {activeTab === 'activity' && (
              <RecentActivity
                activities={activitiesData}
                onViewAllClick={() => console.log('View all activities')}
              />
            )}
          </>
        )}
      </div>
    </MobileLayout>
  );
};

// Wrap with memo for performance optimization
const OptimizedMobileDashboard = memo(MobileDashboard);

export default OptimizedMobileDashboard;
