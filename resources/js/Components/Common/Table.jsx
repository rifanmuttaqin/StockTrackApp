import React from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

export default function Table({
    columns,
    data,
    loading = false,
    sortable = false,
    sortColumn,
    sortDirection,
    onSort,
    actions = [],
    emptyMessage = 'No data available',
    className = '',
    onRowClick = null,
    rowClassName = null,
}) {
    // Validate data is an array
    const tableData = Array.isArray(data) ? data : [];
    const handleSort = (column) => {
        if (!sortable || !column.sortable) return;

        const newDirection =
            sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';

        onSort(column.key, newDirection);
    };

    const getSortIcon = (column) => {
        if (!sortable || !column.sortable) return null;

        if (sortColumn !== column.key) {
            return <ChevronUpDownIcon className="h-4 w-4 text-slate-400" />;
        }

        return sortDirection === 'asc'
            ? <ChevronUpIcon className="h-4 w-4 text-brand-700" />
            : <ChevronDownIcon className="h-4 w-4 text-brand-700" />;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-appbg">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                className={`
                                    px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider
                                    ${sortable && column.sortable ? 'cursor-pointer hover:bg-appbg' : ''}
                                `}
                                onClick={() => handleSort(column)}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>{column.label}</span>
                                    {getSortIcon(column)}
                                </div>
                            </th>
                        ))}
                        {actions.length > 0 && (
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {tableData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                                className="px-6 py-4 text-center text-sm text-slate-500"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        tableData.map((row, rowIndex) => {
                            const rowKey = row.id || `row-${rowIndex}-${Date.now()}`;
                            return (
                                <tr
                                    key={rowKey}
                                    className={`hover:bg-appbg ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName ? rowClassName(row) : ''}`}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                {columns.map((column) => (
                                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                                    </td>
                                ))}
                                {actions.length > 0 && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            {(typeof actions === 'function' ? actions(row) : actions).map((action, actionIndex) => {
                                                const actionKey = action.id || action.key || `action-${actionIndex}-${Date.now()}`;
                                                return (
                                                    <button
                                                        key={actionKey}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            action.onClick(row);
                                                        }}
                                                        className={`
                                                            ${action.className || 'text-brand-700 hover:text-brand-900'}
                                                            ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                                        `}
                                                        disabled={action.disabled}
                                                        title={action.title}
                                                    >
                                                        {action.icon && (
                                                            <action.icon className="h-5 w-5" />
                                                        )}
                                                        {!action.icon && action.label && (
                                                            <span>{action.label}</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
