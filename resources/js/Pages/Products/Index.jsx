import React, { useState, useEffect, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import Table from '../../Components/Common/Table';
import { Pagination, Alert, LoadingSpinner } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import ProductVariantsModal from '../../Components/Products/ProductVariantsModal';

const Index = ({ products, filters, meta }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters?.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(filters?.search || '');
  const [showDeleted, setShowDeleted] = useState(filters?.with_trashed === 'true');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };

    router.get(
      route('products.index'),
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

  const handleToggleDeleted = () => {
    const newValue = !showDeleted;
    setShowDeleted(newValue);
    handleFilterChange('with_trashed', newValue ? 'true' : '');
  };

  const handleSortChange = (field) => {
    const newOrder = filters?.sort === field && filters?.order === 'asc' ? 'desc' : 'asc';
    const newFilters = { ...filters, sort: field, order: newOrder, page: 1 };

    router.get(
      route('products.index'),
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
      route('products.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  const handleDelete = (product) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini? Produk akan dipindahkan ke sampah dan dapat dipulihkan kembali.')) {
      router.delete(route('products.destroy', product.id), {
        onSuccess: () => {
          router.reload({ only: ['products'] });
        },
      });
    }
  };

  const handleRestore = (product) => {
    if (confirm('Apakah Anda yakin ingin memulihkan produk ini? Produk akan kembali aktif.')) {
      router.post(route('products.restore', product.id), {}, {
        onSuccess: () => {
          router.reload({ only: ['products'] });
        },
      });
    }
  };

  const handleForceDelete = (product) => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin menghapus produk ini secara permanen? Tindakan ini tidak dapat dibatalkan!')) {
      router.delete(route('products.force', product.id), {
        onSuccess: () => {
          router.reload({ only: ['products'] });
        },
      });
    }
  };

  const handleProductClick = (product) => {
    // Hanya buka modal jika produk punya lebih dari 1 varian
    if (product.variants_count > 1) {
      setSelectedProduct(product);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: 'Nama Produk',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          {row.deleted_at && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Deleted
            </span>
          )}
          <div
            className={`font-medium cursor-pointer hover:text-indigo-600 hover:underline ${
              row.deleted_at ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
            onClick={() => handleProductClick(row)}
          >
            {value}
          </div>
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (value, row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.deleted_at ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Deskripsi',
      sortable: false,
      render: (value, row) => (
        <div className={`max-w-xs truncate ${row.deleted_at ? 'text-gray-400' : 'text-gray-600'}`}>
          {value || '-'}
        </div>
      ),
    },
    {
      key: 'variants_count',
      label: 'Jumlah Varian',
      sortable: true,
      render: (value, row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.deleted_at ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
        }`}>
          {value || 0}
        </span>
      ),
    },
  ];

  // Define table actions
  const getActions = (product) => {
    const actions = [];

    if (!product.deleted_at) {
      // Actions untuk produk aktif
      if (can('products.edit')) {
        actions.push({
          key: 'edit',
          icon: PencilIcon,
          className: 'text-blue-600 hover:text-blue-900',
          title: 'Edit Produk',
          onClick: () => router.get(route('products.edit', product.id)),
        });
      }

      if (can('products.delete')) {
        actions.push({
          key: 'delete',
          icon: TrashIcon,
          className: 'text-red-600 hover:text-red-900',
          title: 'Hapus Produk',
          onClick: () => handleDelete(product),
        });
      }
    } else {
      // Actions untuk produk yang dihapus
      if (can('products.delete')) {
        actions.push({
          key: 'restore',
          icon: ArrowPathIcon,
          className: 'text-green-600 hover:text-green-900',
          title: 'Pulihkan Produk',
          onClick: () => handleRestore(product),
        });

        actions.push({
          key: 'force-delete',
          icon: TrashIcon,
          className: 'text-red-700 hover:text-red-900',
          title: 'Hapus Permanen',
          onClick: () => handleForceDelete(product),
        });
      }
    }

    return actions;
  };

  return (
    <AppLayout title="Produk">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Manajemen Produk
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Kelola produk dan varian produk Anda
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {can('products.create') && (
              <Link
                href={route('products.create')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Produk
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

        {/* Search Bar and Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama atau SKU..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={handleToggleDeleted}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">Tampilkan Produk Dihapus</span>
            </label>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <Table
            columns={columns}
            data={products?.data || []}
            loading={loading}
            sortable={true}
            sortColumn={filters?.sort}
            sortDirection={filters?.order}
            onSort={handleSortChange}
            actions={getActions}
            emptyMessage={showDeleted ? "Tidak ada produk yang dihapus ditemukan" : "Tidak ada produk ditemukan"}
            onRowClick={handleProductClick}
            rowClassName={(row) => row.deleted_at ? 'bg-gray-50' : ''}
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
              <Pagination
                currentPage={meta.current_page}
                totalPages={meta.last_page}
                onPageChange={handlePageChange}
              />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Produk</dt>
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

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rata-rata Varian/Produk</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {meta?.total && meta?.total_variants
                        ? (meta.total_variants / meta.total).toFixed(1)
                        : '0.0'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Variants Modal */}
        <ProductVariantsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          product={selectedProduct}
        />
      </div>
    </AppLayout>
  );
};

export default Index;
