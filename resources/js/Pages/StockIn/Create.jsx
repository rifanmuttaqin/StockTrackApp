import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { MobileForm, MobileFormSection, MobileFormField } from '../../Components/UI/MobileForm';
import { Alert, LoadingSpinner, Badge, AutoSelectInput } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { ArrowLeftIcon, DocumentCheckIcon, CheckIcon } from '@heroicons/react/24/outline';

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
 * Komponen Create untuk input Stock Masuk
 *
 * @component
 * @returns {JSX.Element}
 */
const Create = ({ activeTemplate, defaultDate }) => {
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
   * Inertia form untuk data stock in
   */
  const { data, setData, post, processing, errors, reset } = useForm({
    date: defaultDate || new Date().toISOString().split('T')[0],
    items: [],
  });

  /**
   * Inisialisasi quantities saat component mount
   * Setiap varian di-set ke 0
   */
  useEffect(() => {
    if (activeTemplate?.items) {
      const initialQuantities = {};
      activeTemplate.items.forEach((item) => {
        initialQuantities[item.product_variant_id] = 0;
      });
      setQuantities(initialQuantities);
    }
  }, [activeTemplate]);

  /**
   * Update form data saat quantities berubah
   */
  useEffect(() => {
    const items = activeTemplate?.items?.map((item) => ({
      product_variant_id: item.product_variant_id,
      quantity: quantities[item.product_variant_id] || 0,
    })) || [];
    setData('items', items);
  }, [quantities, activeTemplate]);

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
   * Handle submit untuk Simpan Draft
   * Stock tidak bertambah
   *
   * @param {React.FormEvent} e - Event form submit
   */
  const handleSaveDraft = (e) => {
    e.preventDefault();

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

    post(route('stock-in.store'), {
      data: { ...data, status: 'draft' },
      onSuccess: () => {
        setMessage({ type: 'success', message: 'Draft berhasil disimpan' });
        reset();
      },
      onError: (errors) => {
        setMessage({ type: 'error', message: 'Gagal menyimpan draft' });
      },
    });
  };

  /**
   * Handle submit untuk Create & Submit Stock In
   * Membuat draft terlebih dahulu, kemudian submit draft tersebut
   *
   * @param {React.FormEvent} e - Event form submit
   */
  const handleSubmit = (e) => {
    e.preventDefault();

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

    // Create draft record first
    post(route('stock-in.store'), {
      data: { ...data, status: 'draft' },
      onSuccess: (page) => {
        // Get the stock in ID from the response
        const stockInId = page.props.stockInRecord?.id;
        if (stockInId) {
          // Submit the draft immediately
          router.post(route('stock-in.submit', stockInId), {
            date: data.date,
            note: data.note,
            items: data.items,
          }, {
            onSuccess: () => {
              setMessage({ type: 'success', message: 'Stock in berhasil disubmit' });
              // Redirect to index page after successful submit
              router.visit(route('stock-in.index'));
            },
            onError: (errors) => {
              setMessage({ type: 'error', message: 'Gagal submit stock in: ' + (errors.message || 'Unknown error') });
            },
          });
        } else {
          setMessage({ type: 'error', message: 'Gagal mendapatkan ID stock in' });
        }
      },
      onError: (errors) => {
        setMessage({ type: 'error', message: 'Gagal membuat draft stock in' });
      },
    });
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
   * Custom Date Input Component
   * Menampilkan tanggal dalam format Indonesia tetapi menyimpan dalam format YYYY-MM-DD
   */
  const CustomDateInput = ({ value, onChange, error, disabled }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleInputChange = (e) => {
      const date = e.target.value;
      onChange(date);
    };

    return (
      <div className="relative">
        {/* Hidden date input for date picker */}
        <input
          type="date"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          style={{ height: '100%' }}
        />
        
        {/* Display input showing formatted date */}
        <div
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm ${
            error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
          } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white cursor-pointer'}`}
        >
          {value ? formatDate(value) : 'Pilih tanggal'}
        </div>
        
        {/* Calendar icon indicator */}
        {!disabled && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  // Tampilkan error jika tidak ada template aktif
  if (!activeTemplate) {
    return (
      <AppLayout
        title="Input Stock Masuk"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Stock In', href: '/stock-in' },
          { label: 'Input' }
        ]}
      >
        <Head title="Input Stock Masuk" />

        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Input Stock Masuk
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Masukkan data stock masuk berdasarkan template aktif
              </p>
            </div>
          </div>

          {/* Error Message - EC-PRD-026 */}
          <Alert
            type="error"
            message="Tidak ada template aktif. Silakan aktifkan template terlebih dahulu sebelum melakukan input stock masuk."
            className="mb-6"
          />

          {/* Back Button */}
          <div className="mt-6">
            <Link
              href={route('stock-in.index')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Kembali ke Daftar Stock In
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Input Stock Masuk"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Stock In', href: '/stock-in' },
        { label: 'Input' }
      ]}
    >
      <Head title="Input Stock Masuk" />

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-28 sm:pb-0">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Input Stock Masuk
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Masukkan data stock masuk berdasarkan template: {activeTemplate.name}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href={route('stock-in.index')}
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
              title="Informasi Stock Masuk"
              description="Masukkan tanggal stock masuk"
              className="p-6 border-b border-gray-200"
            >
              <div className="grid grid-cols-1 gap-6">
              {/* Date Input */}
              <MobileFormField
                label="Tanggal"
                error={errors.date}
                required
              >
                <CustomDateInput
                  value={data.date}
                  onChange={(value) => setData('date', value)}
                  error={errors.date}
                />
              </MobileFormField>

                {/* Template Info */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Template Aktif</h4>
                      <p className="mt-1 text-sm text-gray-500">{activeTemplate.name}</p>
                    </div>
                    <Badge variant="success">
                      {activeTemplate.items?.length || 0} Varian
                    </Badge>
                  </div>
                </div>
              </div>
            </MobileFormSection>

            {/* Variants List Section */}
            <MobileFormSection
              title="Daftar Varian"
              description={`Masukkan quantity untuk setiap varian (${activeTemplate.items?.length || 0} varian)`}
              className="p-6 border-b border-gray-200"
            >
              {activeTemplate.items?.length > 0 ? (
                <div className="space-y-4">
                  {activeTemplate.items.map((item, index) => {
                    // Get color based on product ID for consistent coloring
                    const productId = item.product_variant?.product?.id;
                    const color = getProductColor(productId);
                    
                    return (
                      <div
                        key={item.product_variant_id || index}
                        className={`p-4 ${color.bg} rounded-lg border ${color.border} hover:shadow-md transition-shadow`}
                      >
                        {/* Variant Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className={`text-lg font-bold ${color.text}`}>
                              {item.product_variant?.product?.name || '-'} - {item.product_variant?.variant_name || `Varian #${index + 1}`}
                            </h4>
                            <p className={`text-xs ${color.text} mt-1 opacity-75`}>
                              SKU: {item.product_variant?.sku || '-'}
                            </p>
                          </div>
                          <div className="text-lg font-bold">
                            <Badge variant={color.badge.includes('red') ? 'error' : color.badge.includes('green') ? 'success' : 'info'} className="text-base px-3 py-1">
                              Stock: {item.product_variant?.stock_current || 0}
                            </Badge>
                          </div>
                        </div>

                        {/* Quantity Input */}
                        <div className="grid grid-cols-1 gap-4">
                          <MobileFormField
                            label="Quantity"
                            error={errors[`items.${index}.quantity`] || quantityErrors[item.product_variant_id]}
                            required
                          >
                            <AutoSelectInput
                              type="number"
                              min="0"
                              value={quantities[item.product_variant_id] || 0}
                              onChange={(e) => handleQuantityChange(item.product_variant_id, e.target.value)}
                              placeholder="0"
                              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                                quantityErrors[item.product_variant_id] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                          </MobileFormField>
                        </div>

                        {/* Error Message */}
                        {quantityErrors[item.product_variant_id] && (
                          <p className="mt-2 text-sm text-red-600">
                            {quantityErrors[item.product_variant_id]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak Ada Varian</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Template ini tidak memiliki varian. Silakan edit template untuk menambahkan varian.
                  </p>
                </div>
              )}

              {/* Summary */}
              {activeTemplate.items?.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <span className="text-sm font-medium text-blue-900">
                          Total Varian: {activeTemplate.items.length}
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
              <h3 className="text-sm font-medium text-blue-800">Tips Input Stock Masuk</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Quantity tidak boleh negatif</li>
                  <li>Minimal satu varian harus memiliki quantity {'>'} 0</li>
                  <li>Simpan Draft untuk menyimpan tanpa menambah stock</li>
                  <li>Submit untuk menambah stock secara permanen</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons - Mobile First */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:hidden z-[60] shadow-lg">
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleSaveDraft}
            disabled={processing || Object.keys(quantityErrors).length > 0}
            className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <DocumentCheckIcon className="h-4 w-4 mr-2" />
                Simpan Draft
              </>
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || Object.keys(quantityErrors).length > 0}
            className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Desktop Action Buttons - Floating */}
      <div className="hidden sm:block fixed bottom-6 right-6 z-50">
        <div className="bg-white shadow-lg rounded-lg px-4 py-3 flex items-center space-x-3 border border-gray-200">
          <Link
            href={route('stock-in.index')}
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Batal
          </Link>
          <button
            onClick={handleSaveDraft}
            disabled={processing || Object.keys(quantityErrors).length > 0}
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Menyimpan...
              </>
            ) : (
              <>
                <DocumentCheckIcon className="h-4 w-4 mr-2" />
                Simpan Draft
              </>
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || Object.keys(quantityErrors).length > 0}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </AppLayout>
  );
};

export default Create;
