import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import Alert from '../Alert';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';

export default function PasswordChangeForm({ user, errors = {}, isOwnProfile = false, onSuccess }) {
    const { data, setData, post, processing, reset, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordStrengthText, setPasswordStrengthText] = useState('');

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
                if (onSuccess) onSuccess();
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
        <form onSubmit={submit} className="space-y-6">
            {/* Only show current password field for own profile */}
            {isOwnProfile && (
                <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                        Password Saat Ini
                    </label>
                    <div className="mt-1">
                        <input
                            type="password"
                            id="current_password"
                            name="current_password"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            autoComplete="current-password"
                            required
                        />
                        {errors.current_password && (
                            <p className="mt-2 text-sm text-red-600">{errors.current_password}</p>
                        )}
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password Baru
                </label>
                <div className="mt-1">
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        autoComplete="new-password"
                        required
                    />
                    {errors.password && (
                        <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                    )}
                </div>

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
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                    Konfirmasi Password Baru
                </label>
                <div className="mt-1">
                    <input
                        type="password"
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        autoComplete="new-password"
                        required
                    />
                    {errors.password_confirmation && (
                        <p className="mt-2 text-sm text-red-600">{errors.password_confirmation}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {processing ? (
                        <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Memproses...</span>
                        </>
                    ) : (
                        'Update Password'
                    )}
                </button>
            </div>

            {recentlySuccessful && (
                <Alert type="success" message="Password berhasil diperbarui." className="mt-4" />
            )}
        </form>
    );
}
