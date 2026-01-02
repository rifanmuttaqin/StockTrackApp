# Dokumentasi Arsitektur StockTrackApp

## Ringkasan

StockTrackApp adalah aplikasi manajemen stok yang dibangun dengan arsitektur **Laravel + React** menggunakan **Inertia.js** sebagai penghubung antara backend dan frontend. Aplikasi ini menerapkan pola **Repository Pattern** dan **Service Pattern** untuk mengelola bisnis logic, serta sistem **Role-Based Access Control (RBAC)** yang komprehensif menggunakan package Spatie Laravel Permission.

## 1. Struktur MVC yang Digunakan

### Backend (Laravel)

#### Model
- **Location**: `app/Models/`
- **Key Models**:
  - `User.php`: Model user dengan UUID primary key, relasi ke roles dan permissions
  - `Role.php`: Extends Spatie Role dengan UUID support
  - `Permission.php`: Extends Spatie Permission dengan UUID support

#### View
- **Location**: `resources/views/`
- **Key Files**:
  - `app.blade.php`: Template utama untuk Inertia.js
- **Pattern**: Menggunakan Inertia.js untuk rendering React components sebagai "views"

#### Controller
- **Location**: `app/Http/Controllers/`
- **Structure**: Organized by feature (Auth, User, Dashboard, Profile)
- **Pattern**: Controllers thin, business logic dipindah ke Services

### Frontend (React)

#### Pages
- **Location**: `resources/js/Pages/`
- **Structure**: Organized by feature (Auth, Users, Dashboard, Profile)
- **Pattern**: Setiap page adalah React component yang menerima props dari backend

#### Components
- **Location**: `resources/js/Components/`
- **Structure**: Organized by type (UI, Forms, Tables, Navigation)
- **Pattern**: Reusable components dengan mobile-first design

## 2. Pola Repository dan Service Pattern

### Repository Pattern
```php
// Interface
app/Repositories/Contracts/UserRepositoryInterface.php

// Implementation
app/Repositories/User/UserRepository.php
```

**Karakteristik**:
- Abstraksi akses data dari business logic
- Menggunakan interface untuk dependency injection
- Handle pagination, searching, dan CRUD operations
- Transaction management untuk data consistency

### Service Pattern
```php
// Interface
app/Services/Contracts/UserServiceInterface.php

// Implementation
app/Services/User/UserService.php
```

**Karakteristik**:
- Business logic terpusat
- Validation dan business rules
- Koordinasi antar repositories
- Error handling yang konsisten

### Service Provider
```php
app/Providers/RepositoryServiceProvider.php
```
Mendaftarkan binding interfaces ke implementations melalui Laravel's IoC Container.

## 3. Sistem Autentikasi dan Autorisasi

### Autentikasi
- **Package**: Laravel Breeze + Inertia.js
- **Features**: 
  - Email verification
  - Password reset
  - Remember me functionality
  - Session management

### Role-Based Access Control (RBAC)
- **Package**: Spatie Laravel Permission
- **Implementation**:
  - Custom middleware untuk permission dan role checking
  - UUID-based primary keys untuk semua entities
  - Hierarchical permission system

#### Role Structure
1. **inventory_staff**: Akses dasar untuk input data
2. **warehouse_supervisor**: Akses penuh ke manajemen data dan user
3. **management**: Akses view-only ke laporan dan dashboard

#### Permission Structure
- Granular permissions (users.index, users.create, users.edit, dll)
- Role-based permission assignment
- Direct permission assignment to users

### Middleware Kustom
```php
app/Http/Middleware/PermissionMiddleware.php
app/Http/Middleware/RoleMiddleware.php
```

## 4. Struktur Routing

### Backend Routes
- **Main routes**: `routes/web.php`
- **Auth routes**: `routes/auth.php`
- **Feature routes**: `routes/user/users.php`

### Pattern
- Resource-based routing
- Middleware grouping untuk permission checks
- Route model binding dengan UUID

### Frontend Routing
- **Library**: React Router DOM
- **Pattern**: Client-side routing dengan Inertia.js
- **Lazy loading**: Dynamic imports untuk performance

## 5. Pola Frontend (React)

