import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Alert, Modal, LoadingSpinner, Pagination } from '../../Components/UI';
import RoleAssignmentModal from '../../Components/Modals/RoleAssignmentModal';
import MobileCard from '../../Components/UI/MobileCard';
import MobileButton from '../../Components/UI/MobileButton';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';

const Show = ({ user, roles, userRoles, activityLogs, sessions, meta }) => {
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const handleToggleStatus = (status) => {
    if (confirm(`Apakah Anda yakin ingin mengubah status user menjadi "${status === 'active' ? 'Aktif' : 'Tidak Aktif'}"?`)) {
      setLoading(true);
      router.patch(
        route('users.toggle-status', user.id),
        { status },
        {
          onSuccess: () => {
            setLoading(false);
            router.reload({ only: ['user'] });
          },
          onError: () => {
            setLoading(false);
          },
        }
      );
    }
  };

  const handleRevokeSession = (sessionId) => {
    if (confirm('Apakah Anda yakin ingin mencabut sesi ini?')) {
      setLoading(true);
      router.delete(
        route('users.sessions.revoke', [user.id, sessionId]),
        {
          onSuccess: () => {
            setLoading(false);
            router.reload({ only: ['sessions'] });
          },
          onError: () => {
            setLoading(false);
          },
        }
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Tidak Aktif' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditangguhkan' },
    };

    const config = statusConfig[status] || statusConfig.inactive;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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

  const formatIpAddress = (ip) => {
    if (!ip) return '-';
    return ip;
  };

  const getUserAgent = (userAgent) => {
    if (!userAgent) return '-';

    // Simple user agent parsing
    let browser = 'Unknown';
    let os = 'Unknown';

    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      browser = 'Safari';
    }

    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    }

    return `${browser} on ${os}`;
  };

  return (
    <AppLayout
      title={`User Details: ${user.name}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Pengguna', href: '/users' },
        { label: 'Detail Pengguna' }
      ]}
    >
      <Head title={`User Details: ${user.name}`} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 flex items-center justify-center z-50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Header - Responsive */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              User Details
            </h2>
          </div>
          <div className={`mt-4 ${isMobile ? 'flex flex-col gap-2' : 'md:mt-0 md:ml-4 space-x-3'}`}>
            {can('users.assign-role') && (
              <button
                onClick={() => setShowRoleModal(true)}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isMobile ? 'w-full justify-center' : ''}`}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Manage Roles
              </button>
            )}
            {can('users.edit') && (
              <Link
                href={route('users.edit', user.id)}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isMobile ? 'w-full justify-center' : ''}`}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit User
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

        {/* User Info Card - Responsive */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              User Information
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Personal details and account information.
            </p>
          </div>
          <div className="border-t border-gray-200">
            {isMobile ? (
              <dl className="divide-y divide-gray-100">
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="text-sm text-gray-900">{user.name}</dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="text-sm text-gray-900">{user.email}</dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">
                    {getStatusBadge(user.status)}
                  </dd>
                </div>
                <div className="px-4 py-3">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Roles</dt>
                  <dd className="text-sm text-gray-900">
                    <div className="flex flex-wrap gap-2">
                      {userRoles?.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {role.name}
                        </span>
                      ))}
                      {(!userRoles || userRoles.length === 0) && (
                        <span className="text-sm text-gray-500">No roles assigned</span>
                      )}
                    </div>
                  </dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                  <dd className="text-sm text-gray-900">
                    {user.email_verified_at ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Not Verified
                      </span>
                    )}
                  </dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(user.created_at)}
                  </dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(user.last_login_at)}
                  </dd>
                </div>
              </dl>
            ) : (
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {getStatusBadge(user.status)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Roles</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {userRoles?.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {role.name}
                        </span>
                      ))}
                      {(!userRoles || userRoles.length === 0) && (
                        <span className="text-sm text-gray-500">No roles assigned</span>
                      )}
                    </div>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.email_verified_at ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Not Verified
                      </span>
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(user.created_at)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(user.last_login_at)}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        {/* Tabs - Responsive */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="border-b border-gray-200">
            <nav className={`${isMobile ? 'flex overflow-x-auto' : '-mb-px flex space-x-8'} px-4`} aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${isMobile ? 'py-3 px-4 whitespace-nowrap' : 'py-4 px-1 border-b-2'} font-medium text-sm ${
                  activeTab === 'overview'
                    ? isMobile ? 'text-blue-600 border-b-2 border-blue-600' : 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`${isMobile ? 'py-3 px-4 whitespace-nowrap' : 'py-4 px-1 border-b-2'} font-medium text-sm ${
                  activeTab === 'activity'
                    ? isMobile ? 'text-blue-600 border-b-2 border-blue-600' : 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activity Log
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`${isMobile ? 'py-3 px-4 whitespace-nowrap' : 'py-4 px-1 border-b-2'} font-medium text-sm ${
                  activeTab === 'sessions'
                    ? isMobile ? 'text-blue-600 border-b-2 border-blue-600' : 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sessions
              </button>
            </nav>
          </div>

          <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Account Overview</h3>
                  <div className={`${isMobile ? 'space-y-3' : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'}`}>
                    <MobileCard className={`${isMobile ? '' : 'bg-white overflow-hidden shadow rounded-lg'}`}>
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Account Status</dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {user.status === 'active' ? 'Active' : user.status === 'inactive' ? 'Inactive' : 'Suspended'}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </MobileCard>

                    <MobileCard className={`${isMobile ? '' : 'bg-white overflow-hidden shadow rounded-lg'}`}>
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Roles</dt>
                              <dd className="text-lg font-medium text-gray-900">{userRoles?.length || 0}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </MobileCard>

                    <MobileCard className={`${isMobile ? '' : 'bg-white overflow-hidden shadow rounded-lg'}`}>
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
                              <dt className="text-sm font-medium text-gray-500 truncate">Last Login</dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('id-ID') : 'Never'}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </MobileCard>
                  </div>
                </div>

                {can('users.edit') && (
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex flex-wrap gap-3'}`}>
                      {user.status === 'active' ? (
                        <MobileButton
                          variant="outline"
                          onClick={() => handleToggleStatus('inactive')}
                          className={`${isMobile ? 'w-full' : ''}`}
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Deactivate User
                        </MobileButton>
                      ) : (
                        <MobileButton
                          variant="primary"
                          onClick={() => handleToggleStatus('active')}
                          className={`${isMobile ? 'w-full' : ''}`}
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Activate User
                        </MobileButton>
                      )}

                      <Link
                        href={route('password.email')}
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isMobile ? 'w-full justify-center' : ''}`}
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Reset Password
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Activity Log</h3>
                {activityLogs && activityLogs.length > 0 ? (
                  isMobile ? (
                    <div className="space-y-3">
                      {activityLogs.map((log) => (
                        <MobileCard key={log.id} className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{log.action}</h4>
                            <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                          <p className="text-xs text-gray-500">IP: {formatIpAddress(log.ip_address)}</p>
                        </MobileCard>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              IP Address
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {activityLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {log.action}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {log.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatIpAddress(log.ip_address)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(log.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No activity logs found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Active Sessions</h3>
                {sessions && sessions.length > 0 ? (
                  isMobile ? (
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <MobileCard key={session.id} className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{getUserAgent(session.user_agent)}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">IP: {formatIpAddress(session.ip_address)}</p>
                          <p className="text-xs text-gray-500 mb-2">Last Activity: {formatDate(session.last_activity)}</p>
                          {can('users.manage-sessions') && (
                            <MobileButton
                              variant="danger"
                              size="sm"
                              onClick={() => handleRevokeSession(session.id)}
                              className="w-full"
                            >
                              Revoke Session
                            </MobileButton>
                          )}
                        </MobileCard>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Device
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              IP Address
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Activity
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sessions.map((session) => (
                            <tr key={session.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {getUserAgent(session.user_agent)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatIpAddress(session.ip_address)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(session.last_activity)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {can('users.manage-sessions') && (
                                  <button
                                    onClick={() => handleRevokeSession(session.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No active sessions</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Assignment Modal */}
      <RoleAssignmentModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        user={user}
        roles={roles}
        userRoles={userRoles}
        onAssignRole={() => {
          setShowRoleModal(false);
          router.reload({ only: ['userRoles'] });
        }}
        onRemoveRole={() => {
          setShowRoleModal(false);
          router.reload({ only: ['userRoles'] });
        }}
      />
    </AppLayout>
  );
};

export default Show;
