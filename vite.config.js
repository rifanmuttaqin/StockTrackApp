import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        // Enable source maps for debugging
        sourcemap: process.env.NODE_ENV === 'development',
        // Optimize chunks for better caching
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor dependencies
                    vendor: ['react', 'react-dom'],
                    // Split Inertia.js
                    inertia: ['@inertiajs/react', '@inertiajs/inertia'],
                    // Split UI components
                    ui: ['@headlessui/react', '@heroicons/react', '@radix-ui/react-dialog', '@radix-ui/react-slot'],
                    // Split utilities
                    utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
                },
            },
        },
        // Optimize chunk size warning limit
        chunkSizeWarningLimit: 1000,
    },
    // Optimize dependencies for better bundling
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            '@inertiajs/inertia',
            'clsx',
            'tailwind-merge',
        ],
    },
    // Define global constants for tree shaking
    define: {
        __DEV__: process.env.NODE_ENV === 'development',
    },
});
