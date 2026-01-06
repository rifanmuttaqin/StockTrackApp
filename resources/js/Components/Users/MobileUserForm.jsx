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
    ...(isEditing ? {} : {
      password: '',
      password_confirmation: ''
    }),
    role_id: userRoles?.length > 0 ? String(userRoles[0].id) : '',
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

    console.log('[MobileUserForm] confirmSubmit called', {
      isEditing,
      userId: user?.id,
      formData: data,
    });

    if (isEditing) {
      console.log('[MobileUserForm] Calling PUT to update user', {
        route: route('users.update', user.id),
        data: data,
      });

      put(route('users.update', user.id), {
        onSuccess: (page) => {
          console.log('[MobileUserForm] Update successful - onSuccess callback', {
            page,
            props: page.props,
            flash: page.props.flash,
          });
          reset();
          // Note: Redirect is handled by the controller, no need to redirect here
          console.log('[MobileUserForm] Controller will handle redirect to users.index');
        },
        onError: (errors) => {
          console.log('[MobileUserForm] Update failed - onError callback', { errors });
          setError(errors);
        },
      });
    } else {
      console.log('[MobileUserForm] Calling POST to create user', {
        route: route('users.store'),
        data: data,
      });

      post(route('users.store'), {
        onSuccess: (page) => {
          console.log('[MobileUserForm] Create successful - onSuccess callback', {
            page,
            props: page.props,
            flash: page.props.flash,
          });
          reset();
          // Note: Redirect is handled by the controller, no need to redirect here
          console.log('[MobileUserForm] Controller will handle redirect to users.index');
        },
        onError: (errors) => {
          console.log('[MobileUserForm] Create failed - onError callback', { errors });
          setError(errors);
        },
      });
    }
  };

  const handleRoleChange = (roleId) => {
    setData('role_id', roleId); // Change to single role selection
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

            {isEditing && can('users.toggle-status') && (
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
            <select
              id="role_id"
              name="role_id"
              value={data.role_id}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
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
      </MobileCard>

      {/* Password Change Link */}
      {isEditing && (
        <MobileCard>
          <div className="p-4">
            <button
              type="button"
              onClick={() => router.visit(route('users.password', user.id))}
              className="w-full text-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Ubah Password Pengguna
            </button>
          </div>
        </MobileCard>
      )}

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

      {/* Confirmation Dialog for Mobile */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
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
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmSubmit}
                >
                  {isEditing ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileUserForm;
