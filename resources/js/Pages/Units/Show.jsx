import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Alert, LoadingSpinner } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const Show = ({ unit }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const [loading, setLoading] = useState(false);

  const isConversion = unit?.type === 'conversion';

  const handleDelete = async () => {
    const impactInfo = unit.variants_count > 0
      ? `\n\n⚠️ Satuan ini digunakan oleh ${unit.variants_count} varian produk.`
      : '';

    const result = await Swal.fire({
      title: 'Hapus Satuan?',
      html: `Apakah Anda yakin ingin menghapus satuan <b>${unit.name}</b>?${impactInfo}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      router.delete(route('units.destroy', unit.id), {
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout
      title="Detail Satuan"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Satuan', href: '/units' },
        { label: 'Detail Satuan' }
      ]}
    >
      <Head title={unit?.name || 'Detail Satuan'} />

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <Link
                href={route('units.index')}
                className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  {unit?.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Singkatan: {unit?.abbreviation}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {can('units.edit') && (
              <Link
                href={route('units.edit', unit.id)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Satuan
              </Link>
            )}
            {can('units.delete') && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Hapus Satuan
                  </>
                )}
              </button>
            )}
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
        {loading && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Unit Information Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Informasi Satuan
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Detail lengkap mengenai satuan ini
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nama Satuan</dt>
                <dd className="mt-1 text-sm text-gray-900 font-semibold">{unit?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Singkatan</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {unit?.abbreviation}
                  </span>
                </dd>
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
                <dt className="text-sm font-medium text-gray-500">Jumlah Varian</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {unit?.variants_count || 0} Varian
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Deskripsi</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {unit?.description || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Dibuat Pada</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(unit?.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Terakhir Diupdate</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(unit?.updated_at)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Conversion Details (for conversion units) */}
        {isConversion && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Detail Konversi
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Informasi konversi dari satuan dasar
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Satuan Dasar</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {unit?.base_unit ? (
                      <Link
                        href={route('units.show', unit.base_unit.id)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        {unit.base_unit.name} ({unit.base_unit.abbreviation})
                      </Link>
                    ) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Multiplier</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-semibold">{unit?.multiplier}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Nama Lengkap Konversi</dt>
                  <dd className="mt-1">
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                      <p className="text-sm font-medium text-indigo-800">
                        1 {unit?.name} = {unit?.multiplier} {unit?.base_unit?.name}
                      </p>
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Konversi Utama</dt>
                  <dd className="mt-1">
                    {unit?.is_primary ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ya
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Tidak
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Conversions List (for base units) */}
        {!isConversion && unit?.conversions && unit.conversions.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Satuan Konversi
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Daftar satuan konversi yang menggunakan satuan ini sebagai dasar
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Singkatan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Multiplier
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Konversi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utama
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unit.conversions.map((conversion) => (
                    <tr key={conversion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={route('units.show', conversion.id)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          {conversion.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {conversion.abbreviation}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {conversion.multiplier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        1 {conversion.name} = {conversion.multiplier} {unit.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {conversion.is_primary ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ya
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Tidak
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No conversions message for base units */}
        {!isConversion && (!unit?.conversions || unit.conversions.length === 0) && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-8 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Belum Ada Satuan Konversi</h3>
              <p className="text-sm text-gray-500">
                Satuan dasar ini belum memiliki satuan konversi.
              </p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Jumlah Varian</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {unit?.variants_count || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tipe</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {isConversion ? 'Konversi' : 'Dasar'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Terakhir Update</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {unit?.updated_at
                        ? new Date(unit.updated_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '-'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
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
              <h3 className="text-sm font-medium text-blue-800">Informasi Satuan</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Satuan Dasar adalah satuan utama yang digunakan dalam pencatatan stok</li>
                  <li>Satuan Konversi memungkinkan Anda membeli atau menjual dalam satuan berbeda</li>
                  <li>Multiplier menunjukkan perbandingan dengan satuan dasar</li>
                  <li>Satuan yang digunakan oleh varian produk tidak dapat dihapus</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Show;