### Component Architecture
```
resources/js/Components/
├── UI/           # Basic UI components (Button, Input, Card)
├── Forms/        # Form components (UserForm, PasswordForm)
├── Tables/       # Table components (UserTable, ActivityLogTable)
├── Layouts/      # Layout components (AppLayout, AuthLayout)
├── Navigation/   # Navigation components (Navbar, Sidebar)
├── Modals/       # Modal components (RoleAssignmentModal)
└── Users/        # User-specific components (MobileUserList)
```

### Hooks Kustom
```javascript
resources/js/Hooks/
├── usePermission.js    # Permission checking
├── useForm.js          # Form state management
├── useMobileDetection.js # Mobile device detection
└── usePagination.js    # Pagination logic
```

### Context API
```javascript
resources/js/Context/AuthContext.jsx
```
Global state management untuk authentication, permissions, dan user data.

### Mobile-First Design
- Responsive components dengan conditional rendering
- Mobile-specific UI components
- Performance optimization untuk mobile devices

## 6. Struktur Database untuk User Management

### Tabel Utama
1. **users**: Tabel user dengan UUID primary key
2. **roles**: Tabel roles dengan UUID primary key
3. **permissions**: Tabel permissions dengan UUID primary key
4. **model_has_roles**: Pivot table untuk user-role relationships
5. **model_has_permissions**: Pivot table untuk user-permission relationships
6. **role_has_permissions**: Pivot table untuk role-permission relationships

### Tabel Tambahan
- **audit_logs**: Log aktivitas user
- **user_sessions**: Sesi management
- **app_configurations**: Konfigurasi aplikasi

## Best Practice untuk Menambah Fitur Baru

### 1. Backend Development

#### Step 1: Buat Migration
```bash
php artisan make:migration create_feature_table
```

#### Step 2: Buat Model
```php
// app/Models/Feature.php
class Feature extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    // ...
}
```

#### Step 3: Buat Repository
```php
// app/Repositories/Contracts/FeatureRepositoryInterface.php
// app/Repositories/Feature/FeatureRepository.php
```

#### Step 4: Buat Service
```php
// app/Services/Contracts/FeatureServiceInterface.php
// app/Services/Feature/FeatureService.php
```

#### Step 5: Register di Service Provider
```php
// app/Providers/RepositoryServiceProvider.php
$this->app->bind(FeatureRepositoryInterface::class, FeatureRepository::class);
$this->app->bind(FeatureServiceInterface::class, FeatureService::class);
```

#### Step 6: Buat Controller
```php
// app/Http/Controllers/Feature/FeatureController.php
```

#### Step 7: Buat Routes
```php
// routes/feature/feature.php
```

### 2. Frontend Development

#### Step 1: Buat Page Component
```javascript
// resources/js/Pages/Feature/Index.jsx
```

#### Step 2: Buat Reusable Components
```javascript
// resources/js/Components/Feature/FeatureList.jsx
// resources/js/Components/Feature/FeatureForm.jsx
```

#### Step 3: Buat Custom Hooks (jika needed)
```javascript
// resources/js/Hooks/useFeature.js
```

### 3. Permission Management

#### Step 1: Tambah Permissions di Seeder
```php
// database/seeders/RoleSeeder.php
'feature.view' => ['display_name' => 'View Feature', 'description' => '...'],
'feature.create' => ['display_name' => 'Create Feature', 'description' => '...'],
// ...
```

#### Step 2: Apply Middleware di Controller
```php
// app/Http/Controllers/Feature/FeatureController.php
$this->middleware('permission:feature.view')->only(['index', 'show']);
$this->middleware('permission:feature.create')->only(['create', 'store']);
// ...
```

#### Step 3: Gunakan Permission Check di Frontend
```javascript
// resources/js/Pages/Feature/Index.jsx
const { can } = usePermission();

{can('feature.create') && (
    <Link href={route('feature.create')}>
        <button>Add Feature</button>
    </Link>
)}
```

## Konvensi Penamaan dan Struktur File

