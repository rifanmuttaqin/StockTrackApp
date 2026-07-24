import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import NotificationTable from '../../Components/Tables/NotificationTable';
import MobileNotificationTable from '../../Components/Notification/MobileNotificationTable';
import { Pagination, Alert, LoadingSpinner } from '../../Components/UI';
import { useNotifications } from '@/Providers/NotificationProvider';
import { useMobileDetection } from '../../Hooks/useMobileDetection';

export default function NotificationsIndex({
    notifications,
    pagination,
    unreadCount,
    filters,
    error,
}) {
    const { props } = usePage();
    const { markAsRead, markAllAsRead } = useNotifications();
    const { isMobile } = useMobileDetection();
    const [loading, setLoading] = useState(false);
    const [currentFilter, setCurrentFilter] = useState(filters.status || 'all');

    useEffect(() => {
        setCurrentFilter(filters.status || 'all');
    }, [filters.status]);

    const handleFilterChange = (status) => {
        setCurrentFilter(status);
        router.get(
            route('notifications.index'),
            { status },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            }
        );
    };

    const handleMarkAsRead = async (id) => {
        setLoading(true);
        try {
            await markAsRead(id);
            router.reload({
                only: ['notifications', 'unreadCount'],
                onFinish: () => setLoading(false),
            });
        } catch (err) {
            setLoading(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            await markAllAsRead();
            router.reload({
                only: ['notifications', 'unreadCount'],
                onFinish: () => setLoading(false),
            });
        } catch (err) {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        router.get(
            route('notifications.index'),
            { page, status: currentFilter },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            }
        );
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout
            title="Notifikasi Stok"
            breadcrumbs={[
                { label: 'Dashboard', href: route('dashboard') },
                { label: 'Notifikasi' },
            ]}
        >
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Notifikasi Stok
                        </h2>
                    </div>
                    {!isMobile && unreadCount > 0 && (
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <button
                                onClick={handleMarkAllAsRead}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                Tandai Semua Dibaca
                            </button>
                        </div>
                    )}
                </div>

                {/* Flash Messages */}
                {props.flash?.success && (
                    <Alert type="success" message={props.flash.success} className="mb-4" />
                )}
                {props.flash?.error && (
                    <Alert type="error" message={props.flash.error} className="mb-4" />
                )}
                {error && (
                    <Alert type="error" message={error} className="mb-4" />
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-25 flex items-center justify-center z-50">
                        <LoadingSpinner size="lg" />
                    </div>
                )}

                {/* Filter Tabs - Pill style */}
                <div className="flex flex-wrap border-b border-gray-200 mb-6 bg-white rounded-xl p-2 shadow-sm gap-2">
                    <button
                        onClick={() => handleFilterChange('all')}
                        className={`flex-1 md:flex-none text-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentFilter === 'all'
                                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        Semua
                    </button>
                    <button
                        onClick={() => handleFilterChange('unread')}
                        className={`flex-1 md:flex-none text-center px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center ${
                            currentFilter === 'unread'
                                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        Belum Dibaca
                        {unreadCount > 0 && (
                            <span className="ml-2 bg-indigo-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => handleFilterChange('read')}
                        className={`flex-1 md:flex-none text-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentFilter === 'read'
                                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        Sudah Dibaca
                    </button>
                </div>

                {/* Content Area */}
                {isMobile ? (
                    <MobileNotificationTable
                        notifications={notifications}
                        onMarkAsRead={handleMarkAsRead}
                        formatDate={formatDate}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        unreadCount={unreadCount}
                        onMarkAllAsRead={handleMarkAllAsRead}
                    />
                ) : (
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <NotificationTable
                            notifications={notifications}
                            onMarkAsRead={handleMarkAsRead}
                            formatDate={formatDate}
                        />
                    </div>
                )}

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="mt-6">
                        {isMobile ? (
                            <div className="flex justify-between items-center bg-white px-4 py-3 rounded-lg shadow">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                                    disabled={pagination.current_page <= 1}
                                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Sebelumnya
                                </button>
                                <span className="text-sm text-gray-700">
                                    Halaman {pagination.current_page} dari {pagination.last_page}
                                </span>
                                <button
                                    onClick={() => handlePageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
                                    disabled={pagination.current_page >= pagination.last_page}
                                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        ) : (
                            <Pagination
                                currentPage={pagination.current_page}
                                totalPages={pagination.last_page}
                                perPage={pagination.per_page}
                                totalItems={pagination.total}
                                from={pagination.from}
                                to={pagination.to}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                )}

                {/* Summary Stats - Responsive Grid */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Notifikasi</dt>
                                        <dd className="text-lg font-medium text-gray-900">{pagination.total || 0}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-amber-500 rounded-md flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Belum Dibaca</dt>
                                        <dd className="text-lg font-medium text-gray-900">{unreadCount || 0}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Sudah Dibaca</dt>
                                        <dd className="text-lg font-medium text-gray-900">{Math.max(0, pagination.total - unreadCount) || 0}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
