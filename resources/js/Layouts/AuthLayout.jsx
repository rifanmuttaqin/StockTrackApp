import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { useMobileDetection } from '@/Hooks/useMobileDetection';

export default function AuthLayout({ title, children }) {
    const { isMobile } = useMobileDetection();

    if (isMobile) {
        // Mobile layout - minimal wrapper since MobileLogin component handles the full layout
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
                <Head title={title} />
                {children}
            </div>
        );
    }

    // Desktop layout
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Head title={title} />

            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-poppins">
                        {title}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 font-poppins">
                        StockTrackApp - Aplikasi Manajemen Stok
                    </p>
                </div>

                {children}

                <div className="text-center">
                    <Link href="/" className="font-medium text-blue-600 hover:text-blue-500 font-poppins">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}
