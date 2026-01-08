import React, { useState, useEffect, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Alert, LoadingSpinner, Badge } from '../../Components/UI';
import { MobileCard } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

/**
 * Komponen Index untuk Stock Out
 * Menampilkan daftar stock out records dengan filter, statistik, dan action buttons
 *
 * @param {Object} props - Props dari backend
 * @param {Array} props.stockOutRecords - Array stock out records
 * @param {Object} props.statistics - Statistik stock out
 * @param {Object} props.filters - Filter aktif
 * @param {Object} props.meta - Metadata pagination
 */
const Index = ({ stockOutRecords, statistics, filters, meta }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /**
   * Handle perubahan filter status
   * @param {string} status - Status filter (all, draft, submit)
   */
  const handleStatusFilterChange = useCallback((status) => {
    setStatusFilter(status);
    const newFilters = { ...filters, status: status === 'all' ? '' : status, page: 1 };

    router.get(
      route('stock-out.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  }, [filters]);

  /**
   * Handle navigasi ke halaman create
   */
  const handleCreate = useCallback(() => {
    router.get(route('stock-out.create'));
  }, []);

  /**
   * Handle edit stock out record
   * @param {string} id - ID stock out record
   */
  const handleEdit = useCallback((id) => {
    router.get(route('stock-out.edit', id));
  }, []);

  /**
   * Handle submit stock out record
   * @param {string} id - ID stock out record
   */
  const handleSubmit = useCallback((id) => {
    if (confirm('Apakah Anda yakin ingin mengirim stock out ini? Tindakan ini tidak dapat dibatalkan.')) {
      router.post(route('stock-out.submit', id), {}, {
        onSuccess: () => {
          router.reload({ only: ['stockOutRecords', 'statistics'] });
        },
      });
    }
  }, []);

  /**
   * Handle delete stock out record
   * @param {Object} record - Stock out record yang akan dihapus
   */
  const handleDelete = useCallback((record) => {
    setDeleteConfirm(record);
  }, []);

  /**
   * Konfirmasi delete stock out record
   */
  const confirmDelete = useCallback(() => {
    if (deleteConfirm) {
      router.delete(route('stock-out.destroy', deleteConfirm.id), {
        onSuccess: () => {
          router.reload({ only: ['stockOutRecords', 'statistics'] });
          setDeleteConfirm(null);
        },
      });
    }
  }, [deleteConfirm]);

  /**
   * Batal delete stock out record
   */
  const cancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  /**
   * Handle perubahan halaman pagination
   * @param {number} page - Nomor halaman
   */
  const handlePageChange = useCallback((page) => {
    const newFilters = { ...filters, page };

    router.get(
      route('stock-out.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  }, [filters]);

  /**
   * Render status badge
   * @param {string} status - Status stock out
   * @returns {JSX.Element} Status badge component
   */
  const renderStatusBadge = useCallback((status) => {
    const statusConfig = {
      draft: {
        label: 'Draft',
        variant: 'yellow',
        icon: ClockIcon,
      },
      submitted: {
        label: 'Submit',
        variant: 'green',
        icon: CheckCircleIcon,
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  }, []);

  /**
   * Render stock out card untuk mobile dan desktop
   * @param {Object} record - Stock out record
   * @returns {JSX.Element} Stock out card component
   */
  const renderStockOutCard = useCallback((record) => {
    const isDraft = record.status === 'draft';

    return (
      <MobileCard key={record.id} className="mb-4">
        <MobileCardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
              <MobileCardTitle className="text-sm">
                {new Date(record.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </MobileCardTitle>
            </div>
            {renderStatusBadge(record.status)}
          </div>
        </MobileCardHeader>
        <MobileCardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Jumlah Varian:</span>
              <span className="font-medium text-gray-900">{record.items_count || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Quantity:</span>
              <span className="font-medium text-gray-900">{record.total_quantity || 0}</span>
            </div>
          </div>
        </MobileCardContent>
        <MobileCardFooter>
          <div className="flex gap-2 w-full">
            {can('stock-out.edit') && (
              <button
                onClick={() => handleEdit(record.id)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Edit
              </button>
            )}
            {isDraft && can('stock-out.submit') && (
              <button
                onClick={() => handleSubmit(record.id)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Submit
              </button>
            )}
            {isDraft && can('stock-out.delete') && (
              <button
                onClick={() => handleDelete(record)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                Hapus
              </button>
            )}
          </div>
        </MobileCardFooter>
      </MobileCard>
    );
  }, [can, handleEdit, handleSubmit, handleDelete, renderStatusBadge]);

  /**
   * Render empty state
   * @returns {JSX.Element} Empty state component
   */
  const renderEmptyState = useCallback(() => (
    <div className="text-center py-12">
      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada stock out</h3>
      <p className="mt-1 text-sm text-gray-500">
        {statusFilter === 'all'
          ? 'Belum ada stock out yang dibuat. Mulai dengan membuat stock out baru.'
          : `Tidak ada stock out dengan status ${statusFilter}.`}
      </p>
      {can('stock-out.create') && statusFilter === 'all' && (
        <div className="mt-6">
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Buat Stock Out Baru
          </button>
        </div>
      )}
    </div>
  ), [statusFilter, can, handleCreate]);

  return (
    <AppLayout
      title="Stock Out"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock Out' }
      ]}
    >
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Daftar Stock Keluar
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Kelola stock out dan tracking pengeluaran produk
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {can('stock-out.create') && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Buat Stock Out Baru
              </button>
            )}
          </div>
        </div>

        {/* Flash Messages */}
        {props.flash?.success && (
          <Alert type="success" message={props.flash.success} className="mb-4" />
        )}
        {props.flash?.error && (
          <Alert type="error" message={props.flash.error} className="mb-4" />
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          {/* Total Draft */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Draft</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics?.total_draft || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Submit */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Submit</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics?.total_submit || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Items */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics?.total_items || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleStatusFilterChange('all')}
                className={`${
                  statusFilter === 'all'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Semua
              </button>
              <button
                onClick={() => handleStatusFilterChange('draft')}
                className={`${
                  statusFilter === 'draft'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Draft
              </button>
              <button
                onClick={() => handleStatusFilterChange('submitted')}
                className={`${
                  statusFilter === 'submitted'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Submit
              </button>
            </nav>
          </div>
        </div>

        {/* Stock Out Records List */}
        <div className="bg-white shadow sm:rounded-lg p-4 sm:p-6">
          {stockOutRecords && stockOutRecords.length > 0 ? (
            <div>
              {stockOutRecords.map(renderStockOutCard)}

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="mt-6">
                  {isMobile ? (
                    <div className="flex justify-between items-center bg-white px-4 py-3 rounded-lg shadow">
                      <button
                        onClick={() => handlePageChange(Math.max(1, meta.current_page - 1))}
                        disabled={meta.current_page <= 1}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Halaman {meta.current_page} dari {meta.last_page}
                      </span>
                      <button
                        onClick={() => handlePageChange(Math.min(meta.last_page, meta.current_page + 1))}
                        disabled={meta.current_page >= meta.last_page}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(Math.max(1, meta.current_page - 1))}
                          disabled={meta.current_page <= 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Halaman {meta.current_page} dari {meta.last_page}
                        </span>
                        <button
                          onClick={() => handlePageChange(Math.min(meta.last_page, meta.current_page + 1))}
                          disabled={meta.current_page >= meta.last_page}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Hapus Stock Out
                  </h3>
                  <p className="text-sm text-gray-500">
                    Apakah Anda yakin ingin menghapus stock out ini? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tanggal:</span> {new Date(deleteConfirm.date).toLocaleDateString('id-ID')}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Jumlah Varian:</span> {deleteConfirm.items_count}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Quantity:</span> {deleteConfirm.total_quantity}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
