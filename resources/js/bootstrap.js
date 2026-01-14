import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Configure CSRF token for axios
// Laravel uses X-XSRF-TOKEN header by default (reads from encrypted cookie)
// Also support X-CSRF-TOKEN for backward compatibility
let token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    // Set both headers for maximum compatibility
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
    window.axios.defaults.headers.common['X-XSRF-TOKEN'] = token.content;
    
    // Log for debugging
    console.log('CSRF token configured:', {
        hasToken: !!token.content,
        tokenLength: token.content.length,
        headers: {
            'X-CSRF-TOKEN': window.axios.defaults.headers.common['X-CSRF-TOKEN'],
            'X-XSRF-TOKEN': window.axios.defaults.headers.common['X-XSRF-TOKEN'],
        }
    });
} else {
    console.error('CSRF token meta tag not found in document head');
}

// Add request interceptor for debugging
window.axios.interceptors.request.use(
    (config) => {
        console.log('Axios request:', {
            url: config.url,
            method: config.method,
            headers: {
                'X-CSRF-TOKEN': config.headers['X-CSRF-TOKEN'] || config.headers.common['X-CSRF-TOKEN'],
                'X-XSRF-TOKEN': config.headers['X-XSRF-TOKEN'] || config.headers.common['X-XSRF-TOKEN'],
            }
        });
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
