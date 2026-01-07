import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { useAuth } from '../../Context/AuthContext';
import AvatarUpload from '../../Components/Forms/AvatarUpload';
import SessionsTable from '../../Components/Tables/SessionsTable';
import ActivityLogTable from '../../Components/Tables/ActivityLogTable';
import { Alert } from '../../Components/UI';

export default function ProfileShow() {
    const { user, sessions, activities } = usePage().props;
    const { flash } = usePage().props;
    const { updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const handleAvatarUploadSuccess = () => {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        // In a real implementation, you would refresh the user data
        // updateUser({ ...user, avatar: newAvatar });
    };

    const handleSessionRevoked = () => {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
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

    const getRoleName = (role) => {
        switch (role) {
            case 'admin':
                return 'Administrator';
            case 'manager':
                return 'Manager';
            case 'user':
                return 'User';
            default:
                return role;
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            case 'manager':
                return 'bg-blue-100 text-blue-800';
            case 'user':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout
            title="Profile"
            breadcrumbs={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Profil' }
            ]}
        >
            <Head title="Profile" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Success Message */}
                    {(flash.success || showSuccessMessage) && (
                        <div className="mb-6">
                            <Alert type="success" message={flash.success || 'Perubahan berhasil disimpan.'} />
                        </div>
                    )}

                    {/* Error Message */}
                    {flash.error && (
                        <div className="mb-6">
                            <Alert type="error" message={flash.error} />
                        </div>
                    )}

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        {/* Profile Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-5 sm:px-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    {user?.avatar ? (
                                        <img
                                            className="h-20 w-20 rounded-full border-4 border-white"
                                            src={`/storage/${user.avatar}`}
                                            alt={`${user.name}'s avatar`}
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-white border-4 border-white flex items-center justify-center">
                                            <span className="text-2xl font-bold text-blue-500">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-6">
                                    <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                                    <p className="text-blue-100">{user?.email}</p>
                                    <div className="mt-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                                            {getRoleName(user?.role)}
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-auto">
                                    <Link
                                        href="/profile/edit"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <svg className="mr-2 -ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                        Edit Profile
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-4" aria-label="Tabs">
                                {[
                                    { id: 'profile', name: 'Informasi Profile' },
                                    { id: 'avatar', name: 'Avatar' },
                                    { id: 'sessions', name: 'Sesi' },
                                    { id: 'activity', name: 'Aktivitas' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                                            ${activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        {tab.name}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="px-4 py-5 sm:p-6">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        Informasi Profile
                                    </h3>
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Nama Lengkap</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{user?.name || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{user?.email || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Nomor Telepon</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{user?.phone || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Role</dt>
                                            <dd className="mt-1">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                                                    {getRoleName(user?.role)}
                                                </span>
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500">Alamat</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{user?.address || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500">Bio</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{user?.bio || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Terakhir Login</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{user?.last_login_at ? formatDate(user.last_login_at) : '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500">Bergabung Sejak</dt>
                                            <dd className="mt-1 text-sm text-gray-900">{user?.created_at ? formatDate(user.created_at) : '-'}</dd>
                                        </div>
                                    </dl>
                                </div>
                            )}

                            {/* Avatar Tab */}
                            {activeTab === 'avatar' && (
                                <div>
                                    <div className="mb-6">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Avatar
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Perbarui foto profile Anda.
                                        </p>
                                    </div>
                                    <AvatarUpload user={user} onSuccess={handleAvatarUploadSuccess} />
                                </div>
                            )}

                            {/* Sessions Tab */}
                            {activeTab === 'sessions' && (
                                <div>
                                    <div className="mb-6">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Sesi Aktif
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Kelola sesi login Anda di berbagai perangkat.
                                        </p>
                                    </div>
                                    <SessionsTable sessions={sessions} onSessionRevoked={handleSessionRevoked} />
                                </div>
                            )}

                            {/* Activity Tab */}
                            {activeTab === 'activity' && (
                                <div>
                                    <div className="mb-6">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Log Aktivitas
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Riwayat aktivitas akun Anda.
                                        </p>
                                    </div>
                                    <ActivityLogTable activities={activities} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
