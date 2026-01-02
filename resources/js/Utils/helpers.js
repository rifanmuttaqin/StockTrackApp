import { STATUS_COLORS } from './constants';

// Format currency to Indonesian Rupiah
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Format date to Indonesian format
export const formatDate = (date, format = 'DD MMMM YYYY') => {
    if (!date) return '-';

    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) return '-';

    const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    };

    return dateObj.toLocaleDateString('id-ID', options);
};

// Format date time to Indonesian format
export const formatDateTime = (date) => {
    if (!date) return '-';

    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) return '-';

    const options = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };

    return dateObj.toLocaleDateString('id-ID', options);
};

// Format number with thousand separator
export const formatNumber = (number) => {
    return new Intl.NumberFormat('id-ID').format(number);
};

// Get status color for UI
export const getStatusColor = (status) => {
    const colorMap = {
        active: STATUS_COLORS.SUCCESS,
        inactive: STATUS_COLORS.WARNING,
        pending: STATUS_COLORS.INFO,
        cancelled: STATUS_COLORS.ERROR,
        completed: STATUS_COLORS.SUCCESS,
        processing: STATUS_COLORS.INFO,
        shipped: STATUS_COLORS.WARNING,
        delivered: STATUS_COLORS.SUCCESS,
        returned: STATUS_COLORS.ERROR,
        out_of_stock: STATUS_COLORS.ERROR,
        discontinued: STATUS_COLORS.WARNING,
    };

    return colorMap[status] || STATUS_COLORS.INFO;
};

// Get status badge classes
export const getStatusBadgeClasses = (status) => {
    const color = getStatusColor(status);
    const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';

    const colorClasses = {
        [STATUS_COLORS.SUCCESS]: 'bg-green-100 text-green-800',
        [STATUS_COLORS.ERROR]: 'bg-red-100 text-red-800',
        [STATUS_COLORS.WARNING]: 'bg-yellow-100 text-yellow-800',
        [STATUS_COLORS.INFO]: 'bg-blue-100 text-blue-800',
    };

    return `${baseClasses} ${colorClasses[color]}`;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';

    if (text.length <= maxLength) return text;

    return text.substring(0, maxLength) + '...';
};

// Generate random string
export const generateRandomString = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
};

// Debounce function
export const debounce = (func, wait) => {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Check if value is empty
export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;

    return false;
};

// Convert object to query string
export const objectToQueryString = (obj) => {
    return Object.keys(obj)
        .filter(key => !isEmpty(obj[key]))
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
};

// Get file extension
export const getFileExtension = (filename) => {
    if (!filename) return '';

    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate email
export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Validate phone number (Indonesian format)
export const isValidPhone = (phone) => {
    const re = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
    return re.test(phone.replace(/[\s-]/g, ''));
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
    if (total === 0) return 0;

    return Math.round((value / total) * 100);
};

// Generate color based on string
export const generateColorFromString = (str) => {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = hash % 360;

    return `hsl(${hue}, 70%, 50%)`;
};

// Sort array of objects by key
export const sortByKey = (array, key, direction = 'asc') => {
    return [...array].sort((a, b) => {
        if (a[key] < b[key]) {
            return direction === 'asc' ? -1 : 1;
        }
        if (a[key] > b[key]) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
};

// Group array of objects by key
export const groupByKey = (array, key) => {
    return array.reduce((result, item) => {
        const group = item[key];

        if (!result[group]) {
            result[group] = [];
        }

        result[group].push(item);

        return result;
    }, {});
};

// Get initial from name
export function getInitials(name, maxLength = 2) {
    if (!name) return '';

    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, maxLength);
}
