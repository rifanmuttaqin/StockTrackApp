import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { MobileForm, MobileFormSection, MobileFormField } from '../../Components/UI/MobileForm';
import { Alert, LoadingSpinner } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';

const Edit = ({ unit, baseUnits }) => {
  const { props } = usePage();
  const { can } = usePermission();

  const { data, setData, put, processing, errors } = useForm({
    name: unit?.name || '',
    abbreviation: unit?.abbreviation || '',
    multiplier: unit?.multiplier || '',
    is_primary: unit?.is_primary || false,
    description: unit?.description || '',
    updated_at: unit?.updated_at || '',
  });

  const [selectedBaseUnit] = useState(
    unit?.base_unit || baseUnits?.find((u) => u.id === unit?.base_unit_id) || null
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('units.update', unit.id));
  };

  const isConversion = unit?.type === 'conversion';

  const previewText = isConversion && data.name && data.multiplier && selectedBaseUnit
    ? `1 ${data.name} = ${data.multiplier} ${selectedBaseUnit.name}`
    : null;

  return (
    <AppLayout
      title="Edit Satuan"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Satuan', href: '/units' },
        { label: 'Edit Satuan' }
      ]}
    >
      <Head title={`Edit ${unit?.name || 'Satuan'}`} />

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Edit Satuan: {unit?.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Update informasi satuan
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Link
              href={route('units.index')}
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
            {/* Type Display (read-only) */}
            <MobileFormSection
              title="Tipe Satuan"
              description="Tipe satuan tidak dapat diubah setelah dibuat"
              className="p-6 border-b border-gray-200"
            >
              <div>
                {isConversion ? (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    Satuan Konversi
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Satuan Dasar
                  </span>
                )}
              </div>
            </MobileFormSection>

            {/* Basic Information */}
            <MobileFormSection
              title="Informasi Satuan"
              description="Update informasi dasar satuan"
              className="p-6 border-b border-gray-200"
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Name */}
                <MobileFormField
                  label="Nama Satuan"
                  error={errors.name}
                  required
                >
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Contoh: Lusin"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </MobileFormField>

                {/* Abbreviation */}
                <MobileFormField
                  label="Singkatan"
                  error={errors.abbreviation}
                  required
                >
                  <input
                    type="text"
                    value={data.abbreviation}
                    onChange={(e) => setData('abbreviation', e.target.value)}
                    placeholder="Contoh: lsn"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </MobileFormField>
              </div>
            </MobileFormSection>

            {/* Conversion Fields (conditional) */}
            {isConversion && (
              <MobileFormSection
                title="Pengaturan Konversi"
                description="Atur multiplier untuk konversi"
                className="p-6 border-b border-gray-200"
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Base Unit (read-only display) */}
                  <MobileFormField label="Satuan Dasar">
                    <div className="block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-700">
                      {selectedBaseUnit
                        ? `${selectedBaseUnit.name} (${selectedBaseUnit.abbreviation})`
                        : '-'}
                    </div>
                  </MobileFormField>

                  {/* Multiplier */}
                  <MobileFormField
                    label="Multiplier"
                    error={errors.multiplier}
                    required
                  >
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={data.multiplier}
                      onChange={(e) => setData('multiplier', e.target.value)}
                      placeholder="Contoh: 12"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Berapa unit satuan dasar dalam 1 unit satuan ini
                    </p>
                  </MobileFormField>
                </div>

                {/* Preview */}
                {previewText && (
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                    <p className="text-sm font-medium text-indigo-800">
                      Preview: {previewText}
                    </p>
                  </div>
                )}

                {/* Is Primary Checkbox */}
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={data.is_primary}
                      onChange={(e) => setData('is_primary', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Jadikan Konversi Utama (Ditampilkan di badge stok tabel produk)
                    </span>
                  </label>
                  {errors.is_primary && (
                    <p className="mt-1 text-sm text-red-600">{errors.is_primary}</p>
                  )}
                </div>
              </MobileFormSection>
            )}

            {/* Description */}
            <MobileFormSection
              title="Deskripsi"
              description="Update deskripsi satuan (opsional)"
              className="p-6 border-b border-gray-200"
            >
              <MobileFormField
                label="Deskripsi"
                error={errors.description}
              >
                <textarea
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  rows={3}
                  placeholder="Deskripsi satuan..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </MobileFormField>
            </MobileFormSection>

            {/* Hidden updated_at for optimistic locking */}
            <input type="hidden" name="updated_at" value={data.updated_at} />

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <Link
                href={route('units.index')}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={processing}
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
                    Update Satuan
                  </>
                )}
              </button>
            </div>
          </MobileForm>
        </div>

        {/* Unit Info Card */}
        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Informasi Tambahan
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">ID Satuan</dt>
                <dd className="mt-1 text-sm text-gray-900">{unit?.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Tipe</dt>
                <dd className="mt-1">
                  {isConversion ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Satuan Konversi
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Satuan Dasar
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Dibuat Pada</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {unit?.created_at ? new Date(unit.created_at).toLocaleDateString('id-ID', {
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
                  {unit?.updated_at ? new Date(unit.updated_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : '-'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Edit;
