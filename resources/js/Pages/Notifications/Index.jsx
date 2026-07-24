import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { useNotifications } from '@/Providers/NotificationProvider';

export default function NotificationsIndex({
    notifications,
    pagination,
    unreadCount: initialUnreadCount,
    filters,
    error,
}) {
    const { markAsRead, markAllAsRead } = useNotifications();
    const [currentFilter, setCurrentFilter] = useState(filters.status || 'all');

    const handleFilterChange = (status) => {
        setCurrentFilter(status);
        router.get(route('notifications.index'), { status }, { preserveState: true });
    };

    const handleMarkAsRead = async (id) => {
        await markAsRead(id);
        router.reload({ only: ['notifications', 'unreadCount'] });
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        router.reload({ only: ['notifications', 'unreadCount'] });
    };

    const handlePageChange = (page) => {
        router.get(route('notifications.index'), { page, status: currentFilter }, { preserveState: true });
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

    // Get type badge
    const getTypeBadge = (type) => {
        if (type === 'out_of_stock') {
            return (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    Stok Habis
                </span>
            );
        }
        return (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                Stok Rendah
            </span>
        );
    };

    // Get status badge
    const getStatusBadge = (readAt) => {
        if (readAt === null) {
            return (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    Belum Dibaca
                </span>
            );
        }
        return (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                Sudah Dibaca
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Notifikasi Stok
                    </h2>
                    {initialUnreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Tandai Semua Dibaca
                        </button>
                    )}
                </div>
            }
            breadcrumbs={[
                { label: 'Dashboard', href: route('dashboard') },
                { label: 'Notifikasi' },
            ]}
        >
            <Head title="Notifikasi Stok" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        {/* Filter Tabs */}
                        <div className="border-b border-gray-200 px-6 py-4">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => handleFilterChange('all')}
                                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                                        currentFilter === 'all'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => handleFilterChange('unread')}
                                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                                        currentFilter === 'unread'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    Belum Dibaca
                                    {initialUnreadCount > 0 && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                            {initialUnreadCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleFilterChange('read')}
                                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                                        currentFilter === 'read'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    Sudah Dibaca
                                </button>
                            </nav>
                        </div>

                        {/* Notification Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Produk
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Varian
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Stok Saat Ini
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Threshold
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Tipe
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Tanggal
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {notifications.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-sm text-gray-500">
                                                Tidak ada notifikasi ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        notifications.map((notification) => (
                                            <tr
                                                key={notification.id}
                                                className={notification.read_at === null ? 'bg-blue-50' : ''}
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {notification.data?.product_name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {notification.data?.variant_name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    <span className={notification.data?.stock_current <= 0 ? 'font-bold text-red-600' : ''}>
                                                        {notification.data?.stock_current}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {notification.data?.stock_threshold}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    {getTypeBadge(notification.data?.type)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    {getStatusBadge(notification.read_at)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {formatDate(notification.created_at)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                    {notification.read_at === null && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Tandai Dibaca
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Menampilkan <span className="font-medium">{pagination.from}</span> sampai{' '}
                                        <span className="font-medium">{pagination.to}</span> dari{' '}
                                        <span className="font-medium">{pagination.total}</span> notifikasi
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.current_page - 1)}
                                            disabled={pagination.current_page === 1}
                                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Sebelumnya
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(pagination.current_page + 1)}
                                            disabled={pagination.current_page === pagination.last_page}
                                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Selanjutnya
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
