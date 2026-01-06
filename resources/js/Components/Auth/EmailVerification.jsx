import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Alert, LoadingSpinner } from '../UI';

export default function EmailVerification({ email }) {
    const [countdown, setCountdown] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: email || '',
    });

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResend = (e) => {
        e.preventDefault();
        post('/email/verification-notification', {
            onSuccess: () => {
                setShowSuccess(true);
                setCountdown(60); // 60 seconds countdown
                setTimeout(() => setShowSuccess(false), 5000); // Hide success message after 5 seconds
            },
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
                    <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                    Verifikasi Email Anda
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Kami telah mengirimkan link verifikasi ke email Anda. Silakan periksa inbox Anda.
                </p>
            </div>

            {showSuccess && (
                <Alert
                    type="success"
                    title="Email Verifikasi Terkirim"
                    message="Link verifikasi baru telah dikirim ke email Anda."
                    className="mb-6"
                />
            )}

            <div className="bg-white py-8 px-6 shadow rounded-lg">
                <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                        Tidak menerima email? Periksa folder spam Anda atau kirim ulang email verifikasi.
                    </p>

                    <form onSubmit={handleResend}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
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
                                disabled={processing || countdown > 0}
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || countdown > 0}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <div className="flex items-center">
                                    <LoadingSpinner size="sm" color="white" />
                                    <span className="ml-2">Mengirim...</span>
                                </div>
                            ) : countdown > 0 ? (
                                `Kirim Ulang (${formatTime(countdown)})`
                            ) : (
                                'Kirim Ulang Email Verifikasi'
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="text-center">
                <a
                    href="/login"
                    className="font-medium text-blue-600 hover:text-blue-500"
                >
                    Kembali ke Login
                </a>
            </div>
        </div>
    );
}
