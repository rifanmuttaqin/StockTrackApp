import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { MobileForm, MobileFormSection, MobileFormField, MobileFormActions } from '../../Components/UI/MobileForm';
import { Alert, LoadingSpinner } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

const Edit = ({ product, errors, flash }) => {
  const { props } = usePage();
  const { can } = usePermission();

  // Initial variant form state
  const initialVariant = {
    id: null,
    name: '',
    sku: '',
    stock_current: 0,
  };

  // Form state
  const [variants, setVariants] = useState([]);
  const [skuErrors, setSkuErrors] = useState({});

  // Initialize form with product data
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      const initialVariants = product.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        stock_current: variant.stock_current,
      }));
      setVariants(initialVariants);
    } else {
      setVariants([{ ...initialVariant }]);
    }
  }, [product]);

  // Inertia form
  const { data, setData, put, processing, reset } = useForm({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    variants: [],
  });

  // Update form data when variants change
  useEffect(() => {
    setData('variants', variants);
  }, [variants]);

  // Validate SKU uniqueness in real-time
  const validateSKU = (sku, index) => {
    const errors = { ...skuErrors };
    const allSkus = variants.map((v, i) => i === index ? sku : v.sku);

    // Check for duplicate SKUs
    const skuCount = allSkus.filter(s => s === sku && s !== '').length;
    if (skuCount > 1) {
      errors[index] = 'SKU varian harus unik';
    } else {
      delete errors[index];
    }

    setSkuErrors(errors);
  };

  // Add new variant
  const handleAddVariant = () => {
    setVariants([...variants, { ...initialVariant }]);
  };

  // Remove variant
  const handleRemoveVariant = (index) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);

      // Clear SKU error for removed variant
      const newSkuErrors = { ...skuErrors };
      delete newSkuErrors[index];
      setSkuErrors(newSkuErrors);
    }
  };

  // Update variant field
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);

    // Validate SKU if field is sku
    if (field === 'sku') {
      validateSKU(value, index);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check for SKU errors before submission
    if (Object.keys(skuErrors).length > 0) {
      alert('Harap perbaiki error SKU varian sebelum menyimpan');
      return;
    }

    put(route('products.update', product.id), {
      onSuccess: () => {
        setSkuErrors({});
      },
    });
  };

  return (
    <AppLayout title="Edit Produk">
      <Head title={`Edit ${product?.name || 'Produk'}`} />

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Edit Produk: {product?.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Update informasi produk dan varian-varian yang terkait
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href={route('products.index')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Kembali
            </Link>
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
        {processing && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <MobileForm onSubmit={handleSubmit}>
            {/* Product Information Section */}
            <MobileFormSection
              title="Informasi Produk"
              description="Update informasi dasar produk"
              className="p-6 border-b border-gray-200"
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Product Name */}
                <MobileFormField
                  label="Nama Produk"
                  error={errors.name}
                  required
                  className="sm:col-span-2"
                >
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Contoh: Kaos Polos"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </MobileFormField>

                {/* Product SKU */}
                <MobileFormField
                  label="SKU Produk"
                  error={errors.sku}
                  required
                >
                  <input
                    type="text"
                    value={data.sku}
                    onChange={(e) => setData('sku', e.target.value)}
                    placeholder="Contoh: KAOS-001"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </MobileFormField>

                {/* Description */}
                <MobileFormField
                  label="Deskripsi"
                  error={errors.description}
                  className="sm:col-span-2"
                >
                  <textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={4}
                    placeholder="Deskripsi produk..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </MobileFormField>
              </div>
            </MobileFormSection>

            {/* Variants Section */}
            <MobileFormSection
              title="Varian Produk"
              description={`Kelola varian untuk produk ini (${variants.length} varian)`}
              className="p-6 border-b border-gray-200"
            >
              {variants.map((variant, index) => (
                <div
                  key={variant.id || index}
                  className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-900">
                      {variant.id ? `Varian #${index + 1}` : 'Varian Baru'}
                    </h4>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="text-red-600 hover:text-red-900 focus:outline-none"
                        title="Hapus Varian"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Variant Name */}
                    <MobileFormField
                      label="Nama Varian"
                      error={errors[`variants.${index}.name`]}
                      required
                    >
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                        placeholder="Contoh: Merah, L"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </MobileFormField>

                    {/* Variant SKU */}
                    <MobileFormField
                      label="SKU Varian"
                      error={errors[`variants.${index}.sku`] || skuErrors[index]}
                      required
                    >
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        placeholder="Contoh: KAOS-001-M-L"
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                          skuErrors[index] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </MobileFormField>

                    {/* Variant Stock */}
                    <MobileFormField
                      label="Stock Current"
                      error={errors[`variants.${index}.stock_current`]}
                      required
                    >
                      <input
                        type="number"
                        min="0"
                        value={variant.stock_current}
                        onChange={(e) => handleVariantChange(index, 'stock_current', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </MobileFormField>
                  </div>
                </div>
              ))}

              {/* Add Variant Button */}
              <button
                type="button"
                onClick={handleAddVariant}
                className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-dashed border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Tambah Varian
              </button>
            </MobileFormSection>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <Link
                href={route('products.index')}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={processing || Object.keys(skuErrors).length > 0}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Update Produk
                  </>
                )}
              </button>
            </div>
          </MobileForm>
        </div>

        {/* Product Info Card - Responsive */}
        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Informasi Tambahan
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">ID Produk</dt>
                <dd className="mt-1 text-sm text-gray-900">{product?.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Dibuat Pada</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {product?.created_at ? new Date(product.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Terakhir Diupdate</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {product?.updated_at ? new Date(product.updated_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Jumlah Varian</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {variants.length}
                  </span>
                </dd>
              </div>
            </dl>
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
              <h3 className="text-sm font-medium text-blue-800">Tips Mengedit Produk</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>SKU harus unik untuk setiap produk dan varian</li>
                  <li>Minimal 1 varian harus ada untuk setiap produk</li>
                  <li>Perubahan akan disimpan secara otomatis setelah tombol Update diklik</li>
                  <li>Varian baru akan ditambahkan sebagai varian baru</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Edit;
