import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import Alert from '../Alert';
import LoadingSpinner from '../LoadingSpinner';

export default function ForgotPasswordForm() {
    const [showSuccess, setShowSuccess] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password', {
            onSuccess: () => {
                setShowSuccess(true);
                reset('email');
            },
        });
    };

    return (
        <div className="mt-8">
            {showSuccess ? (
                <Alert
                    type="success"
                    title="Link Reset Password Terkirim"
                    message="Kami telah mengirimkan link reset password ke email Anda. Silakan periksa inbox Anda dan ikuti instruksi untuk reset password."
                    className="mb-6"
                />
            ) : (
                <div className="mb-6">
                    <p className="text-sm text-gray-600">
                        Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
                    </p>
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
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
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                    <button
                        type="submit"
                        disabled={processing || showSuccess}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <div className="flex items-center">
                                <LoadingSpinner size="sm" color="white" />
                                <span className="ml-2">Mengirim...</span>
                            </div>
                        ) : (
                            'Kirim Link Reset Password'
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
