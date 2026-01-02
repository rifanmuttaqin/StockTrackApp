import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { PAGINATION } from '../Utils/constants';

// Custom hook for pagination handling
export const usePagination = (initialPage = 1, initialPerPage = PAGINATION.DEFAULT_PER_PAGE) => {
    const [page, setPage] = useState(initialPage);
    const [perPage, setPerPage] = useState(initialPerPage);

    const navigateToPage = useCallback((newPage) => {
        if (newPage < 1) return;

        setPage(newPage);

        // Update URL with new page parameter
        router.get(
            window.location.pathname,
            {
                ...Object.fromEntries(new URLSearchParams(window.location.search)),
                page: newPage,
                per_page: perPage,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    }, [perPage]);

    const changePerPage = useCallback((newPerPage) => {
        setPerPage(newPerPage);
        setPage(1); // Reset to first page when changing per page

        // Update URL with new per_page parameter
        router.get(
            window.location.pathname,
            {
                ...Object.fromEntries(new URLSearchParams(window.location.search)),
                page: 1,
                per_page: newPerPage,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    }, []);

    const resetPagination = useCallback(() => {
        setPage(1);
        setPerPage(PAGINATION.DEFAULT_PER_PAGE);

        // Remove pagination parameters from URL
        const params = new URLSearchParams(window.location.search);
        params.delete('page');
        params.delete('per_page');

        router.get(
            window.location.pathname,
            Object.fromEntries(params),
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    }, []);

    const getPaginationInfo = useCallback((totalItems) => {
        const totalPages = Math.ceil(totalItems / perPage);
        const from = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
        const to = Math.min(page * perPage, totalItems);

        return {
            currentPage: page,
            perPage,
            totalPages,
            totalItems,
            from,
            to,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
    }, [page, perPage]);

    return {
        page,
        perPage,
        setPage,
        setPerPage,
        navigateToPage,
        changePerPage,
        resetPagination,
        getPaginationInfo,
        perPageOptions: PAGINATION.PER_PAGE_OPTIONS,
    };
};
