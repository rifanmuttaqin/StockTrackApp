import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import MobileCard from '../UI/MobileCard';
import MobileButton from '../UI/MobileButton';
import MobileInput from '../UI/MobileInput';
import MobileAlert from '../UI/MobileAlert';
import LoadingSpinner from '../LoadingSpinner';
import { usePermission } from '../../Hooks/usePermission';

const MobileUserForm = ({
  user = null,
  roles = [],
  userRoles = [],
  onSubmit,
  isEditing = false,
  errors = {},
  processing = false
}) => {
  const { can } = usePermission();
  const { data, setData, post, put, reset, setError } = useForm({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password_confirmation: '',
    roles: userRoles?.map(role => role.id) || [],
    status: user?.status || 'active',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEditing) {
      put(route('users.update', user.id), {
        onSuccess: () => reset(),
        onError: (errors) => setError(errors),
      });
    } else {
      post(route('users.store'), {
        onSuccess: () => reset(),
        onError: (errors) => setError(errors),
      });
    }
  };

  const handleRoleChange = (roleId) => {
    setData('roles',
      data.roles.includes(roleId)
        ? data.roles.filter(id => id !== roleId)
        : [...data.roles, roleId]
    );
  };

  return (
    <div className="space-y-4">
      {/* User Information Card */}
      <MobileCard>
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap *
              </label>
              <MobileInput
                type="text"
                id="name"
                name="name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <MobileInput
                type="email"
                id="email"
                name="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="nama@example.com"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {!isEditing && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <MobileInput
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      placeholder="Minimal 8 karakter"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi Password *
                  </label>
                  <div className="relative">
                    <MobileInput
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="password_confirmation"
                      name="password_confirmation"
                      value={data.password_confirmation}
                      onChange={(e) => setData('password_confirmation', e.target.value)}
                      placeholder="Ulangi password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                  )}
                </div>
              </>
            )}

            {isEditing && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={data.status}
                  onChange={(e) => setData('status', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                  <option value="suspended">Ditangguhkan</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                )}
              </div>
            )}
          </form>
        </div>
      </MobileCard>

      {/* Role Assignment Card */}
      <MobileCard>
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Role Assignment
          </h3>

          <div className="space-y-2">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center p-3 border rounded-lg">
                <input
                  type="checkbox"
                  id={`role-${role.id}`}
                  checked={data.roles.includes(role.id)}
                  onChange={() => handleRoleChange(role.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`role-${role.id}`} className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">{role.name}</div>
                  <div className="text-xs text-gray-500">{role.description}</div>
                </label>
              </div>
            ))}
          </div>
          {errors.roles && (
            <p className="mt-2 text-sm text-red-600">{errors.roles}</p>
          )}
        </div>
      </MobileCard>

      {/* Help Section */}
      <MobileCard className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                {isEditing ? 'User Editing Tips' : 'User Creation Tips'}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  {isEditing ? (
                    <>
                      <li>Email changes will require the user to verify their new email address</li>
                      <li>Status changes will take effect immediately</li>
                      <li>Role changes will affect user permissions on next login</li>
                      <li>Password can only be changed through the profile page or password reset</li>
                    </>
                  ) : (
                    <>
                      <li>Password must be at least 8 characters long</li>
                      <li>Email address must be unique and valid</li>
                      <li>Assign at least one role for proper access control</li>
                      <li>New users will be created with "active" status by default</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </MobileCard>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <MobileButton
          variant="outline"
          onClick={() => window.history.back()}
          className="w-full sm:w-auto"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Batal
        </MobileButton>
        <MobileButton
          variant="primary"
          onClick={handleSubmit}
          disabled={processing}
          className="w-full sm:w-auto"
        >
          {processing ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Menyimpan...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              {isEditing ? 'Update User' : 'Create User'}
            </>
          )}
        </MobileButton>
      </div>
    </div>
  );
};

export default MobileUserForm;
