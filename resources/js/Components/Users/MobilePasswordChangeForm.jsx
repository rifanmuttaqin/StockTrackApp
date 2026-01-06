import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import MobileCard from '../UI/MobileCard';
import MobileButton from '../UI/MobileButton';
import MobileInput from '../UI/MobileInput';
import MobileAlert from '../UI/MobileAlert';
import { LoadingSpinner } from '../UI';

const MobilePasswordChangeForm = ({ user, errors = {}, isOwnProfile = false }) => {
  const { data, setData, post, processing, reset, recentlySuccessful } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordStrengthText, setPasswordStrengthText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (data.password) {
      const strength = calculatePasswordStrength(data.password);
      setPasswordStrength(strength.score);
      setPasswordStrengthText(strength.text);
    } else {
      setPasswordStrength(0);
      setPasswordStrengthText('');
    }
  }, [data.password]);

  const calculatePasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Minimal 8 karakter');

    // Complexity checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Huruf kecil');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Huruf besar');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Angka');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Simbol');

    let strengthText = '';
    if (score <= 2) strengthText = 'Lemah';
    else if (score === 3) strengthText = 'Sedang';
    else if (score === 4) strengthText = 'Kuat';
    else strengthText = 'Sangat Kuat';

    return { score, text: strengthText, feedback };
  };

  const submit = (e) => {
    e.preventDefault();

    // Use different route based on whether it's own profile or another user
    const routeName = isOwnProfile ? 'profile.password' : 'users.change-password';
    const routeParams = isOwnProfile ? {} : { id: user.id };

    post(route(routeName, routeParams), {
      onSuccess: () => {
        reset();
        // Redirect back if successful
        if (!isOwnProfile) {
          router.visit(route('users.edit', user.id));
        }
      },
      onError: (errors) => {
        console.error('Password change errors:', errors);
      },
    });
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      {/* Password Change Form Card */}
      <MobileCard>
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Ubah Password
          </h3>

          <form onSubmit={submit} className="space-y-4">
            {/* Only show current password field for own profile */}
            {isOwnProfile && (
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password Saat Ini *
                </label>
                <div className="relative">
                  <MobileInput
                    type={showPassword ? 'text' : 'password'}
                    id="current_password"
                    name="current_password"
                    value={data.current_password}
                    onChange={(e) => setData('current_password', e.target.value)}
                    placeholder="Masukkan password saat ini"
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
                {errors.current_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password Baru *
              </label>
              <div className="relative">
                <MobileInput
                  type={showConfirmPassword ? 'text' : 'password'}
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}

              {/* Password Strength Indicator */}
              {data.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Kekuatan Password:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength <= 2 ? 'text-red-500' :
                      passwordStrength === 3 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {passwordStrengthText}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password Baru *
              </label>
              <MobileInput
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                placeholder="Ulangi password baru"
                required
              />
              {errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
              )}
            </div>
          </form>
        </div>
      </MobileCard>

      {/* Success Message */}
      {recentlySuccessful && (
        <MobileAlert type="success" className="mt-4">
          Password berhasil diperbarui.
        </MobileAlert>
      )}

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
          onClick={submit}
          disabled={processing}
          className="w-full sm:w-auto"
        >
          {processing ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Memproses...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Update Password
            </>
          )}
        </MobileButton>
      </div>
    </div>
  );
};

export { MobilePasswordChangeForm };
