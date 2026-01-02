import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import PasswordChangeForm from '../../Components/Forms/PasswordChangeForm';
import { MobilePasswordChangeForm } from '../../Components/Users';
import Alert from '../../Components/Alert';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';

const Password = ({ user, errors }) => {
  const { can } = usePermission();
  const { isMobile } = useMobileDetection();
  const { props } = usePage();
  const authUser = props.auth.user;

  return (
    <AppLayout title="Ubah Password">
      <Head title={`Ubah Password - ${user.name}`} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Ubah Password: {user.name}
            </h2>
          </div>
        </div>

        {/* Flash Messages */}
        {props.flash?.success && (
          <Alert type="success" message={props.flash.success} className="mb-4" />
        )}
        {props.flash?.error && (
          <Alert type="error" message={props.flash.error} className="mb-4" />
        )}

        {isMobile ? (
          <MobilePasswordChangeForm
            user={user}
            errors={errors}
          />
        ) : (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Ubah Password Pengguna
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {user.id === authUser.id
                    ? 'Masukkan password saat ini dan password baru Anda. Pastikan password baru kuat dan berbeda dari password lama.'
                    : 'Atur password baru untuk pengguna ini. Password harus memenuhi kebijakan keamanan.'
                  }
                </p>
              </div>

              <PasswordChangeForm
                user={user}
                errors={errors}
                isOwnProfile={user.id === authUser.id}
              />
            </div>
          </div>
        )}

        {/* User Info Card - Responsive */}
        {!isMobile && (
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Informasi Pengguna
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nama Lengkap</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.roles && user.roles.length > 0
                      ? user.roles.map(role => role.name).join(', ')
                      : 'Tidak ada role'
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Aktif' : user.status === 'inactive' ? 'Tidak Aktif' : 'Ditangguhkan'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Mobile User Info */}
        {isMobile && (
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="p-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Informasi Pengguna
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Nama Lengkap</dt>
                  <dd className="text-sm text-gray-900">{user.name}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{user.email}</dd>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="text-sm text-gray-900">
                    {user.roles && user.roles.length > 0
                      ? user.roles.map(role => role.name).join(', ')
                      : 'Tidak ada role'
                    }
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Aktif' : user.status === 'inactive' ? 'Tidak Aktif' : 'Ditangguhkan'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Help Section - Responsive */}
        <div className={`mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 ${isMobile ? 'rounded-lg' : ''}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Tips Keamanan Password
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Gunakan minimal 8 karakter</li>
                  <li>Kombinasikan huruf besar, huruf kecil, angka, dan simbol</li>
                  <li>Hindari menggunakan informasi pribadi yang mudah ditebak</li>
                  <li>Jangan gunakan password yang sama untuk akun lain</li>
                  {user.id === authUser.id && (
                    <li>Anda akan diminta untuk login ulang setelah password diubah</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Password;
