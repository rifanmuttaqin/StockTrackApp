import React, { useState, useEffect, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '../../Layouts/AppLayout';
import { Alert, LoadingSpinner, Badge } from '../../Components/UI';
import {
  MobileCard,
  MobileCardHeader,
  MobileCardFooter,
  MobileCardTitle,
  MobileCardContent
} from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

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
const Index = ({ stockOutRecords, pagination, statistics, filters }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Note modal state
  const [noteModal, setNoteModal] = useState({
    isOpen: false,
    recordId: null,
    currentNote: '',
  });
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteMessage, setNoteMessage] = useState({ type: '', text: '' });

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
   * Open note modal for adding/editing note
   * @param {Object} record - Stock out record
   */
  const handleOpenNoteModal = useCallback((record) => {
    setNoteModal({
      isOpen: true,
      recordId: record.id,
      currentNote: record.note || '',
    });
    setNoteText(record.note || '');
    setNoteMessage({ type: '', text: '' });
  }, []);

  /**
   * Close note modal
   */
  const handleCloseNoteModal = useCallback(() => {
    setNoteModal({
      isOpen: false,
      recordId: null,
      currentNote: '',
    });
    setNoteText('');
    setNoteMessage({ type: '', text: '' });
  }, []);

  /**
   * Save note via axios (JSON API endpoint)
   */
  const handleSaveNote = useCallback(async () => {
    if (!noteModal.recordId) return;

    setNoteLoading(true);
    setNoteMessage({ type: '', text: '' });

    try {
      const response = await axios.put(
        route('stock-out.updateNote', noteModal.recordId),
        { note: noteText.trim() || null }
      );

      if (response.data.success) {
        setNoteMessage({ type: 'success', text: response.data.message || 'Catatan berhasil disimpan' });
        // Reload the page to show updated note
        router.reload({ only: ['stockOutRecords'] });
        handleCloseNoteModal();
      } else {
        setNoteMessage({ type: 'error', text: response.data.message || 'Gagal menyimpan catatan' });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.errors?.note?.[0] ||
                          'Gagal menyimpan catatan. Silakan coba lagi.';
      setNoteMessage({ type: 'error', text: errorMessage });
    } finally {
      setNoteLoading(false);
    }
  }, [noteModal.recordId, noteText, handleCloseNoteModal]);

  /**
   * Remove note via axios (JSON API endpoint)
   * @param {string} recordId - Stock out record ID
   */
  const handleRemoveNote = useCallback(async (recordId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      return;
    }

    setNoteLoading(true);

    try {
      const response = await axios.put(
        route('stock-out.updateNote', recordId),
        { note: null }
      );

      if (response.data.success) {
        // Reload the page to show updated note
        router.reload({ only: ['stockOutRecords'] });
      } else {
        Swal.fire('Error', response.data.message || 'Gagal menghapus catatan', 'error');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.errors?.note?.[0] ||
                          'Gagal menghapus catatan. Silakan coba lagi.';
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setNoteLoading(false);
    }
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
      submit: {
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
      <MobileCard key={record.id} className="mb-4 relative">
        {/* Note Badge with Actions - Top Right Corner */}
        {record.note ? (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 max-w-[200px] truncate">
              <DocumentTextIcon className="w-3 h-3 mr-1 flex-shrink-0" />
              {record.note}
            </span>
            {/* Edit Note Button */}
            <button
              onClick={() => handleOpenNoteModal(record)}
              className="p-1.5 rounded-md bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              title="Edit Catatan"
            >
              <PencilIcon className="w-3 h-3 text-gray-600" />
            </button>
            {/* Remove Note Button */}
            <button
              onClick={() => handleRemoveNote(record.id)}
              disabled={noteLoading}
              className="p-1.5 rounded-md bg-white border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Hapus Catatan"
            >
              <XMarkIcon className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        ) : (
          /* Add Note Button - Top Right Corner */
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={() => handleOpenNoteModal(record)}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
              title="Tambah Catatan"
            >
              <DocumentTextIcon className="w-3 h-3 mr-1" />
              Tambah Catatan
            </button>
          </div>
        )}

        <MobileCardHeader className="pr-24">
          <div className="flex items-start">
            <div className="flex-1">
              {/* Transaction Code - Prominent Display */}
              <div className="flex items-center gap-2 mb-1">
                <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
                <MobileCardTitle className="text-base font-bold text-gray-900">
                  {record.transaction_code || 'N/A'}
                </MobileCardTitle>
              </div>
              {/* Date Display */}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4" />
                {new Date(record.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </MobileCardHeader>
        <MobileCardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Produk:</span>
              <span className="font-semibold text-gray-900">{record.items_count || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Quantity Out:</span>
              <span className="font-semibold text-gray-900">{record.total_quantity || 0}</span>
            </div>
          </div>
        </MobileCardContent>
        <MobileCardFooter>
          <div className="flex flex-col gap-3 w-full">
            {/* Status Badge - Bottom Left */}
            <div className="flex items-start">
              {renderStatusBadge(record.status)}
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2 w-full">
            <Link
              href={route('stock-out.show', record.id)}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              View Details
            </Link>
            {can('stock-out.edit') && (
              <button
                onClick={() => handleEdit(record.id)}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                {isDraft ? 'Continue Draft' : 'Edit'}
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
          </div>
        </MobileCardFooter>
      </MobileCard>
    );
  }, [can, handleEdit, handleSubmit, handleDelete, renderStatusBadge, handleOpenNoteModal, handleRemoveNote, noteLoading]);

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
                onClick={() => handleStatusFilterChange('submit')}
                className={`${
                  statusFilter === 'submit'
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
              {pagination && pagination.last_page > 1 && (
                <div className="mt-8">
                  {isMobile ? (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-4 rounded-xl shadow-sm border border-indigo-100">
                      <span className="text-sm font-medium text-gray-700">
                        Showing {pagination.from || 0}-{pagination.to || 0} of {pagination.total || 0} records
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                          disabled={pagination.current_page <= 1}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                          aria-label="Previous page"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>
                        <span className="inline-flex items-center px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-100 rounded-lg">
                          {pagination.current_page}
                        </span>
                        <button
                          onClick={() => handlePageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
                          disabled={pagination.current_page >= pagination.last_page}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                          aria-label="Next page"
                        >
                          Next
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      {/* Page Info */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">
                          Showing {pagination.from || 0}-{pagination.to || 0}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium text-gray-900">{pagination.total || 0}</span>
                        {' '}records
                      </div>
                      
                      {/* Pagination Controls */}
                      <nav className="flex items-center gap-1" aria-label="Pagination">
                        {/* Previous Button */}
                        <button
                          onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                          disabled={pagination.current_page <= 1}
                          className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          aria-label="Previous page"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>
                        
                        {/* Page Numbers */}
                        {(() => {
                          const pages = [];
                          const currentPage = pagination.current_page;
                          const lastPage = pagination.last_page;
                          const delta = 2; // Number of pages to show on each side
                          
                          // Always show first page
                          if (lastPage > 0) {
                            pages.push(1);
                          }
                          
                          // Show ellipsis after first page if needed
                          if (currentPage - delta > 2) {
                            pages.push('...');
                          }
                          
                          // Show pages around current page
                          for (let i = Math.max(2, currentPage - delta); i <= Math.min(lastPage - 1, currentPage + delta); i++) {
                            pages.push(i);
                          }
                          
                          // Show ellipsis before last page if needed
                          if (currentPage + delta < lastPage - 1) {
                            pages.push('...');
                          }
                          
                          // Always show last page
                          if (lastPage > 1) {
                            pages.push(lastPage);
                          }
                          
                          return pages.map((page, index) => {
                            if (page === '...') {
                              return (
                                <span
                                  key={`ellipsis-${index}`}
                                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300"
                                >
                                  ...
                                </span>
                              );
                            }
                            
                            const isActive = page === currentPage;
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center justify-center min-w-[40px] px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                  isActive
                                    ? 'relative inline-flex items-center justify-center min-w-[40px] px-3 py-2 text-sm font-semibold text-white bg-indigo-600 border border-indigo-600 rounded-lg shadow-md hover:bg-indigo-700'
                                    : 'relative inline-flex items-center justify-center min-w-[40px] px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-700'
                                }`}
                                aria-label={`Go to page ${page}`}
                                aria-current={isActive ? 'page' : undefined}
                              >
                                {page}
                              </button>
                            );
                          });
                        })()}
                        
                        {/* Next Button */}
                        <button
                          onClick={() => handlePageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
                          disabled={pagination.current_page >= pagination.last_page}
                          className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          aria-label="Next page"
                        >
                          Next
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
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
                  <span className="font-medium">Transaction Code:</span> {deleteConfirm.transaction_code || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tanggal:</span> {new Date(deleteConfirm.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Produk:</span> {deleteConfirm.items_count}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Quantity Out:</span> {deleteConfirm.total_quantity}
                </p>
                {deleteConfirm.note && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Catatan:</span> {deleteConfirm.note}
                  </p>
                )}
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

        {/* Note Modal */}
        {noteModal.isOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {noteModal.currentNote ? 'Edit Catatan' : 'Tambah Catatan'}
                  </h3>
                  <button
                    onClick={handleCloseNoteModal}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-4 py-4">
                <label htmlFor="note-text" className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  id="note-text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Masukkan catatan..."
                  disabled={noteLoading}
                />
                <div className="mt-1 text-right">
                  <span className={`text-xs ${noteText.length > 450 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {noteText.length} / 500 karakter
                  </span>
                </div>

                {/* Note Message */}
                {noteMessage.text && (
                  <div className={`mt-3 p-2 rounded-md text-sm ${
                    noteMessage.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}>
                    {noteMessage.text}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-3 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={handleCloseNoteModal}
                  disabled={noteLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={noteLoading || noteText.trim() === ''}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {noteLoading ? 'Menyimpan...' : 'Simpan'}
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
