import React, { useState, useEffect, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Table from '../../Components/Common/Table';
import { Alert, LoadingSpinner, Badge } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const Index = ({ templates, filters, meta }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters?.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(filters?.search || '');

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };

    router.get(
      route('templates.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update search when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== filters?.search) {
      handleFilterChange('search', debouncedSearch);
    }
  }, [debouncedSearch]);

  const handleSortChange = (field) => {
    const newOrder = filters?.sort === field && filters?.order === 'asc' ? 'desc' : 'asc';
    const newFilters = { ...filters, sort: field, order: newOrder, page: 1 };

    router.get(
      route('templates.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  const handlePageChange = (page) => {
    const newFilters = { ...filters, page };

    router.get(
      route('templates.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  const handleDelete = (template) => {
    if (confirm('Apakah Anda yakin ingin menghapus template ini? Tindakan ini tidak dapat dibatalkan.')) {
      router.delete(route('templates.destroy', template.id), {
        onSuccess: () => {
          router.reload({ only: ['templates'] });
        },
      });
    }
  };

  const handleSetActive = (template) => {
    if (confirm(`Apakah Anda yakin ingin mengaktifkan template "${template.name}"? Template aktif saat ini akan dinonaktifkan.`)) {
      router.post(route('templates.set-active', template.id), {}, {
        onSuccess: () => {
          router.reload({ only: ['templates'] });
        },
      });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: 'Nama Template',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          {row.is_active && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Aktif
            </span>
          )}
          <div className="font-medium text-gray-900">
            {value}
          </div>
        </div>
      ),
    },
    {
      key: 'variants_count',
      label: 'Jumlah Varian',
      sortable: true,
      render: (value, row) => (
        <Badge variant="info">{value || 0} Varian</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value, row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.is_active ? 'Aktif' : 'Tidak Aktif'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Dibuat Pada',
      sortable: true,
      render: (value, row) => (
        <span className="text-sm text-gray-600">
          {formatDate(value)}
        </span>
      ),
    },
  ];

  // Define table actions
  const getActions = (template) => {
    const actions = [];

    if (can('templates.view')) {
      actions.push({
        key: 'view',
        icon: EyeIcon,
        className: 'text-blue-600 hover:text-blue-900',
        title: 'Lihat Detail',
        onClick: () => router.get(route('templates.show', template.id)),
      });
    }

    if (can('templates.edit')) {
      actions.push({
        key: 'edit',
        icon: PencilIcon,
        className: 'text-indigo-600 hover:text-indigo-900',
        title: 'Edit Template',
        onClick: () => router.get(route('templates.edit', template.id)),
      });
    }

    // Check if template is not active and user has update permission
    const isActive = template.is_active === true || template.is_active === 1;
    if (!isActive && can('templates.update')) {
      actions.push({
        key: 'set-active',
        icon: CheckCircleIcon,
        className: 'text-green-600 hover:text-green-900',
        title: 'Set Aktif',
        onClick: () => handleSetActive(template),
      });
    }

    if (can('templates.delete')) {
      actions.push({
        key: 'delete',
        icon: TrashIcon,
        className: 'text-red-600 hover:text-red-900',
        title: 'Hapus Template',
        onClick: () => handleDelete(template),
      });
    }

    return actions;
  };

  return (
    <AppLayout
      title="Templates"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Templates' }
      ]}
    >
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Manajemen Templates
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Kelola template dan varian produk yang terkait
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {can('templates.create') && (
              <Link
                href={route('templates.create')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Template
              </Link>
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

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama template..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <Table
            columns={columns}
            data={templates?.data || []}
            loading={loading}
            sortable={true}
            sortColumn={filters?.sort}
            sortDirection={filters?.order}
            onSort={handleSortChange}
            actions={getActions}
            emptyMessage="Tidak ada template ditemukan"
            rowClassName={(row) => row.is_active ? 'bg-green-50' : ''}
          />
        </div>

        {/* Pagination */}
        {meta && (
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
              <div className="flex justify-between items-center bg-white px-4 py-3 rounded-lg shadow">
                <span className="text-sm text-gray-700">
                  Menampilkan {meta.from} sampai {meta.to} dari {meta.total} template
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, meta.current_page - 1))}
                    disabled={meta.current_page <= 1}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(meta.last_page, meta.current_page + 1))}
                    disabled={meta.current_page >= meta.last_page}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats - Responsive Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Template</dt>
                    <dd className="text-lg font-medium text-gray-900">{meta?.total || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Template Aktif</dt>
                    <dd className="text-lg font-medium text-gray-900">{meta?.active_count || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Varian</dt>
                    <dd className="text-lg font-medium text-gray-900">{meta?.total_variants || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Informasi Template</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Template digunakan untuk mengelompokkan varian produk</li>
                  <li>Hanya satu template yang dapat aktif dalam satu waktu</li>
                  <li>Template aktif akan digunakan untuk operasi stok</li>
                  <li>Gunakan tombol "Set Aktif" untuk mengubah template aktif</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
