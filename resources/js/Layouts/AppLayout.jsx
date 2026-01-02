import React from 'react';
import { Head } from '@inertiajs/react';
import { useMobileDetection } from '../Hooks/useMobileDetection';
import MobileLayout from '../Components/Layouts/MobileLayout';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';

export default function AppLayout({ title, children, header }) {
    const { isMobile } = useMobileDetection();

    // If mobile, use MobileLayout
    if (isMobile) {
        return (
            <MobileLayout title={title} header={header}>
                {children}
            </MobileLayout>
        );
    }

    // Desktop layout
    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={title} />

            <div className="flex h-screen">
                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Navbar */}
                    <Navbar />

                    {/* Page Content */}
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                        <div className="container mx-auto">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Sidebar - Now on the right side */}
                <Sidebar />
            </div>
        </div>
    );
}
