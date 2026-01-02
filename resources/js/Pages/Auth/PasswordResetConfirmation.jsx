import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthLayout from '../../Layouts/AuthLayout';

export default function PasswordResetConfirmation() {
    return (
        <AuthLayout title="Password Berhasil Direset">
            <Head title="Password Berhasil Direset" />

            <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                    Password Berhasil Direset
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Password Anda telah berhasil direset. Anda sekarang dapat login dengan password baru Anda.
                </p>
            </div>

            <div className="mt-8">
                <div className="bg-white py-8 px-6 shadow rounded-lg">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-6">
                            Klik tombol di bawah ini untuk login ke akun Anda dengan password baru.
                        </p>

                        <Link
                            href="/login"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Login dengan Password Baru
                        </Link>
                    </div>
                </div>
            </div>

            <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                    Jika Anda mengalami masalah, silakan hubungi tim support kami.
                </p>
            </div>
        </AuthLayout>
    );
}
