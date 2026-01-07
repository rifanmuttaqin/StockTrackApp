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
            return <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />;
        }

        return sortDirection === 'asc'
            ? <ChevronUpIcon className="h-4 w-4 text-blue-600" />
            : <ChevronDownIcon className="h-4 w-4 text-blue-600" />;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                className={`
                                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                                    ${sortable && column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
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
                <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                                className="px-6 py-4 text-center text-sm text-gray-500"
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
                                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName ? rowClassName(row) : ''}`}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                {columns.map((column) => (
                                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                                                            ${action.className || 'text-blue-600 hover:text-blue-900'}
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
