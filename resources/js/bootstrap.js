import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Function to update CSRF token in axios headers
function updateCsrfToken(token) {
    if (token) {
        // Set both headers for maximum compatibility
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        window.axios.defaults.headers.common['X-XSRF-TOKEN'] = token;
        
        // Log for debugging
        console.log('CSRF token updated:', {
            hasToken: !!token,
            tokenLength: token.length,
            headers: {
                'X-CSRF-TOKEN': window.axios.defaults.headers.common['X-CSRF-TOKEN'],
                'X-XSRF-TOKEN': window.axios.defaults.headers.common['X-XSRF-TOKEN'],
            }
        });
    }
}

// Initialize CSRF token from meta tag (fallback for initial page load)
let metaToken = document.head.querySelector('meta[name="csrf-token"]');
if (metaToken) {
    updateCsrfToken(metaToken.content);
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
