import React from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useMobileDetection } from '@/Hooks/useMobileDetection';
import { MobileDashboard } from '@/Components/Dashboard';

export default function Dashboard() {
    const { isMobile } = useMobileDetection();
    const { auth, dashboardData } = usePage().props;

    // Render mobile dashboard for mobile devices
    if (isMobile) {
        return <MobileDashboard user={auth.user} dashboardData={dashboardData} />;
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

                {/* Stats Cards - Only 4 required infographics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* 1. Total Produk */}
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
                                <p className="text-2xl font-poppins font-bold text-gray-900 mt-1">{dashboardData?.totalProducts || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Stok Menipis */}
                    <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                                <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-poppins font-medium text-yellow-600">Stok Menipis</p>
                                <p className="text-2xl font-poppins font-bold text-gray-900 mt-1">{dashboardData?.lowStockCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Ringkasan record stock aktif hari ini */}
                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-poppins font-medium text-green-600">Record Stock Aktif Hari Ini</p>
                                <p className="text-2xl font-poppins font-bold text-gray-900 mt-1">{dashboardData?.todayStockRecords || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Aksi Cepat Info Card */}
                    <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                                <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-poppins font-medium text-purple-600">Aksi Cepat</p>
                                <p className="text-2xl font-poppins font-bold text-gray-900 mt-1">2 Menu</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-poppins font-medium text-gray-900 mb-4">Aksi Cepat</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href={route('stock-out.create')} className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                            <svg className="h-8 w-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-sm font-poppins font-medium text-gray-700">Buat Stock Out</span>
                        </Link>
                        <Link href={route('stock-out.index')} className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all">
                            <svg className="h-8 w-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span className="text-sm font-poppins font-medium text-gray-700">Daftar Stock Out</span>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
