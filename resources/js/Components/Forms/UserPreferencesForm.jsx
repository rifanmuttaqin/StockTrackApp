import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';

export default function UserPreferencesForm({ user, onSuccess }) {
    const preferences = user?.preferences || {};

    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        theme: preferences.theme || 'light',
        language: preferences.language || 'id',
        timezone: preferences.timezone || 'Asia/Jakarta',
        notifications: {
            email: preferences.notifications?.email !== false,
            push: preferences.notifications?.push !== false,
            sms: preferences.notifications?.sms === true,
        },
    });

    const submit = (e) => {
        e.preventDefault();
        post('/profile/preferences', {
            onSuccess: () => {
                if (onSuccess) onSuccess();
            },
        });
    };

    const handleNotificationChange = (type, value) => {
        setData('notifications', {
            ...data.notifications,
            [type]: value,
        });
    };

    const themes = [
        { value: 'light', label: 'Terang', icon: '☀️' },
        { value: 'dark', label: 'Gelap', icon: '🌙' },
        { value: 'auto', label: 'Otomatis', icon: '🔄' },
    ];

    const languages = [
        { value: 'id', label: 'Bahasa Indonesia' },
        { value: 'en', label: 'English' },
        { value: 'zh', label: '中文' },
    ];

    const timezones = [
        { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB)' },
        { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA)' },
        { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT)' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore' },
        { value: 'Asia/Bangkok', label: 'Asia/Bangkok' },
        { value: 'UTC', label: 'UTC' },
    ];

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Theme Selection */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tema</h3>
                <div className="grid grid-cols-3 gap-3">
                    {themes.map((theme) => (
                        <div
                            key={theme.value}
                            className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                                data.theme === theme.value
                                    ? 'border-blue-500 ring-2 ring-blue-500'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onClick={() => setData('theme', theme.value)}
                        >
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">{theme.icon}</span>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{theme.label}</p>
                                    <p className="text-xs text-gray-500">
                                        {theme.value === 'light' && 'Tampilan terang'}
                                        {theme.value === 'dark' && 'Tampilan gelap'}
                                        {theme.value === 'auto' && 'Mengikuti sistem'}
                                    </p>
                                </div>
                            </div>
                            {data.theme === theme.value && (
                                <div className="absolute top-2 right-2">
                                    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Language Selection */}
            <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                    Bahasa
                </label>
                <div className="mt-1">
                    <select
                        id="language"
                        name="language"
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={data.language}
                        onChange={(e) => setData('language', e.target.value)}
                    >
                        {languages.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                    {errors.language && (
                        <p className="mt-2 text-sm text-red-600">{errors.language}</p>
                    )}
                </div>
            </div>

            {/* Timezone Selection */}
            <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                    Zona Waktu
                </label>
                <div className="mt-1">
                    <select
                        id="timezone"
                        name="timezone"
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={data.timezone}
                        onChange={(e) => setData('timezone', e.target.value)}
                    >
                        {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                                {tz.label}
                            </option>
                        ))}
                    </select>
                    {errors.timezone && (
                        <p className="mt-2 text-sm text-red-600">{errors.timezone}</p>
                    )}
                </div>
            </div>

            {/* Notification Preferences */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preferensi Notifikasi</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="email_notifications"
                                name="email_notifications"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={data.notifications.email}
                                onChange={(e) => handleNotificationChange('email', e.target.checked)}
                            />
                            <label htmlFor="email_notifications" className="ml-3 text-sm text-gray-700">
                                Notifikasi Email
                            </label>
                        </div>
                        <p className="text-sm text-gray-500 max-w-xs">
                            Terima notifikasi penting melalui email
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="push_notifications"
                                name="push_notifications"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={data.notifications.push}
                                onChange={(e) => handleNotificationChange('push', e.target.checked)}
                            />
                            <label htmlFor="push_notifications" className="ml-3 text-sm text-gray-700">
                                Notifikasi Push
                            </label>
                        </div>
                        <p className="text-sm text-gray-500 max-w-xs">
                            Terima notifikasi langsung di browser
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="sms_notifications"
                                name="sms_notifications"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={data.notifications.sms}
                                onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                            />
                            <label htmlFor="sms_notifications" className="ml-3 text-sm text-gray-700">
                                Notifikasi SMS
                            </label>
                        </div>
                        <p className="text-sm text-gray-500 max-w-xs">
                            Terima notifikasi penting melalui SMS
                        </p>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {processing ? 'Menyimpan...' : 'Simpan Preferensi'}
                </button>
            </div>

            {/* Success Message */}
            {recentlySuccessful && (
                <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">
                                Preferensi berhasil diperbarui.
                            </h3>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
