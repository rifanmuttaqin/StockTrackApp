import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import Alert from '../Alert';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import { usePermission } from '../../Hooks/usePermission';

const UserForm = ({
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
    role_id: userRoles?.length > 0 ? userRoles[0].id : '',
    status: user?.status || 'active',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });

  // Calculate password strength
  useEffect(() => {
    if (!data.password) {
      setPasswordStrength({ score: 0, text: '', color: '' });
      return;
    }

    let score = 0;
    const checks = {
      length: data.password.length >= 8,
      lowercase: /[a-z]/.test(data.password),
      uppercase: /[A-Z]/.test(data.password),
      numbers: /\d/.test(data.password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(data.password)
    };

    Object.values(checks).forEach(passed => {
      if (passed) score++;
    });

    const strengthLevels = [
      { score: 0, text: '', color: '' },
      { score: 1, text: 'Very Weak', color: 'bg-red-500' },
      { score: 2, text: 'Weak', color: 'bg-orange-500' },
      { score: 3, text: 'Fair', color: 'bg-yellow-500' },
      { score: 4, text: 'Good', color: 'bg-blue-500' },
      { score: 5, text: 'Strong', color: 'bg-green-500' }
    ];

    const strength = strengthLevels[score];
    setPasswordStrength(strength);
  }, [data.password]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const confirmSubmit = () => {
    setShowConfirmDialog(false);

    if (isEditing) {
      put(route('users.update', user.id), {
        onSuccess: () => {
          reset();
          // Redirect to users list after successful update
          router.visit(route('users.index'));
        },
        onError: (errors) => setError(errors),
      });
    } else {
      post(route('users.store'), {
        onSuccess: () => {
          reset();
          // Redirect to users list after successful creation
          router.visit(route('users.index'));
        },
        onError: (errors) => setError(errors),
      });
    }
  };

  const handleRoleChange = (roleId) => {
    setData('role_id', roleId); // Change to single role selection
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {!isEditing && (
              <>
                <div className="sm:col-span-3">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md pr-10"
                      required
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
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                    )}

                    {/* Password Strength Indicator */}
                    {data.password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Password Strength</span>
                          <span className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Use 8+ characters with mix of upper/lowercase, numbers, and symbols
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                    Konfirmasi Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="password_confirmation"
                      name="password_confirmation"
                      value={data.password_confirmation}
                      onChange={(e) => setData('password_confirmation', e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md pr-10"
                      required
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
                    {errors.password_confirmation && (
                      <p className="mt-2 text-sm text-red-600">{errors.password_confirmation}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {isEditing && can('users.toggle-status') && (
              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Tidak Aktif</option>
                    <option value="suspended">Ditangguhkan</option>
                  </select>
                  {errors.status && (
                    <p className="mt-2 text-sm text-red-600">{errors.status}</p>
                  )}
                </div>
              </div>
            )}

            <div className="sm:col-span-6">
              <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-3">
                Role Assignment *
              </label>
              <select
                id="role_id"
                name="role_id"
                value={data.role_id}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={isEditing && !can('users.assign-role')}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
              {errors.role_id && (
                <p className="mt-2 text-sm text-red-600">{errors.role_id}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Select the primary role for this user. Additional roles can be assigned later.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Link */}
      {isEditing && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => router.visit(route('users.password', user.id))}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Ubah Password Pengguna
          </button>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={processing}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {processing ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Menyimpan...</span>
            </>
          ) : (
            <span>{isEditing ? 'Update User' : 'Create User'}</span>
          )}
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? 'Confirm User Update' : 'Confirm User Creation'}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {isEditing
                    ? 'Are you sure you want to update this user? Please review the information below:'
                    : 'Are you sure you want to create this user? Please review the information below:'
                  }
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded-md">
                  <p className="text-sm"><strong>Name:</strong> {data.name}</p>
                  <p className="text-sm"><strong>Email:</strong> {data.email}</p>
                  {data.role_id && (
                    <p className="text-sm">
                      <strong>Role:</strong> {roles.find(r => r.id === parseInt(data.role_id))?.name}
                    </p>
                  )}
                  {isEditing && data.status && (
                    <p className="text-sm">
                      <strong>Status:</strong> {data.status === 'active' ? 'Aktif' : data.status === 'inactive' ? 'Tidak Aktif' : 'Ditangguhkan'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={confirmSubmit}
            >
              {isEditing ? 'Update User' : 'Create User'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
};

export default UserForm;
