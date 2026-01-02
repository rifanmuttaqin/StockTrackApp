import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import ActivityLogTable from '@/Components/Tables/ActivityLogTable';

export default function ActivityLog({ activities }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-poppins font-semibold leading-tight text-gray-800">
                    Activity Log
                </h2>
            }
        >
            <Head title="Activity Log" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-poppins font-medium text-gray-900 mb-2">
                                System Activity Log
                            </h3>
                            <p className="text-sm font-poppins text-gray-600">
                                View recent system activities and audit logs.
                            </p>
                        </div>

                        <ActivityLogTable activities={activities} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
