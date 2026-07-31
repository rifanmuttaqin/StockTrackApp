import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import { Alert, Badge, LoadingSpinner } from '../../Components/UI';
import { usePermission } from '../../Hooks/usePermission';
import { useMobileDetection } from '../../Hooks/useMobileDetection';
import {
    ArrowLeftIcon,
    PencilIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from '@heroicons/react/24/outline';

export default function Show({ stockOpnameRecord }) {
    const { can } = usePermission();
    const isMobile = useMobileDetection();
    const [expandedLog, setExpandedLog] = useState(null);

    const record = stockOpnameRecord;

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Format datetime
    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Status configuration
    const statusConfig = {
        draft: {
            label: 'Draft',
            variant: 'yellow',
            icon: ClockIcon,
        },
        submitted: {
            label: 'Submitted',
            variant: 'green',
            icon: CheckCircleIcon,
        },
    };

    const status = statusConfig[record.status] || statusConfig.draft;
    const StatusIcon = status.icon;

    // Calculate summary
    const summary = record.items?.reduce(
        (acc, item) => {
            if (item.difference > 0) {
                acc.surplus += item.difference;
            } else if (item.difference < 0) {
                acc.shortage += Math.abs(item.difference);
            } else {
                acc.matching += 1;
            }
            return acc;
        },
        { shortage: 0, surplus: 0, matching: 0 }
    ) || { shortage: 0, surplus: 0, matching: 0 };

    // Get row background color based on difference
    const getRowBgColor = (difference) => {
        if (difference > 0) return 'bg-green-50';
        if (difference < 0) return 'bg-red-50';
        return 'bg-white';
    };

    // Get difference text color
    const getDifferenceColor = (difference) => {
        if (difference > 0) return 'text-green-600 font-semibold';
        if (difference < 0) return 'text-red-600 font-semibold';
        return 'text-gray-500';
    };

    // Toggle audit log expansion
    const toggleLogExpand = (logId) => {
        setExpandedLog(expandedLog === logId ? null : logId);
    };

    // Format old/new values for display
    const formatValues = (values) => {
        if (!values || typeof values !== 'object') return '-';
        return Object.entries(values)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    return (
        <AppLayout
            title={`Stock Opname - ${record.transaction_code}`}
            breadcrumbs={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Stock Opname', href: '/stock-opname' },
                { label: 'Detail' },
            ]}
        >
            <Head title={`Stock Opname - ${record.transaction_code}`} />

            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 pb-20 sm:pb-0">
                {/* Header with back button */}
                <div className="mb-6">
                    <Link
                        href={route('stock-opname.index')}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-1" />
                        Back to List
                    </Link>
                </div>

                {/* Stock Opname Info Card */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {record.transaction_code}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Date: {formatDate(record.date)}
                            </p>
                        </div>
                        <Badge variant={status.variant} className="mt-2 sm:mt-0">
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {status.label}
                        </Badge>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">Created By</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {record.creator?.name || '-'}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-500">Submitted By</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {record.submitter?.name || '-'}
                            </p>
                        </div>
                    </div>

                    {record.submitted_at && (
                        <div className="mt-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Submitted At</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {formatDateTime(record.submitted_at)}
                                </p>
                            </div>
                        </div>
                    )}

                    {record.note && (
                        <div className="mt-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500">Note</p>
                                <p className="text-gray-900">{record.note}</p>
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Created: {formatDateTime(record.created_at)}
                        </p>
                        <p className="text-sm text-gray-500">
                            Updated: {formatDateTime(record.updated_at)}
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <p className="text-sm text-red-600">Total Shortage</p>
                        <p className="text-2xl font-bold text-red-700">{summary.shortage}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-green-600">Total Surplus</p>
                        <p className="text-2xl font-bold text-green-700">{summary.surplus}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">Total Matching</p>
                        <p className="text-2xl font-bold text-gray-700">{summary.matching}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Items</h2>

                    {!record.items || record.items.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No items found</p>
                    ) : isMobile ? (
                        // Mobile card layout
                        <div className="space-y-4">
                            {record.items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`border border-gray-200 rounded-lg p-4 ${getRowBgColor(item.difference)}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm text-gray-500">#{index + 1}</span>
                                        <span className={`text-sm ${getDifferenceColor(item.difference)}`}>
                                            {item.difference > 0 ? '+' : ''}{item.difference}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-gray-900">
                                        {item.product_variant?.product?.name || 'Unknown Product'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {item.product_variant?.variant_name || 'Unknown Variant'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        SKU: {item.product_variant?.sku || 'N/A'}
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200">
                                        <div>
                                            <p className="text-xs text-gray-500">System (Draft)</p>
                                            <p className="text-sm font-medium text-gray-900">{item.system_stock_draft}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">System (Submit)</p>
                                            <p className="text-sm font-medium text-gray-900">{item.system_stock_submit}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Physical</p>
                                            <p className="text-sm font-medium text-gray-900">{item.physical_stock}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Desktop table layout
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            No
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Product Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Variant Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            SKU
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            System Stock (Draft)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            System Stock (Submit)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Physical Stock
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Difference
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {record.items.map((item, index) => (
                                        <tr key={item.id} className={getRowBgColor(item.difference)}>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {item.product_variant?.product?.name || 'Unknown Product'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {item.product_variant?.variant_name || 'Unknown Variant'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {item.product_variant?.sku || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {item.system_stock_draft}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {item.system_stock_submit}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {item.physical_stock}
                                            </td>
                                            <td className={`px-4 py-3 text-sm text-right ${getDifferenceColor(item.difference)}`}>
                                                {item.difference > 0 ? '+' : ''}{item.difference}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Audit Log Timeline */}
                {record.auditLogs && record.auditLogs.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Audit Log</h2>

                        <div className="space-y-4">
                            {[...record.auditLogs].reverse().map((log, index) => (
                                <div
                                    key={log.id || index}
                                    className="border border-gray-200 rounded-lg overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleLogExpand(log.id || index)}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {log.action}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {log.user?.name || 'System'} • {formatDateTime(log.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        {expandedLog === (log.id || index) ? (
                                            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>

                                    {expandedLog === (log.id || index) && (
                                        <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                                            <div className="grid grid-cols-2 gap-4 mt-3">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                                        Old Values
                                                    </p>
                                                    <p className="text-sm text-gray-700 break-words">
                                                        {formatValues(log.old_values)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                                        New Values
                                                    </p>
                                                    <p className="text-sm text-gray-700 break-words">
                                                        {formatValues(log.new_values)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {record.status === 'draft' && can('stock_opname.view') && (
                    <div className="mt-6">
                        <Link
                            href={route('stock-opname.edit', record.id)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <PencilIcon className="h-5 w-5 mr-2" />
                            Edit Draft
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
