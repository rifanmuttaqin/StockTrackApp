import React, { useState, useRef, memo, useCallback, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import StatCard from './StatCard';
import QuickActions from './QuickActions';
import { MobileAlert } from '@/Components/UI/MobileAlert';
import { MobileLoadingSpinner } from '@/Components/UI/MobileLoadingSpinner';
import { cn } from '@/lib/utils';
import { useStableCallback } from '@/utils/performance';
import MobileLayout from '@/Components/Layouts/MobileLayout';

const MobileDashboard = ({
  user,
  dashboardData = {},
  isLoading = false,
  error = null,
  className,
  ...props
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useStableCallback(async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  });

  // Build stats from dashboardData
  const statsData = useMemo(() => [
    {
      title: "Total Produk",
      value: dashboardData?.totalProducts?.toString() || "0",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Stok Menipis",
      value: dashboardData?.lowStockCount?.toString() || "0",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Record Stock Aktif",
      value: dashboardData?.todayStockRecords?.toString() || "0",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      title: "Aksi Cepat",
      value: "2 Menu",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
        </svg>
      )
    }
  ], [dashboardData]);

  // Build quick actions from dashboardData
  const quickActionsData = useMemo(() => [
    {
      label: 'Buat Stock Out',
      icon: 'add',
      variant: 'primary',
      onClick: () => window.location.href = route('stock-out.create')
    },
    {
      label: 'Daftar Stock Out',
      icon: 'list',
      variant: 'success',
      onClick: () => window.location.href = route('stock-out.index')
    }
  ], []);

  return (
    <MobileLayout
      title="Dashboard"
      className={className}
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
      </div>
    </MobileLayout>
  );
};

// Wrap with memo for performance optimization
const OptimizedMobileDashboard = memo(MobileDashboard);

export default OptimizedMobileDashboard;
