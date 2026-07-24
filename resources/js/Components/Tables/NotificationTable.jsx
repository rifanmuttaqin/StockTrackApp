import React from 'react';
import { Link } from '@inertiajs/react';
import Badge from '../UI/Badge';
import { usePermission } from '../../Hooks/usePermission';

const NotificationTable = ({
    notifications,
    onMarkAsRead,
    formatDate,
}) => {
    const { can } = usePermission();

    const getStatusBadge = (readAt) => {
        if (readAt === null) {
            return (
                <Badge variant="info">
                    Belum Dibaca
                </Badge>
            );
        }
        return (
            <Badge className="bg-gray-100 text-gray-800">
                Sudah Dibaca
            </Badge>
        );
    };

    const getTypeBadge = (type) => {
        if (type === 'out_of_stock') {
            return (
                <Badge variant="error">
                    Stok Habis
                </Badge>
            );
        }
        return (
            <Badge variant="warning">
                Stok Rendah
            </Badge>
        );
    };

    return (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Daftar notifikasi stok">
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
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Aksi</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white" role="rowgroup">
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
                                className={`hover:bg-gray-50 transition-colors ${notification.read_at === null ? 'bg-blue-50/40 font-medium' : ''}`}
                                role="row"
                            >
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                    {can('product_variants.view') ? (
                                        <Link
                                            href={route('variants.show', notification.data?.product_variant_id)}
                                            className="text-indigo-600 hover:text-indigo-900 hover:underline font-semibold"
                                        >
                                            {notification.data?.product_name}
                                        </Link>
                                    ) : (
                                        notification.data?.product_name
                                    )}
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
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2" role="group" aria-label={`Aksi untuk notifikasi ${notification.data?.product_name}`}>
                                        {can('product_variants.view') && (
                                            <Link
                                                href={route('variants.show', notification.data?.product_variant_id)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Lihat Detail Varian"
                                                aria-label={`Lihat detail ${notification.data?.product_name}`}
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </Link>
                                        )}
                                        {notification.read_at === null && (
                                            <button
                                                onClick={() => onMarkAsRead(notification.id)}
                                                className="text-emerald-600 hover:text-emerald-900 transition-colors"
                                                title="Tandai dibaca"
                                                aria-label={`Tandai dibaca notifikasi ${notification.data?.product_name}`}
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default NotificationTable;
