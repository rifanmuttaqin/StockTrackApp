import React from 'react';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    XCircleIcon,
    InformationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

export default function Alert({
    type = 'info',
    title,
    message,
    dismissible = false,
    onDismiss,
    className = '',
}) {
    const typeStyles = {
        success: {
            container: 'bg-green-50 border-green-200 text-green-800',
            icon: CheckCircleIcon,
            iconColor: 'text-green-400',
        },
        error: {
            container: 'bg-red-50 border-red-200 text-red-800',
            icon: XCircleIcon,
            iconColor: 'text-red-400',
        },
        warning: {
            container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            icon: ExclamationCircleIcon,
            iconColor: 'text-yellow-400',
        },
        info: {
            container: 'bg-blue-50 border-blue-200 text-blue-800',
            icon: InformationCircleIcon,
            iconColor: 'text-blue-400',
        },
    };

    const styles = typeStyles[type] || typeStyles.info;
    const Icon = styles.icon;

    return (
        <div className={`rounded-md border p-4 ${styles.container} ${className}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${styles.iconColor}`} aria-hidden="true" />
                </div>
                <div className="ml-3 flex-1">
                    {title && (
                        <h3 className="text-sm font-medium">
                            {title}
                        </h3>
                    )}
                    {message && (
                        <div className={`text-sm ${title ? 'mt-2' : ''}`}>
                            {message}
                        </div>
                    )}
                </div>
                {dismissible && (
                    <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                            <button
                                type="button"
                                onClick={onDismiss}
                                className={`inline-flex rounded-md p-1.5 ${styles.container} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-500`}
                            >
                                <span className="sr-only">Dismiss</span>
                                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
