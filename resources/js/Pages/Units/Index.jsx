import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Pagination, Alert, LoadingSpinner } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const Index = ({ units, filters, meta }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters?.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(filters?.search || '');
  const [showDeleted, setShowDeleted] = useState(filters?.with_trashed === 'true');
  const [activeTab, setActiveTab] = useState(filters?.type || 'all');

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };

    router.get(
      route('units.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch !== filters?.search) {
      handleFilterChange('search', debouncedSearch);
    }
  }, [debouncedSearch]);

  const handleToggleDeleted = () => {
    const newValue = !showDeleted;
    setShowDeleted(newValue);
    handleFilterChange('with_trashed', newValue ? 'true' : '');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    handleFilterChange('type', tab === 'all' ? '' : tab);
  };

  const handlePageChange = (page) => {
    const newFilters = { ...filters, page };

    router.get(
      route('units.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  const handleDelete = async (unit) => {
    const impactInfo = unit.variants_count > 0
      ? `\n\n⚠️ Satuan ini digunakan oleh ${unit.variants_count} varian produk. Menghapus satuan ini dapat mempengaruhi varian tersebut.`
      : '';

    const result = await Swal.fire({
      title: 'Hapus Satuan?',
      html: `Apakah Anda yakin ingin menghapus satuan <b>${unit.name}</b>? Satuan akan dipindahkan ke sampah dan dapat dipulihkan kembali.${impactInfo}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      router.delete(route('units.destroy', unit.id), {
        onSuccess: () => {
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Satuan berhasil dihapus',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
          });
          router.reload({ only: ['units'] });
        },
      });
    }
  };

  const handleRestore = async (unit) => {
    const result = await Swal.fire({
      title: 'Pulihkan Satuan?',
      html: `Apakah Anda yakin ingin memulihkan satuan <b>${unit.name}</b>? Satuan akan kembali aktif.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Pulihkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      router.post(route('units.restore', unit.id), {}, {
        onSuccess: () => {
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Satuan berhasil dipulihkan',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
          });
          router.reload({ only: ['units'] });
        },
      });
    }
  };

  const getActions = (unit) => {
    const actions = [];

    if (!unit.deleted_at) {
      if (can('units.edit')) {
        actions.push({
          key: 'edit',
          icon: PencilIcon,
          className: 'text-blue-600 hover:text-blue-900',
          title: 'Edit Satuan',
          onClick: () => router.get(route('units.edit', unit.id)),
        });
      }

      if (can('units.delete')) {
        actions.push({
          key: 'delete',
          icon: TrashIcon,
          className: 'text-red-600 hover:text-red-900',
          title: 'Hapus Satuan',
          onClick: () => handleDelete(unit),
        });
      }
    } else {
      if (can('units.delete')) {
        actions.push({
          key: 'restore',
          icon: ArrowPathIcon,
          className: 'text-green-600 hover:text-green-900',
          title: 'Pulihkan Satuan',
          onClick: () => handleRestore(unit),
        });
      }
    }

    return actions;
  };

  const getTypeBadge = (type) => {
    if (type === 'base') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Satuan Dasar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        Satuan Konversi
      </span>
    );
  };

  const tabs = [
    { key: 'all', label: 'Semua' },
    { key: 'base', label: 'Satuan Dasar' },
    { key: 'conversion', label: 'Satuan Konversi' },
  ];

  return (
    <AppLayout
      title="Satuan"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Satuan' }
      ]}
    >
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Manajemen Satuan
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Kelola satuan dasar dan satuan konversi
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {can('units.create') && (
              <Link
                href={route('units.create')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Satuan
              </Link>
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

        {/* Tabs */}
        <div className="mb-4">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {tabs.map((tab) => (
                <option key={tab.key} value={tab.key}>{tab.label}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-4" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`${
                    activeTab === tab.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  } px-3 py-2 font-medium text-sm rounded-md`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Search Bar and Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama atau singkatan..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={handleToggleDeleted}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">Tampilkan Dihapus</span>
            </label>
          </div>
        </div>

        {/* Units Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Singkatan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Satuan Dasar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Multiplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Varian
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {units?.data && units.data.length > 0 ? (
                  units.data.map((unit) => (
                    <tr
                      key={unit.id}
                      className={`hover:bg-gray-50 ${unit.deleted_at ? 'bg-gray-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {unit.deleted_at && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Deleted
                            </span>
                          )}
                          <div
                            className={`font-medium ${
                              unit.deleted_at ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}
                          >
                            {unit.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          unit.deleted_at ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {unit.abbreviation}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(unit.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {unit.type === 'conversion' && unit.base_unit
                          ? unit.base_unit.name
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {unit.type === 'conversion' ? unit.multiplier : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          unit.deleted_at ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
                        }`}>
                          {unit.variants_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {getActions(unit).map((action) => (
                            <button
                              key={action.key}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick();
                              }}
                              className={action.className}
                              title={action.title}
                            >
                              <action.icon className="h-5 w-5" />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      {showDeleted ? "Tidak ada satuan yang dihapus ditemukan" : "Tidak ada satuan ditemukan"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {meta && (
          <div className="mt-6">
            {isMobile ? (
              <div className="flex justify-between items-center bg-white px-4 py-3 rounded-lg shadow">
                <button
                  onClick={() => handlePageChange(Math.max(1, meta.current_page - 1))}
                  disabled={meta.current_page <= 1}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Halaman {meta.current_page} dari {meta.last_page}
                </span>
                <button
                  onClick={() => handlePageChange(Math.min(meta.last_page, meta.current_page + 1))}
                  disabled={meta.current_page >= meta.last_page}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            ) : (
              <Pagination
                currentPage={meta.current_page}
                totalPages={meta.last_page}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Satuan</dt>
                    <dd className="text-lg font-medium text-gray-900">{meta?.total || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Satuan Dasar</dt>
                    <dd className="text-lg font-medium text-gray-900">{meta?.base_count || 0}</dd>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Satuan Konversi</dt>
                    <dd className="text-lg font-medium text-gray-900">{meta?.conversion_count || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
