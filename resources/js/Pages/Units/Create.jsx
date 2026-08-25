import React, { useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { MobileForm, MobileFormSection, MobileFormField } from '../../Components/UI/MobileForm';
import { Alert, LoadingSpinner } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';

const Create = ({ baseUnits }) => {
  const { props } = usePage();
  const { can } = usePermission();

  const { data, setData, post, processing, errors, reset } = useForm({
    type: 'base',
    name: '',
    abbreviation: '',
    base_unit_id: '',
    multiplier: '',
    is_primary: false,
    description: '',
  });

  const [selectedBaseUnit, setSelectedBaseUnit] = useState(null);

  const handleTypeChange = (type) => {
    setData('type', type);
    if (type === 'base') {
      setData({
        ...data,
        type,
        base_unit_id: '',
        multiplier: '',
        is_primary: false,
      });
      setSelectedBaseUnit(null);
    }
  };

  const handleBaseUnitChange = (e) => {
    const unitId = e.target.value;
    setData('base_unit_id', unitId);
    const unit = baseUnits?.find((u) => u.id === parseInt(unitId));
    setSelectedBaseUnit(unit || null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('units.store'), {
      onSuccess: () => {
        reset();
        setSelectedBaseUnit(null);
      },
    });
  };

  const previewText = data.name && data.multiplier && selectedBaseUnit
    ? `1 ${data.name} = ${data.multiplier} ${selectedBaseUnit.name}`
    : null;

  return (
    <AppLayout
      title="Tambah Satuan"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Satuan', href: '/units' },
        { label: 'Tambah Satuan' }
      ]}
    >
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Tambah Satuan Baru
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Buat satuan dasar atau satuan konversi baru
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
            {/* Type Selection */}
            <MobileFormSection
              title="Tipe Satuan"
              description="Pilih tipe satuan yang ingin dibuat"
              className="p-6 border-b border-gray-200"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <label
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    data.type === 'base'
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="base"
                    checked={data.type === 'base'}
                    onChange={() => handleTypeChange('base')}
                    className="sr-only"
                  />
                  <div className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900">Satuan Dasar</span>
                    <span className="mt-1 flex items-center text-sm text-gray-500">
                      Satuan utama seperti Pcs, Kg, Liter
                    </span>
                  </div>
                </label>

                <label
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    data.type === 'conversion'
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="conversion"
                    checked={data.type === 'conversion'}
                    onChange={() => handleTypeChange('conversion')}
                    className="sr-only"
                  />
                  <div className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900">Satuan Konversi</span>
                    <span className="mt-1 flex items-center text-sm text-gray-500">
                      Konversi dari satuan dasar (mis. Lusin = 12 Pcs)
                    </span>
                  </div>
                </label>
              </div>
            </MobileFormSection>

            {/* Basic Information */}
            <MobileFormSection
              title="Informasi Satuan"
              description="Masukkan informasi dasar satuan"
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
            {data.type === 'conversion' && (
              <MobileFormSection
                title="Pengaturan Konversi"
                description="Atur satuan dasar dan multiplier untuk konversi"
                className="p-6 border-b border-gray-200"
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Base Unit Dropdown */}
                  <MobileFormField
                    label="Satuan Dasar"
                    error={errors.base_unit_id}
                    required
                  >
                    <select
                      value={data.base_unit_id}
                      onChange={handleBaseUnitChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Pilih Satuan Dasar</option>
                      {baseUnits?.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.abbreviation})
                        </option>
                      ))}
                    </select>
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
              description="Tambahkan deskripsi untuk satuan ini (opsional)"
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Simpan Satuan
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
              <h3 className="text-sm font-medium text-blue-800">Tips Menambah Satuan</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Satuan Dasar adalah satuan utama yang digunakan dalam stok (mis. Pcs, Kg, Liter)</li>
                  <li>Satuan Konversi adalah satuan turunan dari satuan dasar (mis. Lusin = 12 Pcs)</li>
                  <li>Multiplier menunjukkan berapa unit satuan dasar dalam 1 unit satuan konversi</li>
                  <li>Centang "Konversi Utama" jika ingin satuan ini ditampilkan di badge stok tabel produk</li>
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
