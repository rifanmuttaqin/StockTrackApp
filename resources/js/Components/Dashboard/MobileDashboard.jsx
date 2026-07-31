import React, { useState, memo, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import StatCard from './StatCard';
import { cn } from '@/lib/utils';
import MobileLayout from '@/Components/Layouts/MobileLayout';

const PERIODS = [
    { key: 'today', label: 'Hari Ini' },
    { key: '7days', label: '7 Hari' },
    { key: '30days', label: '30 Hari' },
];

const MobileDashboard = ({
  user,
  dashboardData = {},
  filters = {},
  isLoading = false,
  error = null,
  className,
  ...props
}) => {
  const [period, setPeriod] = useState(filters?.period || '30days');

  const handlePeriodChange = useCallback((newPeriod) => {
    setPeriod(newPeriod);
    router.get(route('dashboard'), { period: newPeriod }, {
      preserveState: true,
      replace: true,
    });
  }, []);

  const statsData = useMemo(() => [
    {
      title: "Total Produk",
      value: dashboardData?.totalProducts?.toString() || "0",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      title: "Variant Aktif",
      value: dashboardData?.totalActiveVariants?.toString() || "0",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Stok Menipis",
      value: dashboardData?.lowStockCount?.toString() || "0",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    {
      title: "Total Transaksi",
      value: dashboardData?.totalTransactions?.toString() || "0",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    }
  ], [dashboardData]);

  const lowStockProducts = dashboardData?.lowStockProducts || [];

  return (
    <MobileLayout
      title="Dashboard"
      className={className}
    >
      <Head title="Dashboard" />

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Period Filter */}
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePeriodChange(p.key)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                period === p.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statsData.map((stat, index) => (
            <StatCard key={`stat-${stat.title}-${index}`} {...stat} />
          ))}
        </div>

        {/* Low Stock Products */}
        {lowStockProducts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Stok Menipis
            </h3>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-500">{item.variant_name}</p>
                  </div>
                  <span className={cn(
                    'ml-3 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full',
                    item.stock_current === 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  )}>
                    {item.stock_current}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

const OptimizedMobileDashboard = memo(MobileDashboard);

export default OptimizedMobileDashboard;
