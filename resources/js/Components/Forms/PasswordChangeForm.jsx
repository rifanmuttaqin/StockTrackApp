import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';

export default function PasswordChangeForm({ onSuccess }) {
    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
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
        post('/profile/password', {
            onSuccess: () => {
                reset();
                if (onSuccess) onSuccess();
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
            <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                    Password Saat Ini
                </label>
                <div className="mt-1">
                    <input
                        type="password"
                        id="current_password"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        autoComplete="current-password"
                    />
                    {errors.current_password && (
                        <p className="mt-2 text-sm text-red-600">{errors.current_password}</p>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password Baru
                </label>
                <div className="mt-1">
                    <input
                        type="password"
                        id="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        autoComplete="new-password"
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
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        autoComplete="new-password"
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
                    {processing ? 'Memproses...' : 'Update Password'}
                </button>
            </div>

            {recentlySuccessful && (
                <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">
                                Password berhasil diperbarui.
                            </h3>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
