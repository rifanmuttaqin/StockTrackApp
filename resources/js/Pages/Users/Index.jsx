import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import UserTable from '../../Components/Tables/UserTable';
import { MobileUserTable } from '../../Components/Users';
import Pagination from '../../Components/Pagination';
import Alert from '../../Components/Alert';
import LoadingSpinner from '../../Components/LoadingSpinner';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';

const Index = ({ users, roles, filters, meta }) => {
  const { props } = usePage();
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const [loading, setLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: filters?.search || '',
    role: filters?.role || '',
    status: filters?.status || '',
    sort: filters?.sort || 'created_at',
    order: filters?.order || 'desc',
    page: filters?.page || 1,
  });

  useEffect(() => {
    // Update local filters when props change
    setLocalFilters({
      search: filters?.search || '',
      role: filters?.role || '',
      status: filters?.status || '',
      sort: filters?.sort || 'created_at',
      order: filters?.order || 'desc',
      page: filters?.page || 1,
    });
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(newFilters);

    router.get(
      route('users.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  const handleSortChange = (field) => {
    const newOrder = localFilters.sort === field && localFilters.order === 'asc' ? 'desc' : 'asc';
    const newFilters = { ...localFilters, sort: field, order: newOrder, page: 1 };
    setLocalFilters(newFilters);

    router.get(
      route('users.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  const handlePageChange = (page) => {
    const newFilters = { ...localFilters, page };
    setLocalFilters(newFilters);

    router.get(
      route('users.index'),
      newFilters,
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      }
    );
  };

  const handleToggleStatus = (userId, status) => {
    router.patch(
      route('users.toggle-status', userId),
      { status },
      {
        onSuccess: () => {
          // Refresh the page data
          router.reload({ only: ['users'] });
        },
      }
    );
  };

  const handleAssignRole = (userId, roleId) => {
    router.post(
      route('users.roles.assign', userId),
      { role_id: roleId },
      {
        onSuccess: () => {
          // Refresh the page data
          router.reload({ only: ['users'] });
        },
      }
    );
  };

  const handleExport = () => {
    window.location.href = route('users.export', localFilters);
  };

  return (
    <AppLayout title="User Management">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              User Management
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {can('users.export') && (
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            )}
            {can('users.create') && (
              <Link
                href={route('users.create')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add User
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

        {/* User Table - Conditional Rendering */}
        {isMobile ? (
          <MobileUserTable
            users={users}
            roles={roles}
            filters={localFilters}
            meta={meta}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            onDelete={(user) => {
              if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
                router.delete(route('users.destroy', user.id));
              }
            }}
            onToggleStatus={handleToggleStatus}
            onAssignRole={handleAssignRole}
          />
        ) : (
          <UserTable
            users={users}
            roles={roles}
            filters={localFilters}
            meta={meta}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            onDelete={(user) => {
              if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
                router.delete(route('users.destroy', user.id));
              }
            }}
            onToggleStatus={handleToggleStatus}
            onAssignRole={handleAssignRole}
          />
        )}

        {/* Pagination - Mobile Friendly */}
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
                  Page {meta.current_page} of {meta.last_page}
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

        {/* Summary Stats - Responsive Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
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
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{meta?.active_count || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inactive Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{meta?.inactive_count || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Suspended Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{meta?.suspended_count || 0}</dd>
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
