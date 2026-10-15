import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Pagination({
    currentPage,
    totalPages,
    perPage,
    totalItems,
    from,
    to,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
}) {
    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        onPageChange(page);
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Add first page and ellipsis if needed
        if (startPage > 1) {
            pages.push(
                <button
                    key={`page-first`}
                    onClick={() => handlePageChange(1)}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-appbg"
                >
                    1
                </button>
            );

            if (startPage > 2) {
                pages.push(
                    <span key="ellipsis-start" className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                        ...
                    </span>
                );
            }
        }

        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={`page-${i}`}
                    onClick={() => handlePageChange(i)}
                    className={`
                        relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md
                        ${currentPage === i
                            ? 'z-10 bg-brand-50 border-brand-500 text-brand-800'
                            : 'border-slate-300 text-ink bg-white hover:bg-slate-50'
                        }
                    `}
                >
                    {i}
                </button>
            );
        }

        // Add ellipsis and last page if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(
                    <span key="ellipsis-end" className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                        ...
                    </span>
                );
            }

            pages.push(
                <button
                    key={`page-last-${totalPages}`}
                    onClick={() => handlePageChange(totalPages)}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-appbg"
                >
                    {totalPages}
                </button>
            );
        }

        return pages;
    };

    return (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-appbg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-appbg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-700">
                        Showing <span className="font-medium">{from}</span> to{' '}
                        <span className="font-medium">{to}</span> of{' '}
                        <span className="font-medium">{totalItems}</span> results
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <span className="mr-2 text-sm text-slate-700">Show</span>
                        <select
                            value={perPage}
                            onChange={(e) => onPerPageChange(Number(e.target.value))}
                            className="border-slate-300 rounded-md shadow-sm focus:ring-brand focus:border-brand sm:text-sm"
                        >
                            {perPageOptions.map(option => (
                                <option key={`per-page-${option}`} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                        <span className="ml-2 text-sm text-slate-700">per page</span>
                    </div>

                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-appbg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">Previous</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </button>

                            {renderPageNumbers()}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-appbg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">Next</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}
