import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Alert from '../Alert';
import LoadingSpinner from '../LoadingSpinner';

export default function ResetPasswordForm({ token, email }) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordStrengthText, setPasswordStrengthText] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token || '',
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const checkPasswordStrength = (password) => {
        if (!password) {
            setPasswordStrength(0);
            setPasswordStrengthText('');
            return;
        }

        let strength = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
        };

        strength = Object.values(checks).filter(Boolean).length;

        setPasswordStrength(strength);

        if (strength < 2) {
            setPasswordStrengthText('Lemah');
        } else if (strength < 4) {
            setPasswordStrengthText('Sedang');
        } else {
            setPasswordStrengthText('Kuat');
        }
    };

    const handlePasswordChange = (e) => {
        const password = e.target.value;
        setData('password', password);
        checkPasswordStrength(password);
    };

    const submit = (e) => {
        e.preventDefault();
        post('/reset-password', {
            onSuccess: () => {
                setShowSuccess(true);
                reset();
            },
        });
    };

    const getStrengthColor = () => {
        if (passwordStrength < 2) return 'bg-red-500';
        if (passwordStrength < 4) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthWidth = () => {
        return `${(passwordStrength / 5) * 100}%`;
    };

    return (
        <div className="mt-8">
            {showSuccess ? (
                <Alert
                    type="success"
                    title="Password Berhasil Direset"
                    message="Password Anda telah berhasil direset. Silakan login dengan password baru Anda."
                    className="mb-6"
                />
            ) : (
                <div className="mb-6">
                    <p className="text-sm text-gray-600">
                        Masukkan password baru Anda untuk mengganti password lama.
                    </p>
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <input type="hidden" name="token" value={data.token} />

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50"
                            placeholder="email@example.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={showSuccess}
                        />
                        {errors.email && (
                            <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password Baru
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Minimal 8 karakter"
                            value={data.password}
                            onChange={handlePasswordChange}
                            disabled={showSuccess}
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
                                    passwordStrength < 2 ? 'text-red-500' :
                                    passwordStrength < 4 ? 'text-yellow-500' : 'text-green-500'
                                }`}>
                                    {passwordStrengthText}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                                    style={{ width: getStrengthWidth() }}
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
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Ulangi password baru"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            disabled={showSuccess}
                        />
                        {errors.password_confirmation && (
                            <p className="mt-2 text-sm text-red-600">{errors.password_confirmation}</p>
                        )}
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={processing || showSuccess}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <div className="flex items-center">
                                <LoadingSpinner size="sm" color="white" />
                                <span className="ml-2">Mengatur ulang...</span>
                            </div>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </div>

                <div className="text-center">
                    <a
                        href="/login"
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        Kembali ke Login
                    </a>
                </div>
            </form>
        </div>
    );
}
