import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import { Alert, LoadingSpinner } from '../../../Components/UI';
import { usePermission } from '../../../Hooks/usePermission';
import { useMobileDetection } from '../../../Hooks/useMobileDetection';
import {
  DocumentTextIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  CubeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

/**
 * Stock In Report Page Component
 * Displays stock in quantities by product variant across dates
 * Desktop-only access
 */
const Index = ({ products, stockInData, statistics, filters, error }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const [loading, setLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    product_id: filters?.product_id || '',
    start_date: filters?.start_date || '',
    end_date: filters?.end_date || '',
    status: filters?.status || 'all',
  });

  useEffect(() => {
    // Update local filters when props change
    setLocalFilters({
      product_id: filters?.product_id || '',
      start_date: filters?.start_date || '',
      end_date: filters?.end_date || '',
      status: filters?.status || 'all',
    });
  }, [filters]);

  /**
   * Handle filter change
   */
  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Apply filters
   */
  const handleApplyFilters = () => {
    router.get(
      '/reports/stock-in',
      localFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  /**
   * Reset filters
   */
  const handleResetFilters = () => {
    const resetFilters = {
      product_id: '',
      start_date: '',
      end_date: '',
      status: 'all',
    };
    setLocalFilters(resetFilters);
    router.get(
      '/reports/stock-in',
      resetFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  /**
   * Format date for display (Indonesian format: DD MonthName YYYY)
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  /**
   * Format date for input display (when not showing date picker)
   * Uses Indonesian format: DD MonthName YYYY (e.g., "12 Desember 2025")
   */
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  /**
   * Get cell value for stock in quantity
   */
  const getCellValue = (stockInByDate, date) => {
    const quantity = stockInByDate?.[date];
    return quantity && quantity > 0 ? quantity : '-';
  };

  /**
   * Render mobile access denied message
   */
  if (isMobile) {
    return (
      <AppLayout
        title="Laporan Stock In"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Laporan' },
          { label: 'Stock In' }
        ]}
      >
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CubeIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Akses Terbatas
            </h2>
            <p className="text-gray-600">
              Halaman ini hanya dapat diakses pada mode desktop.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Silakan buka aplikasi menggunakan perangkat desktop untuk melihat laporan stock in.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Laporan Stock In"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Laporan' },
        { label: 'Stock In' }
      ]}
    >
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Laporan Stock In
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Lihat dan analisis data stock in berdasarkan produk dan tanggal
            </p>
          </div>
        </div>

        {/* Flash Messages */}
        {props.flash?.success && (
          <Alert type="success" message={props.flash.success} className="mb-4" />
        )}
        {props.flash?.error && (
          <Alert type="error" message={props.flash.error} className="mb-4" />
        )}
        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Total Records */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Record</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statistics.total_records || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Quantity */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Kuantitas</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statistics.total_quantity || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Draft Records */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Draft</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statistics.draft_count || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Submitted Records */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Submit</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statistics.submitted_count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filter Laporan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Product Filter */}
            <div>
              <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-1">
                Produk
              </label>
              <select
                id="product_id"
                value={localFilters.product_id}
                onChange={(e) => handleFilterChange('product_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Semua Produk</option>
                {products && products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="start_date"
                  value={localFilters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  placeholder="DD Bulan Tahun"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer ${
                    localFilters.start_date ? 'text-transparent' : ''
                  }`}
                  style={{ colorScheme: 'light' }}
                />
                {localFilters.start_date && (
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-sm text-gray-700">
                    {formatDateForInput(localFilters.start_date)}
                  </div>
                )}
                <CalendarIcon className="absolute inset-y-0 right-0 flex items-center pr-3 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* End Date Filter */}
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Akhir
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="end_date"
                  value={localFilters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  placeholder="DD Bulan Tahun"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer ${
                    localFilters.end_date ? 'text-transparent' : ''
                  }`}
                  style={{ colorScheme: 'light' }}
                />
                {localFilters.end_date && (
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-sm text-gray-700">
                    {formatDateForInput(localFilters.end_date)}
                  </div>
                )}
                <CalendarIcon className="absolute inset-y-0 right-0 flex items-center pr-3 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={localFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Semua Status</option>
                <option value="draft">Draft</option>
                <option value="submit">Submit</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-end mt-4 space-x-3">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="mr-2 h-4 w-4" />
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FunnelIcon className="mr-2 h-4 w-4" />
              Terapkan Filter
            </button>
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Product/Variasi Column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 sticky left-0 z-10 shadow-r">
                    Produk / Variasi
                  </th>
                  {/* Date Columns */}
                  {stockInData?.dates && stockInData.dates.length > 0 ? (
                    stockInData.dates.map((date) => (
                      <th
                        key={date}
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                      >
                        {formatDate(date)}
                      </th>
                    ))
                  ) : (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                  )}
                  {/* Total (Jumlah) Column */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] bg-blue-50">
                    Jumlah
                  </th>
                  {/* Average Column */}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] bg-green-50">
                    Rata-rata
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockInData?.products && stockInData.products.length > 0 ? (
                  stockInData.products.map((product) => (
                    <React.Fragment key={product.id}>
                      {/* Product Name Row */}
                      <tr className="bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-gray-50 shadow-r">
                          {product.name}
                        </td>
                        {/* Empty cells for product row */}
                        {stockInData.dates.map((date) => (
                          <td
                            key={date}
                            className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center bg-gray-50"
                          >
                            -
                          </td>
                        ))}
                        {/* Empty cell for total column */}
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center bg-gray-50">
                          -
                        </td>
                        {/* Empty cell for average column */}
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-center bg-gray-50">
                          -
                        </td>
                      </tr>

                      {/* Variant Rows */}
                      {product.variants && product.variants.length > 0 ? (
                        product.variants.map((variant) => (
                          <tr key={variant.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 sticky left-0 bg-white shadow-r pl-10">
                              <div className="flex items-center space-x-2">
                                <span>{variant.name}</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Stok: {variant.stock}
                                </span>
                              </div>
                            </td>
                            {stockInData.dates.map((date) => (
                              <td
                                key={date}
                                className="px-6 py-3 whitespace-nowrap text-sm text-center"
                              >
                                {getCellValue(variant.stock_in_by_date, date)}
                              </td>
                            ))}
                            {/* Total (Jumlah) Column */}
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-center bg-blue-50 font-medium text-blue-700">
                              {variant.total && variant.total > 0 ? variant.total : '-'}
                            </td>
                            {/* Average Column */}
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-center bg-green-50 font-medium text-green-700">
                              {variant.average && variant.average > 0 ? variant.average.toFixed(2) : '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={stockInData.dates.length + 3}
                            className="px-6 py-4 text-sm text-gray-500 text-center"
                          >
                            Tidak ada variasi produk
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={(stockInData?.dates?.length || 0) + 3}
                      className="px-6 py-12 text-center"
                    >
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        Tidak ada data stock in
                      </h3>
                      <p className="text-sm text-gray-500">
                        Silakan ubah filter atau pilih rentang tanggal yang berbeda.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Info */}
          {stockInData?.products && stockInData.products.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">Total Produk:</span> {stockInData.products.length}
                </div>
                <div>
                  <span className="font-medium">Total Variasi:</span>{' '}
                  {stockInData.products.reduce((sum, product) => sum + (product.variants?.length || 0), 0)}
                </div>
                <div>
                  <span className="font-medium">Rentang Tanggal:</span>{' '}
                  {stockInData.dates.length > 0 && (
                    <>
                      {formatDate(stockInData.dates[0])} - {formatDate(stockInData.dates[stockInData.dates.length - 1])}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
