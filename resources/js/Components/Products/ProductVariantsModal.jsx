import React from 'react';
import Modal from '../UI/Modal';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ProductVariantsModal({ isOpen, onClose, product }) {
  if (!product) return null;

  const hasVariants = product.variants && product.variants.length > 1;

  // Jika produk hanya punya 1 varian atau tidak ada varian, tidak perlu menampilkan modal
  if (!hasVariants) {
    return null;
  }

  return (
    <Modal show={isOpen} onClose={onClose} maxWidth="2xl" closeable={true}>
      <div className="bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Detail Varian Produk
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {product.name} ({product.sku})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Product Info */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nama Produk</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">SKU Produk</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {product.sku}
                </span>
              </dd>
            </div>
            {product.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Deskripsi</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.description}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Varian</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {product.variants_count || product.variants?.length || 0}
                </span>
              </dd>
            </div>
          </div>
        </div>

        {/* Variants Table */}
        <div className="px-6 py-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Daftar Varian</h4>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Varian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU Varian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Current
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {product.variants?.map((variant) => (
                  <tr key={variant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {variant.variant_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {variant.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        variant.stock_current > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {variant.stock_current}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="sm:hidden space-y-3">
            {product.variants?.map((variant) => (
              <div
                key={variant.id}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">
                      {variant.variant_name}
                    </h5>
                    <p className="mt-1 text-xs text-gray-500">SKU: {variant.sku}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    variant.stock_current > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {variant.stock_current}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Stock:</span>
                    <span className={`font-medium ${
                      variant.stock_current > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {variant.stock_current > 0 ? 'Tersedia' : 'Habis'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {(!product.variants || product.variants.length === 0) && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Tidak ada varian ditemukan</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}
