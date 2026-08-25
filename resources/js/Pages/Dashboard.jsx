import React, { useState, useCallback } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useMobileDetection } from '@/Hooks/useMobileDetection';
import { MobileDashboard } from '@/Components/Dashboard';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PERIODS = [
    { key: 'today', label: 'Hari Ini' },
    { key: '7days', label: '7 Hari' },
    { key: '30days', label: '30 Hari' },
    { key: 'custom', label: 'Custom' },
];

const KPI_CARDS = [
    {
        key: 'totalProducts',
        label: 'Total Produk',
        color: 'blue',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
    {
        key: 'totalActiveVariants',
        label: 'Variant Aktif',
        color: 'emerald',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        key: 'lowStockCount',
        label: 'Stok Menipis',
        color: 'amber',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
        ),
    },
    {
        key: 'totalTransactions',
        label: 'Total Transaksi',
        color: 'violet',
        icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
    },
];

const COLOR_MAP = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100', text: 'text-amber-600' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', iconBg: 'bg-violet-100', text: 'text-violet-600' },
};

export default function Dashboard() {
    const { isMobile } = useMobileDetection();
    const { auth, dashboardData, filters } = usePage().props;
    const [period, setPeriod] = useState(filters?.period || '30days');
    const [customRange, setCustomRange] = useState({
        start: filters?.start_date || '',
        end: filters?.end_date || '',
    });

    const handlePeriodChange = useCallback((newPeriod) => {
        setPeriod(newPeriod);
        if (newPeriod !== 'custom') {
            router.get(route('dashboard'), { period: newPeriod }, {
                preserveState: true,
                replace: true,
            });
        }
    }, []);

    const handleCustomDateApply = useCallback(() => {
        if (customRange.start && customRange.end) {
            router.get(route('dashboard'), {
                period: 'custom',
                start_date: customRange.start,
                end_date: customRange.end,
            }, {
                preserveState: true,
                replace: true,
            });
        }
    }, [customRange]);

    if (isMobile) {
        return <MobileDashboard user={auth.user} dashboardData={dashboardData} filters={filters} />;
    }

    const data = dashboardData || {};

    return (
        <AppLayout
            title="Dashboard"
            breadcrumbs={[{ label: 'Dashboard' }]}
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Header + Period Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Selamat datang kembali, {auth.user.name}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {PERIODS.map((p) => (
                            <button
                                key={p.key}
                                onClick={() => handlePeriodChange(p.key)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                    period === p.key
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Date Range */}
                {period === 'custom' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-end gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Dari</label>
                            <input
                                type="date"
                                value={customRange.start}
                                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                className="block rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Sampai</label>
                            <input
                                type="date"
                                value={customRange.end}
                                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                className="block rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            onClick={handleCustomDateApply}
                            disabled={!customRange.start || !customRange.end}
                            className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Terapkan
                        </button>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {KPI_CARDS.map((card) => {
                        const colors = COLOR_MAP[card.color];
                        return (
                            <div
                                key={card.key}
                                className={`rounded-xl border p-5 ${colors.bg} ${colors.border}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg} ${colors.text}`}>
                                        {card.icon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {data[card.key] ?? 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Stock Movement Trend */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">
                            Trend Pergerakan Stok
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.stockMovementTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            fontSize: '13px',
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="stock_in"
                                        name="Stock In"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="stock_out"
                                        name="Stock Out"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Low Stock Bar Chart */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">
                            Produk Stok Terendah
                        </h3>
                        <div className="h-64">
                            {(data.lowStockProducts || []).length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.lowStockProducts}
                                        layout="vertical"
                                        margin={{ left: 10, right: 20, top: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="variant_name"
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={100}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                fontSize: '13px',
                                            }}
                                            formatter={(value, name, props) => [
                                                `${value} ${props.payload.unit_abbreviation || 'unit'}`,
                                                props.payload.product_name,
                                            ]}
                                        />
                                        <Bar
                                            dataKey="stock_current"
                                            name="Stok"
                                            fill="#f59e0b"
                                            radius={[0, 4, 4, 0]}
                                            maxBarSize={24}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                                    Tidak ada produk dengan stok rendah
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Low Stock Table */}
                {(data.lowStockProducts || []).length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-base font-semibold text-gray-900">
                                Daftar Produk Stok Menipis
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left px-6 py-3 font-medium text-gray-500">Produk</th>
                                        <th className="text-left px-6 py-3 font-medium text-gray-500">Variant</th>
                                        <th className="text-right px-6 py-3 font-medium text-gray-500">Stok Saat Ini</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data.lowStockProducts.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 text-gray-900 font-medium">{item.product_name}</td>
                                            <td className="px-6 py-3 text-gray-600">{item.variant_name}</td>
                                            <td className="px-6 py-3 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    item.stock_current === 0
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {item.stock_current}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
