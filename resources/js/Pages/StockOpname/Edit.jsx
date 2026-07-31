import React, { useState, useMemo } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { MobileForm, MobileFormSection, MobileFormField } from '../../Components/UI/MobileForm';
import { Alert, LoadingSpinner, Badge, Modal } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import {
  ArrowLeftIcon,
  DocumentCheckIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

/**
 * Color palette for product cards
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
 * Get deterministic color for a product based on its ID
 */
const getProductColor = (productId) => {
  if (!productId) return PRODUCT_COLORS[0];
  const hash = productId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const index = Math.abs(hash) % PRODUCT_COLORS.length;
  return PRODUCT_COLORS[index];
};

/**
 * Komponen Edit untuk mengedit Stock Opname draft
 *
 * @component
 * @returns {JSX.Element}
 */
const Edit = ({ stockOpnameRecord, error }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();

  const [message, setMessage] = useState({ type: null, message: null });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Format updated_at as 'Y-m-d H:i:s' for optimistic locking
  const formatUpdatedAt = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}:${s}`;
  };

  const { data, setData, put, processing, errors } = useForm({
    date: stockOpnameRecord?.date || new Date().toISOString().split('T')[0],
    note: stockOpnameRecord?.note || '',
    last_updated_at: formatUpdatedAt(stockOpnameRecord?.updated_at),
    items: stockOpnameRecord?.items?.map((item) => ({
      product_variant_id: item.product_variant_id,
      physical_stock: item.physical_stock ?? 0,
      system_stock_draft: item.system_stock_draft ?? 0,
      difference: (item.physical_stock ?? 0) - (item.system_stock_draft ?? 0),
    })) || [],
  });

  // Compute real-time differences and summary stats
  const computedItems = useMemo(() => {
    return data.items.map((item) => ({
      ...item,
      difference: (item.physical_stock || 0) - (item.system_stock_draft || 0),
    }));
  }, [data.items]);

  const summary = useMemo(() => {
    let shortage = 0;
    let surplus = 0;
    let matching = 0;
    computedItems.forEach((item) => {
      if (item.difference < 0) shortage++;
      else if (item.difference > 0) surplus++;
      else matching++;
    });
    return { shortage, surplus, matching, total: computedItems.length };
  }, [computedItems]);

  // Show error from server
  if (error) {
    return (
      <AppLayout title="Edit Stock Opname" breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock Opname', href: '/stock-opname' },
        { label: 'Edit' },
      ]}>
        <Head title="Edit Stock Opname" />
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-20 sm:pb-0">
          <div className="mb-6">
            <Link
              href={route('stock-opname.index')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Kembali ke daftar
            </Link>
          </div>
          <Alert type="error" message={error} />
        </div>
      </AppLayout>
    );
  }

  // Check if record is submitted
  if (stockOpnameRecord?.status === 'submit') {
    return (
      <AppLayout title="Edit Stock Opname" breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock Opname', href: '/stock-opname' },
        { label: 'Edit' },
      ]}>
        <Head title="Edit Stock Opname" />
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-20 sm:pb-0">
          <div className="mb-6">
            <Link
              href={route('stock-opname.index')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Kembali ke daftar
            </Link>
          </div>
          <Alert type="error" message="Stock opname sudah disubmit" />
        </div>
      </AppLayout>
    );
  }

  /**
   * Handle physical_stock change for a variant
   */
  const handlePhysicalStockChange = (variantId, value) => {
    const numValue = parseInt(value) || 0;
    setData('items', data.items.map((item) =>
      item.product_variant_id === variantId
        ? { ...item, physical_stock: numValue }
        : item
    ));
  };

  /**
   * Format tanggal ke format Indonesia
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
   * Custom Date Input Component
   */
  const CustomDateInput = ({ value, onChange, error: fieldError }) => {
    const handleInputChange = (e) => {
      onChange(e.target.value);
    };

    return (
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={handleInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          style={{ height: '100%' }}
        />
        <div
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm ${
            fieldError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
          } bg-white cursor-pointer`}
        >
          {value ? formatDate(value) : 'Pilih tanggal'}
        </div>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  };

  /**
   * Get difference badge color
   */
  const getDifferenceBadge = (diff) => {
    if (diff < 0) return { variant: 'error', label: `Kurang ${Math.abs(diff)}` };
    if (diff > 0) return { variant: 'success', label: `Lebih ${diff}` };
    return { variant: 'info', label: 'Sesuai' };
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'draft': return 'warning';
      case 'submit': return 'success';
      default: return 'info';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'submit': return 'Submit';
      default: return status;
    }
  };

  /**
   * Handle submit - show confirmation modal first
   */
  const handleSubmitClick = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  /**
   * Confirm submit - PUT with status=submit
   */
  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    put(route('stock-opname.update', stockOpnameRecord.id), {
      data: { ...data, status: 'submit' },
      onSuccess: () => {
        setMessage({ type: 'success', message: 'Stock opname berhasil disubmit' });
      },
      onError: (errors) => {
        if (errors?.conflict) {
          setMessage({ type: 'error', message: 'Data telah diperbarui oleh pengguna lain. Silakan reload data.' });
        } else {
          setMessage({ type: 'error', message: 'Gagal submit stock opname' });
        }
      },
    });
  };

  /**
   * Handle update draft
   */
  const handleUpdateDraft = (e) => {
    e.preventDefault();
    put(route('stock-opname.update', stockOpnameRecord.id), {
      data: { ...data, status: 'draft' },
      onSuccess: () => {
        setMessage({ type: 'success', message: 'Draft berhasil diupdate' });
      },
      onError: (errors) => {
        if (errors?.conflict) {
          setMessage({ type: 'error', message: 'Data telah diperbarui oleh pengguna lain. Silakan reload data.' });
        } else {
          setMessage({ type: 'error', message: 'Gagal mengupdate draft' });
        }
      },
    });
  };

  if (!can('stock_opname.edit')) {
    return (
      <AppLayout title="Edit Stock Opname" breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock Opname', href: '/stock-opname' },
        { label: 'Edit' },
      ]}>
        <Head title="Edit Stock Opname" />
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-20 sm:pb-0">
          <Alert type="error" message="Anda tidak memiliki akses untuk mengedit stock opname" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Edit Stock Opname"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock Opname', href: '/stock-opname' },
        { label: 'Edit' },
      ]}
    >
      <Head title="Edit Stock Opname" />

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-20 sm:pb-0">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Edit Stock Opname
              </h2>
              <Badge variant={getStatusBadgeVariant(stockOpnameRecord?.status)}>
                {getStatusLabel(stockOpnameRecord?.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {stockOpnameRecord?.transaction_code || `Record: ${stockOpnameRecord?.id}`}
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
        {processing && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <MobileForm>
            {/* Hidden input for optimistic locking */}
            <input type="hidden" name="last_updated_at" value={data.last_updated_at} />

            {/* Record Info Section */}
            <MobileFormSection
              title="Informasi Stock Opname"
              description="Edit data stock opname"
              className="p-6 border-b border-gray-200"
            >
              <div className="grid grid-cols-1 gap-6">
                {/* Date Input */}
                <MobileFormField label="Tanggal" error={errors.date} required>
                  <CustomDateInput
                    value={data.date}
                    onChange={(value) => setData('date', value)}
                    error={errors.date}
                  />
                </MobileFormField>

                {/* Note */}
                <MobileFormField label="Catatan" error={errors.note}>
                  <textarea
                    value={data.note}
                    onChange={(e) => setData('note', e.target.value)}
                    rows={3}
                    placeholder="Masukkan catatan stock opname..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </MobileFormField>

                {/* Record Info */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Kode Transaksi</h4>
                      <p className="mt-1 text-sm text-gray-500">{stockOpnameRecord?.transaction_code || '-'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Status</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        <Badge variant={getStatusBadgeVariant(stockOpnameRecord?.status)}>
                          {getStatusLabel(stockOpnameRecord?.status)}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Dibuat Oleh</h4>
                      <p className="mt-1 text-sm text-gray-500">{stockOpnameRecord?.created_by || '-'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Terakhir Diupdate</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {stockOpnameRecord?.updated_at ? formatDate(stockOpnameRecord.updated_at) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </MobileFormSection>

            {/* Variants List Section */}
            <MobileFormSection
              title="Daftar Varian"
              description={`Edit stock fisik untuk setiap varian (${stockOpnameRecord?.items?.length || 0} varian)`}
              className="p-6 border-b border-gray-200"
            >
              {stockOpnameRecord?.items?.length > 0 ? (
                <div className="space-y-4">
                  {computedItems.map((item, index) => {
                    const productId = stockOpnameRecord.items[index]?.product_variant?.product?.id;
                    const color = getProductColor(productId);
                    const originalItem = stockOpnameRecord.items[index];
                    const diffBadge = getDifferenceBadge(item.difference);

                    return (
                      <div
                        key={item.product_variant_id || index}
                        className={`p-4 ${color.bg} rounded-lg border ${color.border} hover:shadow-md transition-shadow`}
                      >
                        {/* Variant Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className={`text-lg font-bold ${color.text}`}>
                              {originalItem?.product_variant?.product?.name || '-'} - {originalItem?.product_variant?.variant_name || `Varian #${index + 1}`}
                            </h4>
                            <p className={`text-xs ${color.text} mt-1 opacity-75`}>
                              SKU: {originalItem?.product_variant?.sku || '-'}
                            </p>
                          </div>
                          <Badge variant={diffBadge.variant} className="text-sm px-3 py-1">
                            {diffBadge.label}
                          </Badge>
                        </div>

                        {/* Stock Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* System Stock (read-only) */}
                          <MobileFormField label="Stock Sistem" error={errors[`items.${index}.system_stock_draft`]}>
                            <div className="block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm bg-gray-50 text-gray-700 sm:text-sm">
                              {item.system_stock_draft}
                            </div>
                          </MobileFormField>

                          {/* Physical Stock (editable) */}
                          <MobileFormField
                            label="Stock Fisik"
                            error={errors[`items.${index}.physical_stock`]}
                            required
                          >
                            <input
                              type="number"
                              min="0"
                              value={item.physical_stock}
                              onChange={(e) => handlePhysicalStockChange(item.product_variant_id, e.target.value)}
                              placeholder="0"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </MobileFormField>

                          {/* Difference (computed, read-only) */}
                          <MobileFormField label="Selisih">
                            <div className={`block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm font-medium ${
                              item.difference < 0
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : item.difference > 0
                                  ? 'bg-green-50 border-green-200 text-green-700'
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}>
                              {item.difference > 0 ? '+' : ''}{item.difference}
                            </div>
                          </MobileFormField>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak Ada Varian</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Record ini tidak memiliki varian.
                  </p>
                </div>
              )}

              {/* Summary */}
              {computedItems.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center mb-3">
                    <DocumentCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">
                      Ringkasan: {summary.total} varian
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <span className="block text-lg font-bold text-red-600">{summary.shortage}</span>
                      <span className="text-red-700">Kurang</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-bold text-green-600">{summary.surplus}</span>
                      <span className="text-green-700">Lebih</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-lg font-bold text-blue-600">{summary.matching}</span>
                      <span className="text-blue-700">Sesuai</span>
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
              <h3 className="text-sm font-medium text-blue-800">Tips Edit Stock Opname</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Isi stock fisik sesuai hasil penghitungan di gudang</li>
                  <li>Selisih dihitung otomatis: Stock Fisik - Stock Sistem</li>
                  <li>Simpan Draft untuk menyimpan tanpa mengubah status</li>
                  <li>Submit untuk menyetujui hasil stock opname</li>
                  <li>Record yang sudah disubmit tidak dapat diedit</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:hidden z-40 shadow-lg">
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleUpdateDraft}
            disabled={processing}
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
            onClick={handleSubmitClick}
            disabled={processing}
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
        </div>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden sm:block max-w-7xl mx-auto sm:px-6 lg:px-8 mt-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg px-6 py-4 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <Link
            href={route('stock-opname.index')}
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Batal
          </Link>
          <button
            onClick={handleUpdateDraft}
            disabled={processing}
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
            onClick={handleSubmitClick}
            disabled={processing}
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
        </div>
      </div>

      {/* Edit Confirmation Modal */}
      <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} maxWidth="md">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Konfirmasi Submit Stock Opname
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Pastikan data stock fisik sudah benar sebelum disubmit.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="font-medium text-gray-700">Kode Transaksi:</span>
                <p className="text-gray-900">{stockOpnameRecord?.transaction_code || '-'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tanggal:</span>
                <p className="text-gray-900">{formatDate(data.date)}</p>
              </div>
            </div>

            {/* Summary in modal */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ringkasan Selisih:</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 bg-red-50 rounded">
                  <span className="block text-xl font-bold text-red-600">{summary.shortage}</span>
                  <span className="text-xs text-red-700">Kurang</span>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <span className="block text-xl font-bold text-green-600">{summary.surplus}</span>
                  <span className="text-xs text-green-700">Lebih</span>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <span className="block text-xl font-bold text-blue-600">{summary.matching}</span>
                  <span className="text-xs text-blue-700">Sesuai</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Batal
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={processing}
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
                  Ya, Submit
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
};

export default Edit;
