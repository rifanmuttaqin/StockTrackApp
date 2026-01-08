import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { MobileForm, MobileFormSection, MobileFormField } from '../../Components/UI/MobileForm';
import { Alert, LoadingSpinner, Badge, Modal } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import {
  ArrowLeftIcon,
  DocumentCheckIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

/**
 * Komponen Edit untuk mengedit Stock Keluar
 *
 * @component
 * @returns {JSX.Element}
 */
const Edit = ({ stockOutRecord }) => {
  const { props } = usePage();
  const { can } = usePermission();

  /**
   * State untuk menyimpan quantity untuk setiap varian
   * @type {Object.<string, number>}
   */
  const [quantities, setQuantities] = useState({});

  /**
   * State untuk menyimpan error validasi quantity
   * @type {Object.<string, string>}
   */
  const [quantityErrors, setQuantityErrors] = useState({});

  /**
   * State untuk pesan error/success
   * @type {{type: 'success'|'error'|null, message: string|null}}
   */
  const [message, setMessage] = useState({ type: null, message: null });

  /**
   * State untuk modal konfirmasi hapus
   * @type {boolean}
   */
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /**
   * Inertia form untuk data stock out
   */
  const { data, setData, put, post, processing, errors, reset } = useForm({
    date: stockOutRecord?.date || new Date().toISOString().split('T')[0],
    items: [],
  });

  /**
   * Inisialisasi quantities saat component mount
   * Setiap varian di-set ke quantity dari record
   */
  useEffect(() => {
    if (stockOutRecord?.items) {
      const initialQuantities = {};
      stockOutRecord.items.forEach((item) => {
        initialQuantities[item.product_variant_id] = item.quantity || 0;
      });
      setQuantities(initialQuantities);
    }
  }, [stockOutRecord]);

  /**
   * Update form data saat quantities berubah
   */
  useEffect(() => {
    const items = stockOutRecord?.items?.map((item) => ({
      product_variant_id: item.product_variant_id,
      quantity: quantities[item.product_variant_id] || 0,
    })) || [];
    setData('items', items);
  }, [quantities, stockOutRecord]);

  /**
   * Validasi quantity untuk varian tertentu
   * Quantity tidak boleh negatif
   *
   * @param {number} value - Nilai quantity
   * @param {string} variantId - ID varian
   * @returns {boolean} - True jika valid, false jika tidak
   */
  const validateQuantity = (value, variantId) => {
    const errors = { ...quantityErrors };

    if (value < 0) {
      errors[variantId] = 'Quantity tidak boleh negatif';
      setQuantityErrors(errors);
      return false;
    } else {
      delete errors[variantId];
      setQuantityErrors(errors);
      return true;
    }
  };

  /**
   * Handle perubahan quantity untuk varian tertentu
   *
   * @param {string} variantId - ID varian
   * @param {number} value - Nilai quantity baru
   */
  const handleQuantityChange = (variantId, value) => {
    const numValue = parseInt(value) || 0;
    validateQuantity(numValue, variantId);
    setQuantities((prev) => ({
      ...prev,
      [variantId]: numValue,
    }));
  };

  /**
   * Handle submit untuk Update Draft
   * Stock tidak berkurang
   *
   * @param {React.FormEvent} e - Event form submit
   */
  const handleUpdateDraft = (e) => {
    e.preventDefault();

    // Validasi jika record sudah disubmit - EC-PRD-022
    if (stockOutRecord?.status === 'submitted') {
      setMessage({
        type: 'error',
        message: 'Record yang sudah disubmit tidak dapat diedit'
      });
      return;
    }

    // Validasi quantity errors
    if (Object.keys(quantityErrors).length > 0) {
      setMessage({ type: 'error', message: 'Harap perbaiki error quantity sebelum menyimpan' });
      return;
    }

    // Validasi minimal satu item dengan quantity > 0
    const hasItems = data.items.some((item) => item.quantity > 0);
    if (!hasItems) {
      setMessage({ type: 'error', message: 'Minimal satu varian harus memiliki quantity > 0' });
      return;
    }

    put(route('stock-out.update', stockOutRecord.id), {
      data: { ...data, status: 'draft' },
      onSuccess: () => {
        setMessage({ type: 'success', message: 'Draft berhasil diupdate' });
      },
      onError: (errors) => {
        setMessage({ type: 'error', message: 'Gagal mengupdate draft' });
      },
    });
  };

  /**
   * Handle submit untuk Submit Stock Out
   * Stock akan berkurang
   *
   * @param {React.FormEvent} e - Event form submit
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasi jika record sudah disubmit - EC-PRD-022
    if (stockOutRecord?.status === 'submitted') {
      setMessage({
        type: 'error',
        message: 'Record yang sudah disubmit tidak dapat disubmit ulang'
      });
      return;
    }

    // Validasi quantity errors
    if (Object.keys(quantityErrors).length > 0) {
      setMessage({ type: 'error', message: 'Harap perbaiki error quantity sebelum submit' });
      return;
    }

    // Validasi minimal satu item dengan quantity > 0
    const hasItems = data.items.some((item) => item.quantity > 0);
    if (!hasItems) {
      setMessage({ type: 'error', message: 'Minimal satu varian harus memiliki quantity > 0' });
      return;
    }

    post(route('stock-out.submit', stockOutRecord.id), {
      data: { ...data, status: 'submitted' },
      onSuccess: () => {
        setMessage({ type: 'success', message: 'Stock out berhasil disubmit' });
      },
      onError: (errors) => {
        setMessage({ type: 'error', message: 'Gagal submit stock out' });
      },
    });
  };

  /**
   * Handle hapus draft - EC-PRD-023
   */
  const handleDelete = () => {
    // Validasi jika record sudah disubmit
    if (stockOutRecord?.status === 'submitted') {
      setShowDeleteModal(false);
      setMessage({
        type: 'error',
        message: 'Record yang sudah disubmit tidak dapat dihapus'
      });
      return;
    }

    // Hapus record menggunakan Inertia delete
    // Note: useForm tidak memiliki method delete, jadi gunakan router dari @inertiajs/react
    window.location.href = route('stock-out.destroy', stockOutRecord.id);
  };

  /**
   * Format tanggal ke format Indonesia
   *
   * @param {string} dateString - Tanggal dalam format YYYY-MM-DD
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
   * Get badge variant berdasarkan status
   *
   * @param {string} status - Status record
   * @returns {string} - Badge variant
   */
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'draft':
        return 'warning';
      case 'submitted':
        return 'success';
      default:
        return 'info';
    }
  };

  /**
   * Get status label
   *
   * @param {string} status - Status record
   * @returns {string} - Status label
   */
  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      default:
        return status;
    }
  };

  return (
    <AppLayout
      title="Edit Stock Keluar"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock Out', href: '/stock-out' },
        { label: 'Edit' }
      ]}
    >
      <Head title="Edit Stock Keluar" />

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-20 sm:pb-0">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Edit Stock Keluar
              </h2>
              <Badge variant={getStatusBadgeVariant(stockOutRecord?.status)}>
                {getStatusLabel(stockOutRecord?.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Edit data stock keluar dengan ID: {stockOutRecord?.id}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href={route('stock-out.index')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Kembali
            </Link>
          </div>
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

        {/* Form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <MobileForm>
            {/* Date Section */}
            <MobileFormSection
              title="Informasi Stock Keluar"
              description="Edit tanggal stock keluar"
              className="p-6 border-b border-gray-200"
            >
              <div className="grid grid-cols-1 gap-6">
                {/* Date Input */}
                <MobileFormField
                  label="Tanggal"
                  error={errors.date}
                  required
                >
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => setData('date', e.target.value)}
                    disabled={stockOutRecord?.status === 'submitted'}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </MobileFormField>

                {/* Record Info */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">ID Record</h4>
                      <p className="mt-1 text-sm text-gray-500">{stockOutRecord?.id}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Status</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        <Badge variant={getStatusBadgeVariant(stockOutRecord?.status)}>
                          {getStatusLabel(stockOutRecord?.status)}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Dibuat Pada</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {stockOutRecord?.created_at ? formatDate(stockOutRecord.created_at) : '-'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Terakhir Diupdate</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {stockOutRecord?.updated_at ? formatDate(stockOutRecord.updated_at) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </MobileFormSection>

            {/* Variants List Section */}
            <MobileFormSection
              title="Daftar Varian"
              description={`Edit quantity untuk setiap varian (${stockOutRecord?.items?.length || 0} varian)`}
              className="p-6 border-b border-gray-200"
            >
              {stockOutRecord?.items?.length > 0 ? (
                <div className="space-y-4">
                  {stockOutRecord.items.map((item, index) => (
                    <div
                      key={item.product_variant_id || index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      {/* Variant Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {item.product_variant?.name || `Varian #${index + 1}`}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            SKU: {item.product_variant?.sku || '-'}
                          </p>
                        </div>
                        <Badge variant="info">
                          Stock: {item.product_variant?.stock_current || 0}
                        </Badge>
                      </div>

                      {/* Quantity Input */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <MobileFormField
                          label="Quantity"
                          error={errors[`items.${index}.quantity`] || quantityErrors[item.product_variant_id]}
                          required
                        >
                          <input
                            type="number"
                            min="0"
                            value={quantities[item.product_variant_id] || 0}
                            onChange={(e) => handleQuantityChange(item.product_variant_id, e.target.value)}
                            disabled={stockOutRecord?.status === 'submitted'}
                            placeholder="0"
                            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                              quantityErrors[item.product_variant_id] ? 'border-red-500' : 'border-gray-300'
                            } disabled:bg-gray-100 disabled:text-gray-500`}
                          />
                        </MobileFormField>

                        {/* Product Info */}
                        <div className="flex items-center">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Produk:</span>{' '}
                            {item.product_variant?.product?.name || '-'}
                          </div>
                        </div>
                      </div>

                      {/* Error Message */}
                      {quantityErrors[item.product_variant_id] && (
                        <p className="mt-2 text-sm text-red-600">
                          {quantityErrors[item.product_variant_id]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak Ada Varian</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Record ini tidak memiliki varian.
                  </p>
                </div>
              )}

              {/* Summary */}
              {stockOutRecord?.items?.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <span className="text-sm font-medium text-blue-900">
                          Total Varian: {stockOutRecord.items.length}
                        </span>
                        <p className="text-xs text-blue-700 mt-1">
                          Total Quantity: {data.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </MobileFormSection>
          </MobileForm>
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
              <h3 className="text-sm font-medium text-blue-800">Tips Edit Stock Keluar</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Quantity tidak boleh negatif</li>
                  <li>Minimal satu varian harus memiliki quantity > 0</li>
                  <li>Update Draft untuk menyimpan tanpa mengurangi stock</li>
                  <li>Submit untuk mengurangi stock secara permanen</li>
                  <li>Record yang sudah disubmit tidak dapat diedit atau dihapus</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons - Mobile First */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:hidden z-40 shadow-lg">
        <div className="flex flex-col space-y-3">
          {stockOutRecord?.status === 'draft' && (
            <>
              <button
                onClick={handleUpdateDraft}
                disabled={processing || Object.keys(quantityErrors).length > 0}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <DocumentCheckIcon className="h-4 w-4 mr-2" />
                    Update Draft
                  </>
                )}
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing || Object.keys(quantityErrors).length > 0}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submit...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={processing}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Hapus Draft
              </button>
            </>
          )}
          {stockOutRecord?.status === 'submitted' && (
            <div className="text-center text-sm text-gray-500 py-2">
              Record sudah disubmit, tidak dapat diedit
            </div>
          )}
        </div>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden sm:block max-w-7xl mx-auto sm:px-6 lg:px-8 mt-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg px-6 py-4 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <Link
            href={route('stock-out.index')}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Batal
          </Link>
          {stockOutRecord?.status === 'draft' && (
            <>
              <button
                onClick={handleUpdateDraft}
                disabled={processing || Object.keys(quantityErrors).length > 0}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <DocumentCheckIcon className="h-4 w-4 mr-2" />
                    Update Draft
                  </>
                )}
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing || Object.keys(quantityErrors).length > 0}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submit...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={processing}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Hapus Draft
              </button>
            </>
          )}
          {stockOutRecord?.status === 'submitted' && (
            <div className="text-sm text-gray-500 py-2">
              Record sudah disubmit, tidak dapat diedit
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal - EC-PRD-023 */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Konfirmasi Hapus Draft"
          size="sm"
        >
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Hapus Draft Stock Out
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Apakah Anda yakin ingin menghapus draft stock out ini? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">ID Record:</span>
                <p className="text-gray-900">{stockOutRecord?.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tanggal:</span>
                <p className="text-gray-900">{formatDate(stockOutRecord?.date)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={processing}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Hapus
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
};

export default Edit;
