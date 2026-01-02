// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/login',
        LOGOUT: '/logout',
        REGISTER: '/register',
        FORGOT_PASSWORD: '/forgot-password',
        RESET_PASSWORD: '/reset-password',
    },
    USERS: {
        INDEX: '/users',
        CREATE: '/users/create',
        STORE: '/users',
        SHOW: '/users/',
        EDIT: '/users/',
        UPDATE: '/users/',
        DELETE: '/users/',
    },
    PRODUCTS: {
        INDEX: '/products',
        CREATE: '/products/create',
        STORE: '/products',
        SHOW: '/products/',
        EDIT: '/products/',
        UPDATE: '/products/',
        DELETE: '/products/',
    },
    CATEGORIES: {
        INDEX: '/categories',
        CREATE: '/categories/create',
        STORE: '/categories',
        SHOW: '/categories/',
        EDIT: '/categories/',
        UPDATE: '/categories/',
        DELETE: '/categories/',
    },
    TRANSACTIONS: {
        SALES: {
            INDEX: '/sales',
            CREATE: '/sales/create',
            STORE: '/sales',
            SHOW: '/sales/',
            EDIT: '/sales/',
            UPDATE: '/sales/',
            DELETE: '/sales/',
        },
        PURCHASES: {
            INDEX: '/purchases',
            CREATE: '/purchases/create',
            STORE: '/purchases',
            SHOW: '/purchases/',
            EDIT: '/purchases/',
            UPDATE: '/purchases/',
            DELETE: '/purchases/',
        },
    },
    REPORTS: {
        SALES: '/reports/sales',
        STOCK: '/reports/stock',
        FINANCIAL: '/reports/financial',
    },
    SETTINGS: {
        GENERAL: '/settings',
        COMPANY: '/settings/company',
        SYSTEM: '/settings/system',
    },
};

// Permission Names
export const PERMISSIONS = {
    // User Management
    USERS_VIEW: 'users.view',
    USERS_CREATE: 'users.create',
    USERS_EDIT: 'users.edit',
    USERS_DELETE: 'users.delete',

    // Role Management
    ROLES_VIEW: 'roles.view',
    ROLES_CREATE: 'roles.create',
    ROLES_EDIT: 'roles.edit',
    ROLES_DELETE: 'roles.delete',

    // Permission Management
    PERMISSIONS_VIEW: 'permissions.view',
    PERMISSIONS_CREATE: 'permissions.create',
    PERMISSIONS_EDIT: 'permissions.edit',
    PERMISSIONS_DELETE: 'permissions.delete',

    // Product Management
    PRODUCTS_VIEW: 'products.view',
    PRODUCTS_CREATE: 'products.create',
    PRODUCTS_EDIT: 'products.edit',
    PRODUCTS_DELETE: 'products.delete',

    // Category Management
    CATEGORIES_VIEW: 'categories.view',
    CATEGORIES_CREATE: 'categories.create',
    CATEGORIES_EDIT: 'categories.edit',
    CATEGORIES_DELETE: 'categories.delete',

    // Sales Management
    SALES_VIEW: 'sales.view',
    SALES_CREATE: 'sales.create',
    SALES_EDIT: 'sales.edit',
    SALES_DELETE: 'sales.delete',

    // Purchase Management
    PURCHASES_VIEW: 'purchases.view',
    PURCHASES_CREATE: 'purchases.create',
    PURCHASES_EDIT: 'purchases.edit',
    PURCHASES_DELETE: 'purchases.delete',

    // Reports
    REPORTS_VIEW: 'reports.view',
    REPORTS_SALES: 'reports.sales',
    REPORTS_STOCK: 'reports.stock',
    REPORTS_FINANCIAL: 'reports.financial',

    // Settings
    SETTINGS_VIEW: 'settings.view',
    SETTINGS_EDIT: 'settings.edit',
};

// Role Names
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    CASHIER: 'cashier',
    WAREHOUSE: 'warehouse',
};

// Transaction Types
export const TRANSACTION_TYPES = {
    SALE: 'sale',
    PURCHASE: 'purchase',
    RETURN: 'return',
    ADJUSTMENT: 'adjustment',
};

// Payment Methods
export const PAYMENT_METHODS = {
    CASH: 'cash',
    TRANSFER: 'transfer',
    CARD: 'card',
    E_WALLET: 'e_wallet',
};

// Product Status
export const PRODUCT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    OUT_OF_STOCK: 'out_of_stock',
    DISCONTINUED: 'discontinued',
};

// Date Formats
export const DATE_FORMATS = {
    DATABASE: 'YYYY-MM-DD',
    DISPLAY: 'DD MMMM YYYY',
    DATETIME: 'DD MMMM YYYY HH:mm',
    TIME: 'HH:mm',
};

// Pagination
export const PAGINATION = {
    DEFAULT_PER_PAGE: 10,
    PER_PAGE_OPTIONS: [10, 25, 50, 100],
};

// Status Colors
export const STATUS_COLORS = {
    SUCCESS: 'green',
    ERROR: 'red',
    WARNING: 'yellow',
    INFO: 'blue',
};