### Backend
- **Controllers**: `FeatureController.php` di `app/Http/Controllers/Feature/`
- **Models**: `Feature.php` di `app/Models/`
- **Repositories**: `FeatureRepository.php` di `app/Repositories/Feature/`
- **Services**: `FeatureService.php` di `app/Services/Feature/`
- **Requests**: `FeatureCreateRequest.php` di `app/Http/Requests/Feature/`
- **Routes**: `feature.php` di `routes/feature/`

### Frontend
- **Pages**: `Index.jsx` di `resources/js/Pages/Feature/`
- **Components**: `FeatureList.jsx` di `resources/js/Components/Feature/`
- **Hooks**: `useFeature.js` di `resources/js/Hooks/`

### Naming Conventions
- **Files**: PascalCase untuk classes/components, camelCase untuk functions
- **Routes**: kebab-case (feature-management)
- **Permissions**: dot notation (feature.view, feature.create)
- **Database Tables**: snake_case
- **Database Columns**: snake_case

## Implementasi Role-Based Access Control

### 1. Backend Implementation

#### Middleware Registration
```php
// app/Http/Kernel.php
'permission' => \App\Http\Middleware\PermissionMiddleware::class,
'role' => \App\Http\Middleware\RoleMiddleware::class,
```

#### Usage in Routes
```php
Route::middleware(['auth', 'permission:users.index'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
```

#### Usage in Controllers
```php
public function __construct(UserServiceInterface $userService)
{
    $this->userService = $userService;
    $this->middleware('permission:users.index')->only(['index']);
    $this->middleware('permission:users.create')->only(['create', 'store']);
}
```

### 2. Frontend Implementation

#### Permission Hook
```javascript
// resources/js/Hooks/usePermission.js
export const usePermission = () => {
    const { hasPermission, hasRole } = useAuth();
    return { hasPermission, hasRole };
};
```

#### Usage in Components
```javascript
const { can } = usePermission();

{can('users.create') && (
    <button onClick={() => setShowCreateModal(true)}>
        Add User
    </button>
)}
```

#### Auth Context
```javascript
// resources/js/Context/AuthContext.jsx
export const AuthProvider = ({ children, pageProps }) => {
    const [permissions, setPermissions] = useState(pageProps?.auth?.permissions || []);
    
    const hasPermission = (permission) => {
        return permissions.includes(permission);
    };
    
    // ...
};
```

### 3. Database Seeding

#### Role and Permission Seeding
```php
// database/seeders/RoleSeeder.php
private function getPermissionsForRole(string $roleName): array
{
    return match ($roleName) {
        'warehouse_supervisor' => [
            ['name' => 'manage_users', 'display_name' => 'Manage Users'],
            // ...
        ],
        // ...
    };
}
```

## Performance Optimizations

### Backend
- Repository pattern untuk query optimization
- Eager loading untuk relationships
- Database transactions untuk data consistency
- UUID indexing untuk performance

### Frontend
- Lazy loading untuk components
- Mobile-first responsive design
- Performance monitoring
- Asset optimization
- Network status monitoring

## Security Considerations

1. **Input Validation**: Request classes untuk semua input
2. **Authorization**: Middleware-based permission checking
3. **CSRF Protection**: Laravel's built-in CSRF protection
4. **Password Security**: Hashed passwords dengan bcrypt
5. **Session Management**: Secure session configuration
6. **Email Verification**: Email verification untuk new users

## Testing Strategy

1. **Unit Tests**: Repository dan Service layer
2. **Feature Tests**: Controller dan API endpoints
3. **Browser Tests**: Critical user journeys
4. **Permission Tests**: RBAC functionality

## Deployment Considerations

1. **Environment Configuration**: Proper environment setup
2. **Database Migrations**: Sequential migration execution
3. **Asset Compilation**: Vite build process
4. **Caching**: Application and route caching
5. **Queue Setup**: For background jobs

## Conclusion

StockTrackApp mengimplementasikan arsitektur yang modern dan scalable dengan:
- Clean architecture dengan separation of concerns
- Role-based access control yang komprehensif
- Mobile-first responsive design
- Performance optimizations
- Security best practices

Arsitektur ini memudahkan pengembangan fitur baru sambil menjaga konsistensi dan maintainability codebase.
