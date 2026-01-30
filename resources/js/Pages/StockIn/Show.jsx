import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { ArrowLeftIcon, PencilIcon, DocumentTextIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Alert, LoadingSpinner, Badge, Modal } from '../../Components/UI';

/**
 * Color palette for product cards
 * 15 prominent colors for visual distinction
 */
const PRODUCT_COLORS = [
  { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', badge: 'bg-red-100 text-red-800' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-800' },
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', badge: 'bg-green-100 text-green-800' },
  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', badge: 'bg-yellow-100 text-yellow-800' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-800' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', badge: 'bg-pink-100 text-pink-800' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', badge: 'bg-indigo-100 text-indigo-800' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-100 text-orange-800' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', badge: 'bg-teal-100 text-teal-800' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', badge: 'bg-cyan-100 text-cyan-800' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', badge: 'bg-rose-100 text-rose-800' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-800' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-800' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', badge: 'bg-violet-100 text-violet-800' },
  { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-900', badge: 'bg-fuchsia-100 text-fuchsia-800' },
];

/**
 * Get color for a product based on its ID
 * Uses deterministic hash to ensure same product always gets same color
 *
 * @param {string} productId - Product ID
 * @returns {Object} Color object with bg, border, text, and badge classes
 */
const getProductColor = (productId) => {
  if (!productId) return PRODUCT_COLORS[0];
  
  // Create a simple hash from the product ID
  const hash = productId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  // Use absolute value and modulo to get a consistent index
  const index = Math.abs(hash) % PRODUCT_COLORS.length;
  
  return PRODUCT_COLORS[index];
};

/**
 * Komponen Show untuk menampilkan detail Stock Masuk
 *
 * @component
 * @param {Object} props - Props dari backend
 * @param {Object} props.stockIn - Stock in record dengan items dan product variants
 * @returns {JSX.Element}
 */
const Show = ({ stockIn, items, totalQuantity, totalVariants }) => {
  const { props } = usePage();

  /**
   * Inertia form untuk submit stock in
   */
  const { data, setData, post, processing } = useForm({
    date: stockIn.date,
    note: stockIn.note || '',
    items: items.map((item) => ({
      product_variant_id: item.productVariant.id,
      quantity: item.quantity,
    })),
  });

  /**
   * State untuk modal konfirmasi submit
   * @type {boolean}
   */
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  /**
   * State untuk pesan error/success
   * @type {{type: 'success'|'error'|null, message: string|null}}
   */
  const [message, setMessage] = useState({ type: null, message: null });

  /**
   * Format tanggal ke format Indonesia
   *
   * @param {string} dateString - Tanggal dalam format ISO
   * @returns {string} - Tanggal dalam format Indonesia
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Format tanggal dan waktu ke format Indonesia
   *
   * @param {string} dateString - Tanggal dalam format ISO
   * @returns {string} - Tanggal dan waktu dalam format Indonesia
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Status configuration matching Index.jsx
   */
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
  
  const status = statusConfig[stockIn.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  /**
   * Handle submit stock in
   */
  const handleSubmit = () => {
    post(route('stock-in.submit', stockIn.id), {
      onSuccess: () => {
        setMessage({ type: 'success', message: 'Stock in berhasil disubmit' });
        setShowSubmitModal(false);
      },
      onError: (errors) => {
        setMessage({ type: 'error', message: 'Gagal submit stock in' });
        setShowSubmitModal(false);
      },
    });
  };

  /**
   * Hitung total items dan total quantity
   */
  const totalItems = totalVariants || 0;

  return (
    <AppLayout
      title={`Stock In - ${formatDate(stockIn.date)}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock In', href: '/stock-in' },
        { label: 'Detail' }
      ]}
    >
      <Head title={`Stock In - ${formatDate(stockIn.date)}`} />
      
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-20 sm:pb-0">
        {/* Header with back button */}
        <div className="mb-6">
          <Link
            href={route('stock-in.index')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Kembali ke Daftar
          </Link>
        </div>
        
        {/* Flash Messages */}
        {props.flash?.success && (
          <Alert type="success" message={props.flash.success} className="mb-4" />
        )}
        {props.flash?.error && (
          <Alert type="error" message={props.flash.error} className="mb-4" />
        )}

        {/* Custom Message */}
        {message.type && (
          <Alert type={message.type} message={message.message} className="mb-4" />
        )}
        
        {/* Loading Overlay */}
        {processing && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}
        
        {/* Stock In Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {stockIn.transaction_code || 'N/A'}
                </h1>
              </div>
              <p className="text-sm text-gray-500">
                Tanggal: {formatDate(stockIn.date)}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${status.variant}-100 text-${status.variant}-800 mt-2 sm:mt-0`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {status.label}
            </span>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Produk</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{totalQuantity}</p>
            </div>
          </div>
          
          {/* Note Section */}
          {stockIn.note && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <DocumentTextIcon className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-900">Catatan</h4>
                  <p className="text-sm text-amber-800 mt-1">{stockIn.note}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Timestamps */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Dibuat: {formatDateTime(stockIn.created_at)}
            </p>
            <p className="text-sm text-gray-500">
              Terakhir Diupdate: {formatDateTime(stockIn.updated_at)}
            </p>
          </div>
        </div>
        
        {/* Items List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Items</h2>
          
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Tidak ada items</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                // Get color based on product ID for consistent coloring
                const productId = item.productVariant?.product?.id;
                const color = getProductColor(productId);
                
                return (
                  <div key={item.id} className={`border ${color.border} rounded-lg p-4 ${color.bg}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${color.text}`}>
                          {item.productVariant?.product?.name || 'Produk Tidak Diketahui'}
                        </h3>
                        <p className={`text-sm ${color.text} opacity-75`}>
                          {item.productVariant?.variant_name || 'Varian Tidak Diketahui'}
                        </p>
                        <p className={`text-xs ${color.text} opacity-60 mt-1`}>
                          SKU: {item.productVariant?.sku || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right mt-2 sm:mt-0">
                        <p className={`text-2xl font-bold ${color.text}`}>
                          {item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">Qty</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={route('stock-in.index')}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Kembali
            </Link>
            {stockIn.status === 'draft' && (
              <>
                <Link
                  href={route('stock-in.edit', stockIn.id)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Edit Draft
                </Link>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Submit
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          title="Konfirmasi Submit Stock In"
          size="sm"
        >
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Submit Stock In
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Apakah Anda yakin ingin submit stock in ini? Stock akan bertambah secara permanen.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Transaction Code:</span>
                <p className="text-gray-900">{stockIn.transaction_code || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tanggal:</span>
                <p className="text-gray-900">{formatDate(stockIn.date)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Produk:</span>
                <p className="text-gray-900">{totalVariants}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Quantity:</span>
                <p className="text-gray-900">{totalQuantity}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Mensubmit...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
};

export default Show;
