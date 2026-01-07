import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

export default function Breadcrumbs({ items }) {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="inline-flex items-center">
                            {index > 0 && (
                                <ChevronRightIcon
                                    className="w-4 h-4 text-gray-400 mx-1"
                                    aria-hidden="true"
                                />
                            )}

                            {isLast ? (
                                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    href={item.href}
                                    className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
