import React from 'react';
import { Link } from '@inertiajs/react';
import Badge from '../UI/Badge';
import MobileCard from '../UI/MobileCard';
import MobileButton from '../UI/MobileButton';
import { usePermission } from '../../Hooks/usePermission';

const MobileNotificationTable = ({
    notifications,
    onMarkAsRead,
    formatDate,
    filters = {},
    onFilterChange,
    unreadCount,
    onMarkAllAsRead,
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
        <div className="space-y-4">
            {/* Header & Mark all as read */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                    Notifikasi: <span className="font-semibold text-indigo-600">{notifications.length} item</span>
                </span>
                {unreadCount > 0 && (
                    <MobileButton
                        variant="default"
                        size="sm"
                        onClick={onMarkAllAsRead}
                        className="text-xs h-9 min-h-[36px]"
                    >
                        Tandai Semua Dibaca
                    </MobileButton>
                )}
            </div>

            {/* Notification Cards */}
            {notifications.length === 0 ? (
                <MobileCard>
                    <div className="p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada notifikasi</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Semua notifikasi stok aman atau sesuai dengan filter Anda.
                        </p>
                    </div>
                </MobileCard>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <MobileCard 
                            key={notification.id} 
                            className={`border transition-all ${notification.read_at === null ? 'border-blue-200 bg-blue-50/20 shadow-sm' : 'border-gray-200'}`}
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="space-y-1 max-w-[70%]">
                                        <h4 className="font-semibold text-gray-900 text-base truncate">
                                            {can('product_variants.view') ? (
                                                <Link 
                                                    href={route('variants.show', notification.data?.product_variant_id)}
                                                    className="text-indigo-600 hover:text-indigo-900 active:text-indigo-800"
                                                >
                                                    {notification.data?.product_name}
                                                </Link>
                                            ) : (
                                                notification.data?.product_name
                                            )}
                                        </h4>
                                        <p className="text-sm text-gray-600 font-medium">
                                            Varian: {notification.data?.variant_name}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end space-y-1.5">
                                        {getTypeBadge(notification.data?.type)}
                                        {getStatusBadge(notification.read_at)}
                                    </div>
                                </div>

                                <div className="border-t border-dashed border-gray-100 my-3 pt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                                    <div>
                                        <span className="block text-gray-400">Stok Saat Ini</span>
                                        <span className={`text-sm font-semibold ${notification.data?.stock_current <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                            {notification.data?.stock_current}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-400">Threshold</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {notification.data?.stock_threshold}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                    <span className="text-xs text-gray-400">
                                        {formatDate(notification.created_at)}
                                    </span>
                                    
                                    <div className="flex space-x-2">
                                        {can('product_variants.view') && (
                                            <MobileButton
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.location.href = route('variants.show', notification.data?.product_variant_id)}
                                                className="h-8 py-0 px-3 text-xs min-h-[32px]"
                                            >
                                                Lihat
                                            </MobileButton>
                                        )}
                                        {notification.read_at === null && (
                                            <MobileButton
                                                variant="default"
                                                size="sm"
                                                onClick={() => onMarkAsRead(notification.id)}
                                                className="h-8 py-0 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white min-h-[32px]"
                                            >
                                                Tandai Dibaca
                                            </MobileButton>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </MobileCard>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MobileNotificationTable;
