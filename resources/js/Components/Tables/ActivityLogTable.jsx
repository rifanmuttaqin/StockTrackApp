import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import Pagination from '../Pagination';

export default function ActivityLogTable({ activities, onFilterChange }) {
    const [filters, setFilters] = useState({
        action: '',
        date_from: '',
        date_to: '',
    });

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);

        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const applyFilters = () => {
        const query = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                query.append(key, value);
            }
        });

        router.get(
            `/profile/activity-log?${query.toString()}`,
            {},
            { preserveState: true }
        );
    };

    const clearFilters = () => {
        setFilters({
            action: '',
            date_from: '',
            date_to: '',
        });

        router.get('/profile/activity-log', {}, { preserveState: true });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'login':
                return 'bg-green-100 text-green-800';
            case 'logout':
                return 'bg-gray-100 text-gray-800';
            case 'created':
                return 'bg-blue-100 text-blue-800';
            case 'updated':
                return 'bg-yellow-100 text-yellow-800';
            case 'deleted':
                return 'bg-red-100 text-red-800';
            case 'password_changed':
                return 'bg-purple-100 text-purple-800';
            case 'profile_updated':
                return 'bg-indigo-100 text-indigo-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'login':
                return (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                );
            case 'logout':
                return (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'created':
                return (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'updated':
                return (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                );
            case 'deleted':
                return (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            case 'password_changed':
                return (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                );
            case 'profile_updated':
                return (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Log Aktivitas
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Riwayat aktivitas akun Anda.
                </p>
            </div>

            {/* Filters */}
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
                    <div>
                        <label htmlFor="action" className="block text-sm font-medium text-gray-700">
                            Aksi
                        </label>
                        <select
                            id="action"
                            name="action"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                        >
                            <option value="">Semua Aksi</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="created">Dibuat</option>
                            <option value="updated">Diperbarui</option>
                            <option value="deleted">Dihapus</option>
                            <option value="password_changed">Password Diubah</option>
                            <option value="profile_updated">Profile Diperbarui</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="date_from" className="block text-sm font-medium text-gray-700">
                            Dari Tanggal
                        </label>
                        <input
                            type="date"
                            id="date_from"
                            name="date_from"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="date_to" className="block text-sm font-medium text-gray-700">
                            Sampai Tanggal
                        </label>
                        <input
                            type="date"
                            id="date_to"
                            name="date_to"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                    <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={clearFilters}
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={applyFilters}
                    >
                        Terapkan Filter
                    </button>
                </div>
            </div>

            {activities.data.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada aktivitas</h3>
                    <p className="mt-1 text-sm text-gray-500">Tidak ada aktivitas yang ditemukan dengan filter yang dipilih.</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {activities.data.map((activity) => (
                        <li key={activity.id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                                            {getActionIcon(activity.action)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-gray-900 capitalize">
                                                    {activity.action.replace('_', ' ')}
                                                </p>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {activity.description}
                                            </p>
                                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                                <div className="flex items-center">
                                                    <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                    </svg>
                                                    {activity.ip_address}
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    {formatDate(activity.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {activities.links && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <Pagination links={activities.links} />
                </div>
            )}
        </div>
    );
}
