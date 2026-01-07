import React from 'react';
import { Head } from '@inertiajs/react';
import { useMobileDetection } from '../Hooks/useMobileDetection';
import MobileLayout from '../Components/Layouts/MobileLayout';
import { Navbar, Sidebar } from '../Components/Layouts';
import { Breadcrumbs } from '../Components/Navigation';

export default function AppLayout({ title, children, header, breadcrumbs }) {
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
        <div className="h-screen bg-gray-50 overflow-hidden">
            <Head title={title} />

            <div className="flex h-full">
                {/* Sidebar - Fixed position with proper overflow handling */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Navbar */}
                    <Navbar />

                    {/* Page Content - Scrollable area */}
                    <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 custom-scrollbar">
                        <div className="p-6">
                            <div className="container mx-auto max-w-7xl">
                                {/* Breadcrumbs - Only show on desktop */}
                                {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
