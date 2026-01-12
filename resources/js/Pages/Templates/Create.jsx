import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { MobileForm, MobileFormSection, MobileFormField, MobileFormActions } from '../../Components/UI/MobileForm';
import { Alert, LoadingSpinner, Badge } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

const Create = ({ productVariants }) => {
  const { props } = usePage();
  const { can } = usePermission();

  // State untuk selected variants
  const [selectedVariants, setSelectedVariants] = useState([]);

  // Inertia form
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    variants: [],
  });

  // Handle variant selection
  const handleVariantToggle = (variantId) => {
    setSelectedVariants((prev) => {
      if (prev.includes(variantId)) {
        return prev.filter((id) => id !== variantId);
      } else {
        return [...prev, variantId];
      }
    });
  };

  // Update form data when selected variants change
  React.useEffect(() => {
    setData('variants', selectedVariants);
  }, [selectedVariants]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedVariants.length === 0) {
      Swal.fire('Validasi', 'Minimal 1 varian harus dipilih', 'warning');
      return;
    }

    post(route('templates.store'), {
      onSuccess: () => {
        reset();
        setSelectedVariants([]);
      },
    });
  };

  // Group variants by product
  const groupedVariants = productVariants?.reduce((groups, variant) => {
    const productId = variant.product?.id || 'unknown';
    const productName = variant.product?.name || 'Unknown Product';

    if (!groups[productId]) {
      groups[productId] = {
        productId,
        productName,
        variants: [],
      };
    }

    groups[productId].variants.push(variant);
    return groups;
  }, {}) || {};

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AppLayout
      title="Tambah Template"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Templates', href: '/templates' },
        { label: 'Tambah Template' }
      ]}
    >
      <Head title="Tambah Template" />

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Tambah Template Baru
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Buat template baru dan pilih varian produk yang ingin dimasukkan
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href={route('templates.index')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
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

        {/* Loading Overlay */}
        {processing && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <MobileForm onSubmit={handleSubmit}>
            {/* Template Information Section */}
            <MobileFormSection
              title="Informasi Template"
              description="Masukkan informasi dasar template"
              className="p-6 border-b border-gray-200"
            >
              <div className="grid grid-cols-1 gap-6">
                {/* Template Name */}
                <MobileFormField
                  label="Nama Template"
                  error={errors.name}
                  required
                >
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Contoh: Template Stok Awal 2026"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </MobileFormField>
              </div>
            </MobileFormSection>

            {/* Variants Selection Section */}
            <MobileFormSection
              title="Pilih Varian Produk"
              description={`Pilih varian produk yang ingin dimasukkan ke dalam template (${selectedVariants.length} varian dipilih)`}
              className="p-6 border-b border-gray-200"
            >
              {Object.values(groupedVariants).length > 0 ? (
                <div className="space-y-6">
                  {Object.values(groupedVariants).map((group) => (
                    <div key={group.productId} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900">{group.productName}</h4>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {group.variants.map((variant) => (
                          <label
                            key={variant.id}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedVariants.includes(variant.id)}
                              onChange={() => handleVariantToggle(variant.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {variant.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    SKU: {variant.sku}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="info">
                                    Stock: {variant.stock_current}
                                  </Badge>
                                  {selectedVariants.includes(variant.id) && (
                                    <CheckIcon className="h-5 w-5 text-green-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
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
                    Tidak ada varian produk yang tersedia. Silakan tambahkan varian produk terlebih dahulu.
                  </p>
                </div>
              )}

              {/* Selected Variants Summary */}
              {selectedVariants.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">
                        {selectedVariants.length} varian dipilih
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedVariants([])}
                      className="text-sm text-blue-600 hover:text-blue-900"
                    >
                      Hapus Semua
                    </button>
                  </div>
                </div>
              )}
            </MobileFormSection>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <Link
                href={route('templates.index')}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={processing || selectedVariants.length === 0}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Simpan Template
                  </>
                )}
              </button>
            </div>
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
              <h3 className="text-sm font-medium text-blue-800">Tips Menambah Template</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Minimal 1 varian harus dipilih untuk membuat template</li>
                  <li>Varian dikelompokkan berdasarkan produk untuk memudahkan pemilihan</li>
                  <li>Template yang dibuat akan otomatis tidak aktif</li>
                  <li>Gunakan nama template yang deskriptif untuk memudahkan identifikasi</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Create;
