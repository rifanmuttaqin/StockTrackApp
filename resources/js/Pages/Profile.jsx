import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

export default function Profile() {
    // This component will redirect to the new Profile show page
    // Using Inertia.js redirect in the controller is preferred,
    // but this is a fallback component
    return (
        <AppLayout title="Profile">
            <Head title="Profile" />
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                        <p className="mt-2 text-gray-600">Redirecting to your profile...</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
