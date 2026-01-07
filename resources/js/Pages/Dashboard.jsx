import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import { useMobileDetection } from '@/Hooks/useMobileDetection';
import { MobileDashboard } from '@/Components/Dashboard';

export default function Dashboard() {
    const { isMobile } = useMobileDetection();
    const { auth } = usePage().props;

    // Render mobile dashboard for mobile devices
    if (isMobile) {
        return <MobileDashboard user={auth.user} />;
    }

    // Render desktop dashboard for desktop devices
    return (
        <AppLayout
            title="Dashboard"
            breadcrumbs={[{ label: 'Dashboard' }]}
        >
            <Head title="Dashboard" />

            <div className="bg-white shadow-sm rounded-lg p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-poppins font-medium text-gray-900 mb-2">
                                Selamat datang kembali, {auth.user.name}!
                            </h3>
                            <p className="text-sm font-poppins text-gray-600">
                                Berikut adalah ringkasan aktivitas sistem Anda hari ini.
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                                        <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-poppins font-medium text-blue-600">Total Produk</p>
                                        <p className="text-2xl font-poppins font-bold text-gray-900 mt-1">1,234</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                                        <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-poppins font-medium text-green-600">Penjualan Hari Ini</p>
                                        <p className="text-2xl font-poppins font-bold text-gray-900 mt-1">Rp 2.5M</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                                        <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-poppins font-medium text-yellow-600">Stok Menipis</p>
                                        <p className="text-2xl font-poppins font-bold text-gray-900 mt-1">23</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                                        <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-poppins font-medium text-purple-600">Pesanan Baru</p>
                                        <p className="text-2xl font-poppins font-bold text-gray-900 mt-1">45</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-poppins font-medium text-gray-900 mb-4">Aksi Cepat</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <button className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                                    <svg className="h-8 w-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-sm font-poppins font-medium text-gray-700">Tambah Produk</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all">
                                    <svg className="h-8 w-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <span className="text-sm font-poppins font-medium text-gray-700">Kelola Stok</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:border-yellow-300 hover:shadow-md transition-all">
                                    <svg className="h-8 w-8 text-yellow-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m0 0V8a2 2 0 012-2h8a2 2 0 012 2v6m0 0v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    <span className="text-sm font-poppins font-medium text-gray-700">Laporan</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
                                    <svg className="h-8 w-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span className="text-sm font-poppins font-medium text-gray-700">Pengguna</span>
                                </button>
                            </div>
                        </div>
                    </div>
            </AppLayout>
    );
}
