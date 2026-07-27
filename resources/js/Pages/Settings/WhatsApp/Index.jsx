import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '../../../Layouts/AppLayout';
import { Alert, LoadingSpinner } from '../../../Components/UI';
import { useMobileDetection } from '../../../Hooks/useMobileDetection';

export default function WhatsAppSettingsIndex({
    settings: initialSettings,
    users,
    status,
    defaultTemplate,
}) {
    const { props } = usePage();
    const { isMobile } = useMobileDetection();
    const [activeTab, setActiveTab] = useState('connection');
    const [testPhone, setTestPhone] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [isTesting, setIsTesting] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [hasExistingKey, setHasExistingKey] = useState(initialSettings.has_api_key);

    const template = initialSettings.message_template || defaultTemplate;

    const { data, setData, put, processing, errors } = useForm({
        is_active: initialSettings.is_active ?? false,
        api_key: '',
        api_url: initialSettings.api_url || '',
        phone_number_id: initialSettings.phone_number_id || '',
        message_template: template,
        recipients: initialSettings.recipients || [],
        notify_low_stock: initialSettings.notify_low_stock ?? true,
        notify_out_of_stock: initialSettings.notify_out_of_stock ?? true,
        batch_size: initialSettings.batch_size || 10,
        batch_delay: initialSettings.batch_delay || 1,
        send_status: initialSettings.send_status ?? false,
    });

    const tabs = [
        { id: 'connection', label: 'Koneksi API' },
        { id: 'template', label: 'Template Pesan' },
        { id: 'recipients', label: 'Penerima' },
        { id: 'preferences', label: 'Preferensi' },
        { id: 'status', label: 'Status & Monitoring' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('settings.whatsapp.update'), {
            preserveScroll: true,
            onSuccess: () => {
                if (data.api_key) {
                    setHasExistingKey(true);
                    setData('api_key', '');
                }
            },
        });
    };

    const handleTestConnection = async () => {
        if (!testPhone.trim()) {
            setTestResult({ success: false, message: 'Masukkan nomor telepon tujuan' });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const response = await fetch(route('settings.whatsapp.test'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({ phone: testPhone }),
            });

            const result = await response.json();
            setTestResult(result);
        } catch (err) {
            setTestResult({
                success: false,
                message: 'Terjadi kesalahan: ' + err.message,
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleTemplateChange = (type, field, value) => {
        setData('message_template', {
            ...data.message_template,
            [type]: {
                ...(data.message_template[type] || {}),
                [field]: value,
            },
        });
    };

    const handleRecipientToggle = (userId) => {
        const current = data.recipients || [];
        if (current.includes(userId)) {
            setData('recipients', current.filter((id) => id !== userId));
        } else {
            setData('recipients', [...current, userId]);
        }
    };

    const handleSelectAllRecipients = () => {
        setData('recipients', users.map((u) => u.id));
    };

    const handleDeselectAllRecipients = () => {
        setData('recipients', []);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderDesktop = () => (
        <div className="flex gap-6">
            {/* Sidebar Tabs */}
            <div className="w-56 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <nav className="p-2 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-6">
                {renderTabContent()}
            </div>
        </div>
    );

    const renderMobile = () => (
        <div className="space-y-4">
            {/* Mobile Tab Pills */}
            <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                            activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {renderTabContent()}
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'connection':
                return renderConnectionTab();
            case 'template':
                return renderTemplateTab();
            case 'recipients':
                return renderRecipientsTab();
            case 'preferences':
                return renderPreferencesTab();
            case 'status':
                return renderStatusTab();
            default:
                return null;
        }
    };

    // =========== TAB 1: CONNECTION ===========
    const renderConnectionTab = () => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Konfigurasi API</h3>
                <p className="mt-1 text-sm text-gray-500">Atur koneksi WhatsApp Business API.</p>
            </div>
            <div className="p-6 space-y-5">
                {/* Toggle Active */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                        <h4 className="text-sm font-medium text-gray-900">Notifikasi WhatsApp</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Aktifkan/nonaktifkan pengiriman notifikasi via WhatsApp</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setData('is_active', !data.is_active)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            data.is_active ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                        role="switch"
                        aria-checked={data.is_active}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                data.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                {/* API Key */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key <span className="text-red-500">*</span>
                    </label>
                    {hasExistingKey && !showApiKey && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-500">API key sudah tersimpan.</span>
                            <button
                                type="button"
                                onClick={() => setShowApiKey(true)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Ganti API Key
                            </button>
                        </div>
                    )}
                    {(!hasExistingKey || showApiKey) && (
                        <>
                            <input
                                type="password"
                                value={data.api_key}
                                onChange={(e) => setData('api_key', e.target.value)}
                                placeholder="Masukkan API key"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                            />
                            {errors.api_key && (
                                <p className="mt-1 text-sm text-red-600">{errors.api_key}</p>
                            )}
                        </>
                    )}
                </div>

                {/* API URL */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        API URL <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="url"
                        value={data.api_url}
                        onChange={(e) => setData('api_url', e.target.value)}
                        placeholder="https://api.example.com"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                    />
                    <p className="mt-1 text-xs text-gray-500">Base URL tanpa path endpoint (contoh: https://192.168.1.118:8080)</p>
                    {errors.api_url && (
                        <p className="mt-1 text-sm text-red-600">{errors.api_url}</p>
                    )}
                </div>

                {/* Instance ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instance ID <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.phone_number_id}
                        onChange={(e) => setData('phone_number_id', e.target.value)}
                        placeholder="Contoh: simplecmpos"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                    />
                    <p className="mt-1 text-xs text-gray-500">ID instance WhatsApp yang digunakan di URL endpoint (contoh: <code className="bg-gray-100 px-1 rounded">simplecmpos</code> → /message/sendText/simplecmpos)</p>
                    {errors.phone_number_id && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone_number_id}</p>
                    )}
                </div>

                {/* Test Connection */}
                <div className="border-t border-gray-200 pt-5 mt-5">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Test Koneksi</h4>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            placeholder="Nomor telepon (contoh: 6281234567890)"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                        />
                        <button
                            type="button"
                            onClick={handleTestConnection}
                            disabled={isTesting || !data.is_active}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                        >
                            {isTesting ? 'Mengirim...' : 'Kirim Test'}
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        ℹ️ Pesan test tetap bisa dikirim meskipun Status Pengiriman Aktif dimatikan
                    </p>
                    {testResult && (
                        <div className={`mt-3 p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            {testResult.message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // =========== TAB 2: TEMPLATE ===========
    const renderTemplateTab = () => (
        <div className="space-y-6">
            {/* Low Stock Template */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Template Low Stock</h3>
                    <p className="mt-1 text-sm text-gray-500">Pesan yang dikirim ketika stok di bawah threshold.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subjek</label>
                        <input
                            type="text"
                            value={data.message_template?.low_stock?.subject || ''}
                            onChange={(e) => handleTemplateChange('low_stock', 'subject', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pesan</label>
                        <textarea
                            value={data.message_template?.low_stock?.body || ''}
                            onChange={(e) => handleTemplateChange('low_stock', 'body', e.target.value)}
                            rows={6}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Out of Stock Template */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Template Out of Stock</h3>
                    <p className="mt-1 text-sm text-gray-500">Pesan yang dikirim ketika stok habis.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subjek</label>
                        <input
                            type="text"
                            value={data.message_template?.out_of_stock?.subject || ''}
                            onChange={(e) => handleTemplateChange('out_of_stock', 'subject', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pesan</label>
                        <textarea
                            value={data.message_template?.out_of_stock?.body || ''}
                            onChange={(e) => handleTemplateChange('out_of_stock', 'body', e.target.value)}
                            rows={6}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Placeholder Guide */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Placeholder yang Tersedia</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                        ['{product_name}', 'Nama Produk'],
                        ['{variant_name}', 'Nama Varian'],
                        ['{stock_current}', 'Stok Saat Ini'],
                        ['{stock_threshold}', 'Threshold Stok'],
                        ['{type}', 'Tipe Alert'],
                        ['{timestamp}', 'Waktu Notifikasi'],
                    ].map(([placeholder, label]) => (
                        <div key={placeholder} className="flex items-center gap-2 text-sm">
                            <code className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                                {placeholder}
                            </code>
                            <span className="text-blue-700">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // =========== TAB 3: RECIPIENTS ===========
    const renderRecipientsTab = () => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Penerima Notifikasi</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Pilih pengguna yang akan menerima notifikasi WhatsApp.
                            Terpilih: {data.recipients?.length || 0} dari {users.length}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleSelectAllRecipients}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Pilih Semua
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            type="button"
                            onClick={handleDeselectAllRecipients}
                            className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                            Batal Semua
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-6">
                {errors.recipients && (
                    <p className="mb-4 text-sm text-red-600">{errors.recipients}</p>
                )}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {users.map((user) => (
                        <label
                            key={user.id}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                data.recipients?.includes(user.id)
                                    ? 'bg-blue-50 border-blue-300'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={data.recipients?.includes(user.id) || false}
                                onChange={() => handleRecipientToggle(user.id)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div className="ml-3 flex-1">
                                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                                <span className="text-sm text-gray-500 ml-2">{user.email}</span>
                            </div>
                        </label>
                    ))}
                </div>
                {users.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-8">Tidak ada pengguna tersedia.</p>
                )}
            </div>
        </div>
    );

    // =========== TAB 4: PREFERENCES ===========
    const renderPreferencesTab = () => (
        <div className="space-y-6">
            {/* Alert Types */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Jenis Notifikasi</h3>
                    <p className="mt-1 text-sm text-gray-500">Atur jenis stok alert yang akan dikirimkan via WhatsApp.</p>
                </div>
                <div className="p-6 space-y-4">
                    {/* Low Stock Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Peringatan Stok Rendah</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Kirim notifikasi ketika stok di bawah threshold</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setData('notify_low_stock', !data.notify_low_stock)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                data.notify_low_stock ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                            role="switch"
                            aria-checked={data.notify_low_stock}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    data.notify_low_stock ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    {/* Out of Stock Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Notifikasi Stok Habis</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Kirim notifikasi ketika stok benar-benar habis</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setData('notify_out_of_stock', !data.notify_out_of_stock)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                data.notify_out_of_stock ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                            role="switch"
                            aria-checked={data.notify_out_of_stock}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    data.notify_out_of_stock ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Batch Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Pengaturan Batch</h3>
                    <p className="mt-1 text-sm text-gray-500">Atur jumlah pesan per batch dan jeda antar batch.</p>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah per Batch
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={data.batch_size}
                            onChange={(e) => setData('batch_size', parseInt(e.target.value) || 1)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        />
                        {errors.batch_size && (
                            <p className="mt-1 text-sm text-red-600">{errors.batch_size}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jeda Antar Batch (detik)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="60"
                            value={data.batch_delay}
                            onChange={(e) => setData('batch_delay', parseInt(e.target.value) || 1)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        />
                        {errors.batch_delay && (
                            <p className="mt-1 text-sm text-red-600">{errors.batch_delay}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // =========== TAB 5: STATUS ===========
    const renderStatusTab = () => (
        <div className="space-y-6">
            {/* Service Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Status Layanan</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${status.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <span className="text-sm font-semibold text-gray-900">
                                    {status.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Konfigurasi</div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${status.is_configured ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className="text-sm font-semibold text-gray-900">
                                    {status.is_configured ? 'Lengkap' : 'Belum Lengkap'}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pengiriman Terakhir</div>
                            <div className="mt-1 text-sm font-semibold text-gray-900">
                                {formatDate(initialSettings.last_sent_at)}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jumlah Penerima</div>
                            <div className="mt-1 text-sm font-semibold text-gray-900">
                                {status.recipients_count} orang
                            </div>
                        </div>
                        {initialSettings.last_error && (
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200 sm:col-span-2">
                                <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Error Terakhir</div>
                                <div className="mt-1 text-sm text-red-800">
                                    {initialSettings.last_error}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Send Status Toggle */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Kontrol Pengiriman</h3>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Status Pengiriman Aktif</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Matikan untuk menunda notifikasi otomatis tanpa mengubah konfigurasi</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setData('send_status', !data.send_status)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                data.send_status ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                            role="switch"
                            aria-checked={data.send_status}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    data.send_status ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout
            title="WhatsApp Settings"
            breadcrumbs={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Pengaturan' },
                { label: 'WhatsApp' },
            ]}
        >
            <Head title="WhatsApp Settings" />

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                {/* Flash Messages */}
                {props.flash?.success && (
                    <Alert type="success" message={props.flash.success} className="mb-4" />
                )}
                {props.flash?.error && (
                    <Alert type="error" message={props.flash.error} className="mb-4" />
                )}

                {/* Header */}
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">WhatsApp Settings</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Kelola konfigurasi notifikasi WhatsApp untuk stok alert.
                        </p>
                    </div>
                </div>

                {/* Loading Overlay */}
                {processing && <LoadingSpinner size="lg" />}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {isMobile ? renderMobile() : renderDesktop()}

                    {/* Save Button - Always visible */}
                    <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}