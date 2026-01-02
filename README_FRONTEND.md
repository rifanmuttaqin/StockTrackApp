# Frontend Setup Documentation

## Overview

Frontend StockTrackApp dibangun menggunakan React dengan Inertia.js untuk menghubungkan dengan backend Laravel. Setup ini mengikuti best practice untuk aplikasi modern yang responsif dan mudah dikelola.

## Teknologi yang Digunakan

- **React 18.2.0** - Library JavaScript untuk membangun UI
- **Inertia.js 2.3.6** - Bridge antara frontend dan backend
- **Tailwind CSS 4.0.0** - Utility-first CSS framework
- **Headless UI 2.2.0** - Komponen UI tanpa styling
- **Heroicons 2.2.0** - Icon library
- **React Hook Form 7.53.2** - Form handling
- **Vite 7.0.7** - Build tool dan development server

## Struktur Folder

```
resources/js/
├── Components/          # Komponen reusable
│   ├── Navbar.jsx       # Navigasi atas
│   ├── Sidebar.jsx      # Menu samping
│   ├── Pagination.jsx  # Komponen paginasi
│   ├── Table.jsx       # Komponen tabel
│   ├── Modal.jsx       # Komponen modal
│   ├── Alert.jsx       # Komponen notifikasi
│   ├── LoadingSpinner.jsx # Spinner loading
│   └── index.js       # Export semua komponen
├── Context/             # React Context providers
│   ├── AuthContext.js  # Authentication context
│   └── index.js       # Export semua context
├── Hooks/              # Custom hooks
│   ├── usePermission.js # Hook untuk permission checking
│   ├── useForm.js      # Hook untuk form handling
│   ├── usePagination.js # Hook untuk paginasi
│   └── index.js       # Export semua hooks
├── Layouts/            # Layout components
│   ├── AppLayout.jsx   # Layout utama aplikasi
│   ├── AuthLayout.jsx  # Layout untuk halaman auth
│   └── index.js       # Export semua layouts
├── Pages/              # Halaman-halaman aplikasi
│   ├── Welcome.jsx     # Landing page
│   ├── Dashboard.jsx   # Dashboard
│   ├── Profile.jsx     # Profile user
│   ├── Auth/          # Halaman authentication
│   │   ├── Login.jsx  # Halaman login
│   │   └── Register.jsx # Halaman register
│   └── index.js       # Export semua pages
├── Utils/              # Helper functions dan constants
│   ├── constants.js    # Konstanta aplikasi
│   ├── helpers.js      # Helper functions
│   └── index.js       # Export semua utilities
├── app.js             # Entry point aplikasi
└── bootstrap.js       # Bootstrap dependencies
```

## Instalasi

1. Install dependensi NPM:
```bash
npm install
```

2. Build assets untuk production:
```bash
npm run build
```

3. Jalankan development server:
```bash
npm run dev
```

## Fitur Utama

### Authentication System
- Login dan register dengan form validation
- Context provider untuk state management
- Permission-based access control

### UI Components
- Responsive navigation dengan sidebar
- Reusable table dengan sorting
- Modal system
- Alert notifications
- Loading states
- Pagination

### State Management
- React Context untuk authentication
- Custom hooks untuk form handling
- Permission checking system

### Utilities
- Currency formatting
- Date formatting
- Helper functions
- Constants management

## Penggunaan

### Import Components
```javascript
import { Navbar, Sidebar, Table } from '@/Components';
import { useAuth } from '@/Context';
import { useForm, usePagination } from '@/Hooks';
import { formatCurrency, formatDate } from '@/Utils';
```

### Permission Checking
```javascript
const { hasPermission, hasRole } = useAuth();

// Check permission
if (hasPermission('users.view')) {
    // Show user management
}

// Check role
if (hasRole('admin')) {
    // Show admin features
}
```

### Form Handling
```javascript
const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
});

const submit = (e) => {
    e.preventDefault();
    post('/users');
};
```

### Table Component
```javascript
<Table
    columns={[
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email' },
        { key: 'created_at', label: 'Created At', render: (value) => formatDate(value) },
    ]}
    data={users}
    loading={loading}
    sortable={true}
    onSort={handleSort}
    actions={[
        {
            icon: PencilIcon,
            onClick: (user) => editUser(user),
            title: 'Edit User'
        },
        {
            icon: TrashIcon,
            onClick: (user) => deleteUser(user),
            title: 'Delete User'
        }
    ]}
/>
```

## Konfigurasi

### Vite Configuration
Konfigurasi Vite sudah disetup untuk Laravel dengan plugin `laravel-vite-plugin` dan Tailwind CSS.

### Tailwind CSS
Tailwind CSS sudah dikonfigurasi dengan utility classes untuk styling cepat.

### Inertia.js
Inertia.js sudah dikonfigurasi dengan React adapter dan progress indicator.

## Best Practices

1. **Component Structure**: Setiap komponen memiliki file terpisah dengan export yang jelas
2. **State Management**: Gunakan Context untuk global state dan local state untuk component state
3. **Form Handling**: Gunakan useForm hook untuk konsistensi
4. **Permission Checking**: Selalu lakukan permission checking di frontend dan backend
5. **Error Handling**: Implement error boundaries dan error states
6. **Performance**: Gunakan React.memo dan useMemo untuk optimasi

## Troubleshooting

### Common Issues
1. **Permission Denied**: Pastikan user memiliki permission yang cukup
2. **404 Errors**: Check routes dan Inertia middleware setup
3. **CSS Not Loading**: Pastikan Vite dan Tailwind sudah terinstall dengan benar
4. **Build Errors**: Check import paths dan dependencies

### Development Tips
1. Gunakan `npm run dev` untuk development
2. Clear cache Laravel jika ada perubahan besar
3. Check browser console untuk error debugging
4. Gunakan React Developer Tools untuk debugging state

## Next Steps

1. Install semua dependencies dengan `npm install`
2. Setup database dan migrasi
3. Jalankan development server
4. Test authentication flow
5. Implement fitur tambahan sesuai kebutuhan

## Contributing

Pastikan untuk mengikuti coding standards yang sudah ditetapkan:
- Gunakan ESLint dan Prettier untuk code formatting
- Follow React best practices
- Test semua changes sebelum commit
- Document new features and changes
