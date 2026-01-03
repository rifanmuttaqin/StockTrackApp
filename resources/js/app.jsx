import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './Context';

// Import performance optimizations
import { initializeAssetOptimizations } from './utils/assetOptimization';
import { setupRUM, measureMobilePerformance } from './utils/performanceMonitoring';
import { monitorNetworkStatus } from './utils/networkOptimization';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Initialize performance optimizations
if (typeof window !== 'undefined') {
    // Initialize asset optimizations
    initializeAssetOptimizations();

    // Setup Real User Monitoring
    setupRUM();

    // Monitor network status
    monitorNetworkStatus((status) => {
        console.log(`Network status: ${status}`);
        // You can show/hide offline indicators here
    });

    // Measure mobile performance
    const mobileMetrics = measureMobilePerformance();
    console.log('Mobile Performance Metrics:', mobileMetrics);

    // Preload critical components for mobile
    if (mobileMetrics.device?.userAgent?.includes('Mobile')) {
        import('./utils/lazyLoad').then(({ preloadCriticalComponents }) => {
            preloadCriticalComponents();
        });
    }
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        console.log('Resolving page:', name);
        console.log('Looking for:', `./Pages/${name}.jsx`);

        try {
            const component = resolvePageComponent(
                `./Pages/${name}.jsx`,
                import.meta.glob('./Pages/**/*.jsx'),
            );
            console.log('Successfully resolved:', name);
            return component;
        } catch (error) {
            console.error('Error resolving page:', name);
            console.error('Error details:', error);
            throw error;
        }
    },
    setup({ el, App, props }) {
        // Debug: Log props received by Inertia
        console.log('Inertia App - Props received:', {
            props,
            auth: props?.auth,
            user: props?.auth?.user,
            permissions: props?.auth?.permissions,
            roles: props?.auth?.roles,
            permissionsType: typeof props?.auth?.permissions,
            isArray: Array.isArray(props?.auth?.permissions)
        });

        const root = createRoot(el);

        root.render(
            <AuthProvider pageProps={props}>
                <App {...props} />
            </AuthProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
