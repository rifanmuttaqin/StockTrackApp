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
        // You can show/hide offline indicators here
    });
    
    // Measure mobile performance
    const mobileMetrics = measureMobilePerformance();

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
        return resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        );
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        
        console.log('[app.jsx] Initial props:', props);
        console.log('[app.jsx] props.initialPage:', props.initialPage);
        console.log('[app.jsx] props.initialPage?.props:', props.initialPage?.props);
        console.log('[app.jsx] props.initialPage?.props?.auth:', props.initialPage?.props?.auth);

        root.render(
            <AuthProvider pageProps={props.initialPage?.props || {}}>
                <App {...props} />
            </AuthProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
