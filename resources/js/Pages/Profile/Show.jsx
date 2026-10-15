import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import AvatarUpload from '../../Components/Forms/AvatarUpload';
import { Alert } from '../../Components/UI';

const TABS = [
    { id: 'profile', name: 'Informasi Profile' },
    { id: 'avatar', name: 'Avatar' },
];

const ROLE_LABELS = {
    admin: 'Administrator',
    manager: 'Manager',
    user: 'User',
};

const ROLE_BADGE_COLORS = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-brand-100 text-brand-800',
    user: 'bg-green-100 text-green-800',
};

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getRoleName(role) {
    return ROLE_LABELS[role] ?? role ?? '-';
}

function getRoleBadgeColor(role) {
    return ROLE_BADGE_COLORS[role] ?? 'bg-appbg text-ink';
}

export default function ProfileShow() {
    const { user, flash, auth } = usePage().props;
    const [activeTab, setActiveTab] = useState('profile');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const primaryRole = user?.roles?.[0] ?? auth?.roles?.[0] ?? null;
    const avatarSrc = user?.avatar_url ?? (user?.avatar ? `/storage/${user.avatar}` : null);

    const handleAvatarUploadSuccess = () => {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        router.reload({ only: ['auth', 'user'] });
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
                    {(flash?.success || showSuccessMessage) && (
                        <div className="mb-6">
                            <Alert type="success" message={flash?.success || 'Perubahan berhasil disimpan.'} />
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-6">
                            <Alert type="error" message={flash.error} />
                        </div>
                    )}

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        {/* Profile Header */}
                        <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-5 sm:px-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    {avatarSrc ? (
                                        <img
                                            className="h-20 w-20 rounded-full border-4 border-white object-cover"
                                            src={avatarSrc}
                                            alt={`Avatar ${user?.name ?? ''}`}
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-white border-4 border-white flex items-center justify-center">
                                            <span className="text-2xl font-bold text-brand-600">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-6">
                                    <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                                    <p className="text-brand-100">{user?.email}</p>
                                    {primaryRole && (
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(primaryRole)}`}>
                                                {getRoleName(primaryRole)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-auto">
                                    <Link
                                        href="/profile/edit"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-brand-700 bg-white hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
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
                        <div className="border-b border-slate-200">
                            <nav className="-mb-px flex space-x-8 px-4" aria-label="Tabs">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                                            ${activeTab === tab.id
                                                ? 'border-brand-500 text-brand-700'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
                            {activeTab === 'profile' && (
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-ink mb-4">
                                        Informasi Profile
                                    </h3>
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-slate-500">Nama Lengkap</dt>
                                            <dd className="mt-1 text-sm text-ink">{user?.name || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-slate-500">Email</dt>
                                            <dd className="mt-1 text-sm text-ink">{user?.email || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-slate-500">Nomor Telepon</dt>
                                            <dd className="mt-1 text-sm text-ink">{user?.phone || '-'}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-slate-500">Role</dt>
                                            <dd className="mt-1">
                                                {primaryRole ? (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(primaryRole)}`}>
                                                        {getRoleName(primaryRole)}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-ink">-</span>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-slate-500">Terakhir Login</dt>
                                            <dd className="mt-1 text-sm text-ink">{formatDate(user?.last_login_at)}</dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-slate-500">Bergabung Sejak</dt>
                                            <dd className="mt-1 text-sm text-ink">{formatDate(user?.created_at)}</dd>
                                        </div>
                                    </dl>
                                </div>
                            )}

                            {activeTab === 'avatar' && (
                                <div>
                                    <div className="mb-6">
                                        <h3 className="text-lg leading-6 font-medium text-ink">
                                            Avatar
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Perbarui foto profile Anda.
                                        </p>
                                    </div>
                                    <AvatarUpload user={user} onSuccess={handleAvatarUploadSuccess} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
