import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Alert, LoadingSpinner, Badge } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const Show = ({ product, errors, flash }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const [loading, setLoading] = useState(false);
  const [deletingVariantId, setDeletingVariantId] = useState(null);

  // Handle product delete
  const handleDeleteProduct = () => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini? Semua varian terkait juga akan dihapus.')) {
      router.delete(route('products.destroy', product.id), {
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      });
    }
  };

  // Handle variant delete
  const handleDeleteVariant = (variantId) => {
    if (confirm('Apakah Anda yakin ingin menghapus varian ini?')) {
      setDeletingVariantId(variantId);
      router.delete(route('product-variants.destroy', variantId), {
        onSuccess: () => {
          setDeletingVariantId(null);
        },
        onError: () => {
          setDeletingVariantId(null);
        },
      });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout title="Detail Produk">
      <Head title={product?.name || 'Detail Produk'} />

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <Link
                href={route('products.index')}
                className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  {product?.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  SKU: {product?.sku}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {can('products.update') && (
              <Link
                href={route('products.edit', product.id)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Produk
              </Link>
            )}
            {can('products.delete') && (
              <button
                onClick={handleDeleteProduct}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Hapus Produk
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Flash Messages */}
        {flash?.success && (
          <Alert type="success" message={flash.success} className="mb-4" />
        )}
        {flash?.error && (
          <Alert type="error" message={flash.error} className="mb-4" />
        )}
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

        {/* Product Information Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Informasi Produk
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Detail lengkap mengenai produk ini
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Nama Produk</dt>
                <dd className="mt-1 text-sm text-gray-900 font-semibold">{product?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">SKU Produk</dt>
                <dd className="mt-1">
                  <Badge variant="info">{product?.sku}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Jumlah Varian</dt>
                <dd className="mt-1">
                  <Badge variant="success">{product?.variants_count || 0} Varian</Badge>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Deskripsi</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {product?.description || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Dibuat Pada</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(product?.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Terakhir Diupdate</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(product?.updated_at)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Variants Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Daftar Varian
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Semua varian yang terkait dengan produk ini
                </p>
              </div>
              {can('product-variants.create') && (
                <Link
                  href={route('products.edit', product.id)}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Tambah Varian
                </Link>
              )}
            </div>
          </div>

          {/* Variants List */}
          {product?.variants && product.variants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Varian
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Current
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {product.variants.map((variant) => (
                    <tr key={variant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {variant.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">{variant.sku}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          variant.stock_current > 10
                            ? 'bg-green-100 text-green-800'
                            : variant.stock_current > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {variant.stock_current} unit
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {can('product-variants.update') && (
                            <Link
                              href={route('products.edit', product.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Varian"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </Link>
                          )}
                          {can('product-variants.delete') && (
                            <button
                              onClick={() => handleDeleteVariant(variant.id)}
                              disabled={deletingVariantId === variant.id || loading}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hapus Varian"
                            >
                              {deletingVariantId === variant.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <TrashIcon className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Belum Ada Varian</h3>
              <p className="text-sm text-gray-500 mb-4">
                Produk ini belum memiliki varian. Tambahkan varian sekarang.
              </p>
              {can('product-variants.create') && (
                <Link
                  href={route('products.edit', product.id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Tambah Varian
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Varian</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {product?.variants_count || 0}
                    </dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Stock</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {product?.variants?.reduce((sum, v) => sum + v.stock_current, 0) || 0} unit
                    </dd>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Terakhir Update</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {product?.updated_at
                        ? new Date(product.updated_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '-'}
                    </dd>
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
              <h3 className="text-sm font-medium text-blue-800">Informasi Produk</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Gunakan tombol "Edit Produk" untuk mengubah informasi produk dan menambah varian baru</li>
                  <li>Setiap varian dapat diedit atau dihapus secara terpisah</li>
                  <li>Stock varian ditampilkan dengan indikator warna: hijau (lebih dari 10), kuning (1-10), merah (0)</li>
                  <li>Hapus produk akan menghapus semua varian terkait secara permanen</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Show;
