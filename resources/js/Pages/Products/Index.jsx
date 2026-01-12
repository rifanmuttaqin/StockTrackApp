import React, { useState, useEffect, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Pagination, Alert, LoadingSpinner } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import ProductVariantsModal from '../../Components/Products/ProductVariantsModal';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

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
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [editingStock, setEditingStock] = useState({});
  const [stockUpdates, setStockUpdates] = useState({});
  const [originalStock, setOriginalStock] = useState({});
  const [variantNames, setVariantNames] = useState({});
  const [updatingStock, setUpdatingStock] = useState({});
  const [notification, setNotification] = useState({ type: null, message: null });

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

  const toggleRowExpansion = (productId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(productId)) {
      newExpandedRows.delete(productId);
    } else {
      newExpandedRows.add(productId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleStockEdit = (variantId, currentStock, variantName) => {
    setEditingStock((prev) => ({ ...prev, [variantId]: true }));
    setStockUpdates((prev) => ({ ...prev, [variantId]: currentStock }));
    setOriginalStock((prev) => ({ ...prev, [variantId]: currentStock }));
    setVariantNames((prev) => ({ ...prev, [variantId]: variantName }));
  };

  const handleStockChange = (variantId, value) => {
    const newValue = parseInt(value) || 0;
    setStockUpdates((prev) => ({ ...prev, [variantId]: newValue }));
  };

  const handleStockBlur = async (variantId) => {
    const newStock = stockUpdates[variantId];
    const oldStock = originalStock[variantId];
    const variantName = variantNames[variantId] || 'Varian';

    setEditingStock((prev) => ({ ...prev, [variantId]: false }));

    if (newStock === undefined) return;

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Konfirmasi Perubahan Stok',
      text: `Apakah Anda yakin ingin mengubah stok varian '${variantName}' dari ${oldStock} menjadi ${newStock}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Ubah',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });

    // If cancelled, revert the input value
    if (!result.isConfirmed) {
      setStockUpdates((prev) => ({ ...prev, [variantId]: oldStock }));
      setOriginalStock((prev) => {
        const newState = { ...prev };
        delete newState[variantId];
        return newState;
      });
      setVariantNames((prev) => {
        const newState = { ...prev };
        delete newState[variantId];
        return newState;
      });
      return;
    }

    setUpdatingStock((prev) => ({ ...prev, [variantId]: true }));

    try {
      await axios.put(`/variants/${variantId}/stock`, {
        stock_current: newStock,
      });

      // Update local state
      const updatedProducts = products.data.map((product) => {
        if (product.variants) {
          const updatedVariants = product.variants.map((variant) => {
            if (variant.id === variantId) {
              return { ...variant, stock_current: newStock };
            }
            return variant;
          });

          // Recalculate total_stock
          const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock_current, 0);
          return {
            ...product,
            variants: updatedVariants,
            total_stock: newTotalStock,
          };
        }
        return product;
      });

      // Update products data
      products.data = updatedProducts;

      // Show SweetAlert2 success toast
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: 'Stok berhasil diperbarui',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });
    } catch (error) {
      
      // Show SweetAlert2 error toast
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: error.response?.data?.message || 'Gagal memperbarui stok',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
      });

      // Revert the input value on error
      setStockUpdates((prev) => ({ ...prev, [variantId]: oldStock }));
    } finally {
      setUpdatingStock((prev) => ({ ...prev, [variantId]: false }));
      setStockUpdates((prev) => {
        const newState = { ...prev };
        delete newState[variantId];
        return newState;
      });
      setOriginalStock((prev) => {
        const newState = { ...prev };
        delete newState[variantId];
        return newState;
      });
      setVariantNames((prev) => {
        const newState = { ...prev };
        delete newState[variantId];
        return newState;
      });
    }
  };

  const handleStockKeyPress = (e, variantId) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const getStockBadgeColor = (stock) => {
    if (stock > 10) return 'bg-green-100 text-green-800';
    if (stock > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

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

  const getSortIcon = (field) => {
    if (filters?.sort !== field) return null;
    return filters?.order === 'asc' ? '↑' : '↓';
  };

  return (
    <AppLayout
      title="Produk"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Produk' }
      ]}
    >
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
        {notification.type && (
          <Alert type={notification.type} message={notification.message} className="mb-4" />
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    {/* Expand/Collapse column */}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nama Produk</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('sku')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>SKU</span>
                      {getSortIcon('sku')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('variants_count')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Jumlah Varian</span>
                      {getSortIcon('variants_count')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('total_stock')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Stok Saat Ini</span>
                      {getSortIcon('total_stock')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products?.data && products.data.length > 0 ? (
                  products.data.map((product) => (
                    <React.Fragment key={product.id}>
                      {/* Product Row */}
                      <tr
                        className={`hover:bg-gray-50 ${product.deleted_at ? 'bg-gray-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.variants && product.variants.length > 0 && (
                            <button
                              onClick={() => toggleRowExpansion(product.id)}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              {expandedRows.has(product.id) ? (
                                <ChevronDownIcon className="h-5 w-5" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {product.deleted_at && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Deleted
                              </span>
                            )}
                            <div
                              className={`font-medium ${
                                product.deleted_at ? 'text-gray-500 line-through' : 'text-gray-900'
                              }`}
                            >
                              {product.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.deleted_at ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {product.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`max-w-xs truncate ${product.deleted_at ? 'text-gray-400' : 'text-gray-600'}`}>
                            {product.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.deleted_at ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
                          }`}>
                            {product.variants_count || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockBadgeColor(product.total_stock || 0)}`}>
                            {product.total_stock || 0} unit
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {getActions(product).map((action, actionIndex) => (
                              <button
                                key={action.key || actionIndex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(product);
                                }}
                                className={action.className || 'text-blue-600 hover:text-blue-900'}
                                title={action.title}
                              >
                                <action.icon className="h-5 w-5" />
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>

                      {/* Variant Details Row (Collapsible) */}
                      {expandedRows.has(product.id) && product.variants && product.variants.length > 0 && (
                        <tr className="bg-gray-50">
                          <td colSpan="7" className="px-6 py-4">
                            <div className="ml-8">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Detail Varian</h4>
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Nama Varian
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      SKU Varian
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Stock Saat Ini
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {product.variants.map((variant) => (
                                    <tr key={variant.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {variant.name}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                          {variant.sku}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        {editingStock[variant.id] ? (
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="number"
                                              min="0"
                                              value={stockUpdates[variant.id] ?? variant.stock_current}
                                              onChange={(e) => handleStockChange(variant.id, e.target.value)}
                                              onBlur={() => handleStockBlur(variant.id)}
                                              onKeyDown={(e) => handleStockKeyPress(e, variant.id)}
                                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                              autoFocus
                                            />
                                            {updatingStock[variant.id] && (
                                              <LoadingSpinner size="sm" />
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockBadgeColor(variant.stock_current)}`}>
                                              {variant.stock_current} unit
                                            </span>
                                            {can('product_variants.edit') && (
                                              <button
                                                onClick={() => handleStockEdit(variant.id, variant.stock_current, variant.name)}
                                                className="text-blue-600 hover:text-blue-900 focus:outline-none"
                                                title="Edit Stok"
                                              >
                                                <PencilIcon className="h-4 w-4" />
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      {showDeleted ? "Tidak ada produk yang dihapus ditemukan" : "Tidak ada produk ditemukan"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
