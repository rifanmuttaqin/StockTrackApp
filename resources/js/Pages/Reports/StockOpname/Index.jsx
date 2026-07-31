import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import { Alert, LoadingSpinner } from '../../../Components/UI';
import { usePermission } from '../../../Hooks/usePermission';
import { useMobileDetection } from '../../../Hooks/useMobileDetection';
import {
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

/**
 * Stock Opname Report Page Component
 * Displays submitted stock opname records with shortage/surplus/matching indicators
 */
const Index = ({ records = [], statistics = {}, filters = {}, error }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const [loading, setLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    date_from: filters?.date_from || '',
    date_to: filters?.date_to || '',
  });

  useEffect(() => {
    setLocalFilters({
      date_from: filters?.date_from || '',
      date_to: filters?.date_to || '',
    });
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    router.get('/reports/stock-opname', localFilters, {
      preserveState: true,
      preserveScroll: true,
      onStart: () => setLoading(true),
      onFinish: () => setLoading(false),
    });
  };

  const handleResetFilters = () => {
    const resetFilters = { date_from: '', date_to: '' };
    setLocalFilters(resetFilters);
    router.get('/reports/stock-opname', resetFilters, {
      preserveState: true,
      preserveScroll: true,
      onStart: () => setLoading(true),
      onFinish: () => setLoading(false),
    });
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (localFilters.date_from) params.append('date_from', localFilters.date_from);
    if (localFilters.date_to) params.append('date_to', localFilters.date_to);
    const query = params.toString();
    window.open(`/reports/stock-opname/export${query ? '?' + query : ''}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getKeterangan = (diff) => {
    if (diff > 0) return { label: 'Surplus', color: 'text-green-700 bg-green-50' };
    if (diff < 0) return { label: 'Shortage', color: 'text-red-700 bg-red-50' };
    return { label: 'Matching', color: 'text-gray-700 bg-gray-50' };
  };

  const getRowBg = (diff) => {
    if (diff > 0) return 'bg-green-50';
    if (diff < 0) return 'bg-red-50';
    return '';
  };

  /**
   * Flatten all records' items into a single array for table display
   */
  const flatItems = records.flatMap(record =>
    (record.items || []).map(item => ({
      record_id: record.id,
      code: record.code,
      date: record.date,
      product_name: item.product_name || '-',
      variant_name: item.variant_name || '-',
      system_stock_draft: item.system_stock_draft,
      system_stock_submit: item.system_stock_submit,
      physical_stock: item.physical_stock,
      difference: item.difference,
      status: item.status,
    }))
  );

  if (isMobile) {
    return (
      <AppLayout
        title="Laporan Stock Opname"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Laporan' },
          { label: 'Stock Opname' },
        ]}
      >
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ClipboardDocumentCheckIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Terbatas</h2>
            <p className="text-gray-600">
              Halaman ini hanya dapat diakses pada mode desktop.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Silakan buka aplikasi menggunakan perangkat desktop untuk melihat laporan stock opname.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Laporan Stock Opname"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Laporan' },
        { label: 'Stock Opname' },
      ]}
    >
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Laporan Stock Opname
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Lihat dan analisis data stock opname berdasarkan rentang tanggal
            </p>
          </div>
          {can('export_reports') && (
            <div className="mt-4 md:mt-0">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                Export CSV
              </button>
            </div>
          )}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentCheckIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Record</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.total_records || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Shortage</p>
                <p className="text-2xl font-semibold text-red-600">
                  {statistics.total_shortage || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUpIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Surplus</p>
                <p className="text-2xl font-semibold text-green-600">
                  {statistics.total_surplus || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Matching</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.total_matching || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filter Laporan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Mulai
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date_from"
                  value={localFilters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer ${
                    localFilters.date_from ? 'text-transparent' : ''
                  }`}
                  style={{ colorScheme: 'light' }}
                />
                {localFilters.date_from && (
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-sm text-gray-700">
                    {formatDate(localFilters.date_from)}
                  </div>
                )}
                <CalendarIcon className="absolute inset-y-0 right-0 flex items-center pr-3 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal Akhir
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date_to"
                  value={localFilters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer ${
                    localFilters.date_to ? 'text-transparent' : ''
                  }`}
                  style={{ colorScheme: 'light' }}
                />
                {localFilters.date_to && (
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-sm text-gray-700">
                    {formatDate(localFilters.date_to)}
                  </div>
                )}
                <CalendarIcon className="absolute inset-y-0 right-0 flex items-center pr-3 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-end">
              <div className="flex items-center justify-end w-full space-x-3">
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
          </div>
        </div>

        {/* Report Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode Transaksi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Varian
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok Sistem (Draft)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok Sistem (Submit)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok Fisik
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selisih
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flatItems.length > 0 ? (
                  flatItems.map((item, idx) => {
                    const keterangan = getKeterangan(item.difference);
                    const rowBg = getRowBg(item.difference);
                    return (
                      <tr key={`${item.record_id}-${idx}`} className={rowBg}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.code}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.product_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {item.variant_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700">
                          {item.system_stock_draft ?? '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700">
                          {item.system_stock_submit ?? '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                          {item.physical_stock ?? '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold">
                          <span className={item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : 'text-gray-600'}>
                            {item.difference > 0 ? '+' : ''}{item.difference ?? '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${keterangan.color}`}>
                            {keterangan.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        Tidak ada data stock opname
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
          {flatItems.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">Total Record:</span> {records.length}
                </div>
                <div>
                  <span className="font-medium">Total Item:</span> {flatItems.length}
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
