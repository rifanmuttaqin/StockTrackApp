import React, { useState, useCallback } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { MobileForm, MobileFormSection, MobileFormField } from '../../Components/UI/MobileForm';
import { Alert, LoadingSpinner, Badge } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import { ArrowLeftIcon, DocumentCheckIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Stock Opname Create page
 * Form input stock opname berdasarkan template aktif
 *
 * @component
 * @returns {JSX.Element}
 */
const Create = ({ activeTemplate, defaultDate, error }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const isMobile = useMobileDetection();

  const [formData, setFormData] = useState({
    date: defaultDate || new Date().toISOString().split('T')[0],
    note: '',
    action: 'submit',
    items: activeTemplate?.items?.map((item) => ({
      product_variant_id: item.product_variant?.id,
      physical_stock: null,
    })) || [],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, message: null });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  /**
   * Calculate difference between physical and system stock
   */
  const getDifference = useCallback(
    (variantId) => {
      const item = formData.items.find((i) => i.product_variant_id === variantId);
      const templateItem = activeTemplate?.items?.find(
        (i) => i.product_variant?.id === variantId
      );

      if (item?.physical_stock === null || item?.physical_stock === undefined) {
        return null;
      }

      const systemStock = templateItem?.product_variant?.stock_current || 0;
      return item.physical_stock - systemStock;
    },
    [formData.items, activeTemplate]
  );

  /**
   * Calculate summary statistics for confirmation modal
   */
  const getSummary = useCallback(() => {
    let shortage = 0;
    let surplus = 0;
    let matching = 0;

    formData.items.forEach((item) => {
      const diff = getDifference(item.product_variant_id);
      if (diff === null) return;

      if (diff < 0) shortage += Math.abs(diff);
      else if (diff > 0) surplus += diff;
      else matching += 1;
    });

    return { shortage, surplus, matching };
  }, [formData.items, getDifference]);

  /**
   * Update physical stock for a variant
   */
  const handlePhysicalStockChange = (variantId, value) => {
    const numValue = value === '' ? null : parseInt(value, 10);

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.product_variant_id === variantId
          ? { ...item, physical_stock: numValue }
          : item
      ),
    }));
  };

  /**
   * Validate form before submission
   * @param {string} action - 'store' (draft) or 'submit'
   */
  const validateForm = (action = 'submit') => {
    if (action === 'submit') {
      // Submit: semua item wajib ada physical_stock
      const allFilled = formData.items.every(
        (item) => item.physical_stock !== null && item.physical_stock !== undefined
      );

      if (!allFilled) {
        setMessage({
          type: 'error',
          message: 'Semua varian harus diisi stock fisiknya saat submit',
        });
        return false;
      }
    } else {
      // Draft: minimal satu item ada physical_stock
      const hasAnyInput = formData.items.some(
        (item) => item.physical_stock !== null && item.physical_stock !== undefined
      );

      if (!hasAnyInput) {
        setMessage({
          type: 'error',
          message: 'Minimal satu varian harus memiliki data stock fisik',
        });
        return false;
      }
    }

    const hasNegative = formData.items.some(
      (item) => item.physical_stock !== null && item.physical_stock < 0
    );

    if (hasNegative) {
      setMessage({
        type: 'error',
        message: 'Stock fisik tidak boleh negatif',
      });
      return false;
    }

    return true;
  };

  /**
   * Handle submit button click - show confirmation modal
   * @param {string} action - 'store' (draft) or 'submit'
   */
  const handleSubmitClick = (action = 'submit') => {
    if (!validateForm(action)) return;
    setFormData((prev) => ({ ...prev, action }));
    setShowConfirmModal(true);
  };

  /**
   * Handle confirmed submission
   */
  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    setLoading(true);

    router.post(route('stock-opname.store'), formData, {
      onSuccess: () => {
        // redirect sudah ditangani oleh controller, page akan navigate ke index
      },
      onError: (errors) => {
        const firstError = Object.values(errors)[0];
        setMessage({
          type: 'error',
          message: Array.isArray(firstError) ? firstError[0] : 'Gagal menyimpan stock opname',
        });
      },
      onFinish: () => {
        setLoading(false);
      },
    });
  };

  /**
   * Custom Date Input Component
   */
  const CustomDateInput = ({ value, onChange, error, disabled }) => {
    return (
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm ${
            error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
          } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
        />
      </div>
    );
  };

  /**
   * Format date to Indonesian format
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
   * Get difference color class
   */
  const getDifferenceColor = (diff) => {
    if (diff === null || diff === undefined) return 'text-gray-400';
    if (diff < 0) return 'text-red-600 font-semibold';
    if (diff > 0) return 'text-green-600 font-semibold';
    return 'text-gray-500';
  };

  /**
   * Render difference value
   */
  const renderDifference = (diff) => {
    if (diff === null || diff === undefined) return '-';
    if (diff === 0) return '0';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  // Show error if no active template
  if (!activeTemplate || error) {
    return (
      <AppLayout
        title="Input Stock Opname"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Stock Opname', href: '/stock-opname' },
          { label: 'Input' },
        ]}
      >
        <Head title="Input Stock Opname" />

        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Input Stock Opname
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Masukkan data stock opname berdasarkan template aktif
              </p>
            </div>
          </div>

          {/* Error Message */}
          <Alert
            type="error"
            message={error || 'Tidak ada template aktif. Silakan aktifkan template terlebih dahulu sebelum melakukan input stock opname.'}
            className="mb-6"
          />

          {/* Back Button */}
          <div className="mt-6">
            <Link
              href={route('stock-opname.index')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Kembali ke Daftar Stock Opname
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const summary = getSummary();

  return (
    <AppLayout
      title="Input Stock Opname"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock Opname', href: '/stock-opname' },
        { label: 'Input' },
      ]}
    >
      <Head title="Input Stock Opname" />

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-28 sm:pb-0">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Input Stock Opname
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Masukkan data stock opname berdasarkan template: {activeTemplate.name}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href={route('stock-opname.index')}
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
        {loading && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <MobileForm>
            {/* Date & Note Section */}
            <MobileFormSection
              title="Informasi Stock Opname"
              description="Masukkan tanggal dan catatan stock opname"
              className="p-6 border-b border-gray-200"
            >
              <div className="grid grid-cols-1 gap-6">
                {/* Date Input */}
                <MobileFormField label="Tanggal" error={props.errors?.date} required>
                  <CustomDateInput
                    value={formData.date}
                    onChange={(value) => setFormData((prev) => ({ ...prev, date: value }))}
                    error={props.errors?.date}
                  />
                </MobileFormField>

                {/* Note Input */}
                <MobileFormField label="Catatan (Opsional)" error={props.errors?.note}>
                  <textarea
                    value={formData.note}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setFormData((prev) => ({ ...prev, note: e.target.value }));
                      }
                    }}
                    placeholder="Masukkan catatan jika diperlukan"
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">{formData.note.length}/500 karakter</p>
                </MobileFormField>

                {/* Template Info */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Template Aktif</h4>
                      <p className="mt-1 text-sm text-gray-500">{activeTemplate.name}</p>
                    </div>
                    <Badge variant="success">{activeTemplate.items?.length || 0} Varian</Badge>
                  </div>
                </div>
              </div>
            </MobileFormSection>

            {/* Variants Table Section */}
            <MobileFormSection
              title="Daftar Varian"
              description={`Masukkan stock fisik untuk setiap varian (${activeTemplate.items?.length || 0} varian)`}
              className="p-6"
            >
              {activeTemplate.items?.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produk
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Varian
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SKU
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock Sistem
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock Fisik
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Selisih
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeTemplate.items.map((item, index) => {
                          const variantId = item.product_variant?.id;
                          const systemStock = item.product_variant?.stock_current || 0;
                          const diff = getDifference(variantId);

                          return (
                            <tr key={variantId || index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.product_variant?.product?.name || '-'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {item.product_variant?.variant_name || '-'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{item.product_variant?.sku || '-'}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className="text-sm font-medium text-gray-900">{systemStock}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={
                                    formData.items.find((i) => i.product_variant_id === variantId)
                                      ?.physical_stock ?? ''
                                  }
                                  onChange={(e) => handlePhysicalStockChange(variantId, e.target.value)}
                                  placeholder="-"
                                  className="w-24 px-2 py-1 text-center border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className={`text-sm ${getDifferenceColor(diff)}`}>
                                  {renderDifference(diff)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="sm:hidden space-y-4">
                    {activeTemplate.items.map((item, index) => {
                      const variantId = item.product_variant?.id;
                      const systemStock = item.product_variant?.stock_current || 0;
                      const diff = getDifference(variantId);

                      return (
                        <div
                          key={variantId || index}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          {/* Variant Header */}
                          <div className="mb-3">
                            <h4 className="text-sm font-bold text-gray-900">
                              {item.product_variant?.product?.name || '-'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.product_variant?.variant_name || '-'} | SKU: {item.product_variant?.sku || '-'}
                            </p>
                          </div>

                          {/* Stock Info */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Stock Sistem</p>
                              <p className="text-sm font-medium text-gray-900">{systemStock}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Stock Fisik</p>
                              <input
                                type="number"
                                min="0"
                                value={
                                  formData.items.find((i) => i.product_variant_id === variantId)
                                    ?.physical_stock ?? ''
                                }
                                onChange={(e) => handlePhysicalStockChange(variantId, e.target.value)}
                                placeholder="-"
                                className="w-full px-2 py-1 text-center border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Selisih</p>
                              <p className={`text-sm font-medium ${getDifferenceColor(diff)}`}>
                                {renderDifference(diff)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <DocumentCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <span className="text-sm font-medium text-blue-900">
                          Total Varian: {activeTemplate.items.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak Ada Varian</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Template ini tidak memiliki varian. Silakan edit template untuk menambahkan varian.
                  </p>
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
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Tips Input Stock Opname</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Stock fisik tidak boleh negatif</li>
                  <li>Selisih dihitung otomatis: Stock Fisik - Stock Sistem</li>
                  <li>Selisih negatif (merah) = kekurangan, positif (hijau) = kelebihan</li>
                  <li>Minimal satu varian harus memiliki data stock fisik</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons - Mobile First */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:hidden z-[60] shadow-lg">
        <div className="flex space-x-3">
          <button
            onClick={() => handleSubmitClick('store')}
            disabled={loading}
            className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simpan Draft
          </button>
          <button
            onClick={() => handleSubmitClick('submit')}
            disabled={loading}
            className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Action Buttons - Floating */}
      <div className="hidden sm:block fixed bottom-6 right-6 z-50">
        <div className="bg-white shadow-lg rounded-lg px-4 py-3 flex items-center space-x-3 border border-gray-200">
          <Link
            href={route('stock-opname.index')}
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Batal
          </Link>
          <button
            onClick={() => handleSubmitClick('store')}
            disabled={loading}
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simpan Draft
          </button>
          <button
            onClick={() => handleSubmitClick('submit')}
            disabled={loading}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowConfirmModal(false)}
            />

            {/* Modal panel */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {formData.action === 'submit' ? 'Konfirmasi Submit Stock Opname' : 'Simpan Sebagai Draft'}
                    </h3>
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-gray-500">
                        {formData.action === 'submit'
                          ? 'Stock opname akan disubmit dan stok produk akan diperbarui. Pastikan semua data sudah benar.'
                          : 'Data akan disimpan sebagai draft. Anda bisa submit nanti dari halaman daftar.'}
                      </p>

                      {/* Summary Stats */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Varian:</span>
                          <span className="font-medium text-gray-900">
                            {activeTemplate.items?.length || 0}
                          </span>
                        </div>
                        {summary.shortage > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-red-600">Kekurangan:</span>
                            <span className="font-medium text-red-600">{summary.shortage} unit</span>
                          </div>
                        )}
                        {summary.surplus > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">Kelebihan:</span>
                            <span className="font-medium text-green-600">{summary.surplus} unit</span>
                          </div>
                        )}
                        {summary.matching > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sesuai:</span>
                            <span className="font-medium text-gray-900">{summary.matching} varian</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={loading}
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    formData.action === 'submit' ? 'Ya, Submit' : 'Ya, Simpan Draft'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="mt-3 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Create;
