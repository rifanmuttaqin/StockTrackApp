import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './Context';
import { router } from '@inertiajs/react';

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

        // Update CSRF token from initial page props
        if (props.initialPage?.props?.csrf_token) {
            console.log('[app.jsx] Initial CSRF token from page props:', props.initialPage.props.csrf_token.substring(0, 10) + '...');
            if (window.axios) {
                window.axios.defaults.headers.common['X-CSRF-TOKEN'] = props.initialPage.props.csrf_token;
                window.axios.defaults.headers.common['X-XSRF-TOKEN'] = props.initialPage.props.csrf_token;
            }
        }

        // Listen for successful page visits to update CSRF token
        router.on('success', (event) => {
            console.log('[app.jsx] Page visit successful, checking for CSRF token update...');
            const pageProps = event.detail.page.props;
            
            if (pageProps?.csrf_token && window.axios) {
                const currentToken = window.axios.defaults.headers.common['X-CSRF-TOKEN'];
                const newToken = pageProps.csrf_token;
                
                // Update token if it has changed
                if (newToken !== currentToken) {
                    console.log('[app.jsx] CSRF token updated after page visit:', {
                        oldToken: currentToken ? currentToken.substring(0, 10) + '...' : 'none',
                        newToken: newToken.substring(0, 10) + '...',
                    });
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                    window.axios.defaults.headers.common['X-XSRF-TOKEN'] = newToken;
                }
            }
        });

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
