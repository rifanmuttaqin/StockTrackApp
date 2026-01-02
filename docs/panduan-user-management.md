# Panduan Implementasi User Management di StockTrackApp

## Overview

Dokumen ini memberikan panduan lengkap untuk implementasi fitur user management di StockTrackApp, mengikuti arsitektur dan best practice yang sudah ada.

## Struktur User Management yang Sudah Ada

### 1. Model Structure

#### User Model (`app/Models/User.php`)
- Menggunakan UUID sebagai primary key
- Memiliki relasi ke roles dan permissions
- Implementasi trait HasRoles dari Spatie
- Fields: name, email, password, current_role_id, is_active, last_login_at

#### Role Model (`app/Models/Role.php`)
- Extends Spatie Role dengan UUID support
- Auto-generate UUID pada creating

#### Permission Model (`app/Models/Permission.php`)
- Extends Spatie Permission dengan UUID support
- Auto-generate UUID pada creating

### 2. Repository Pattern

#### UserRepositoryInterface (`app/Repositories/Contracts/UserRepositoryInterface.php`)
```php
interface UserRepositoryInterface
{
    public function getAll(int $perPage = 15): LengthAwarePaginator;
    public function findById(string $id): ?User;
    public function findByEmail(string $email): ?User;
    public function create(array $data): User;
    public function update(string $id, array $data): bool;
    public function delete(string $id): bool;
    public function updateLastLogin(string $id): bool;
    public function getByRole(string $roleId): Collection;
    public function search(string $query, int $perPage = 15): LengthAwarePaginator;
}
```

#### UserRepository Implementation (`app/Repositories/User/UserRepository.php`)
- Handle semua operasi database
- Transaction management untuk data consistency
- Eager loading relationships (roles)
- Password hashing otomatis
- Role assignment pada create/update

### 3. Service Layer

#### UserServiceInterface (`app/Services/Contracts/UserServiceInterface.php`)
```php
interface UserServiceInterface
{
    public function getAllUsers(int $perPage = 15): LengthAwarePaginator;
    public function findUserById(string $id): ?User;
    public function findUserByEmail(string $email): ?User;
    public function createUser(UserCreateRequest $request): User;
    public function registerUser(UserRegistrationRequest $request): User;
    public function updateUser(string $id, UserUpdateRequest $request): bool;
    public function deleteUser(string $id): bool;
    public function updateProfile(string $id, UserProfileUpdateRequest $request): bool;
    public function changePassword(string $id, UserChangePasswordRequest $request): bool;
    public function updateLastLogin(string $id): bool;
    public function toggleActiveStatus(string $id): bool;
    public function assignRole(string $userId, string $roleId): bool;
    public function removeRole(string $userId, string $roleId): bool;
    public function searchUsers(string $query, int $perPage = 15): LengthAwarePaginator;
}
```

#### UserService Implementation (`app/Services/User/UserService.php`)
- Business logic terpusat
- Validation coordination
- Error handling
- Password validation untuk change password
- Role management

### 4. Controller Layer

#### UserController (`app/Http/Controllers/User/UserController.php`)
- Dependency injection untuk UserService
- Permission-based middleware untuk setiap method
- Inertia response rendering
- Proper error handling dan redirects

### 5. Request Validation

#### UserCreateRequest (`app/Http/Requests/User/UserCreateRequest.php`)
#### UserUpdateRequest (`app/Http/Requests/User/UserUpdateRequest.php`)
#### UserProfileUpdateRequest (`app/Http/Requests/User/UserProfileUpdateRequest.php`)
#### UserChangePasswordRequest (`app/Http/Requests/User/UserChangePasswordRequest.php`)

### 6. Frontend Components

#### Pages (`resources/js/Pages/Users/`)
- `Index.jsx`: User listing dengan filtering dan pagination
- `Create.jsx`: User creation form
- `Edit.jsx`: User editing form
- `Show.jsx`: User detail view

#### Components (`resources/js/Components/Users/`)
- `MobileUserList.jsx`: Mobile-optimized user list
- `MobileUserCard.jsx`: Mobile user card component
- `MobileUserTable.jsx`: Mobile user table
- `MobileUserForm.jsx`: Mobile user form

#### Tables (`resources/js/Components/Tables/`)
- `UserTable.jsx`: Desktop user table dengan sorting dan filtering

#### Forms (`resources/js/Components/Forms/`)
- `UserForm.jsx`: Reusable user form component
- `AvatarUpload.jsx`: Avatar upload component

## Cara Menambah Fitur User Management Baru

### 1. Backend Implementation

#### Step 1: Buat Request Validation
```php
// app/Http/Requests/User/UserBulkActionRequest.php
class UserBulkActionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|string|exists:users,id',
            'action' => 'required|string|in:activate,deactivate,delete,assign_role',
            'role_id' => 'required_if:action,assign_role|string|exists:roles,id',
        ];
    }
}
```

#### Step 2: Tambah Method di Repository Interface
```php
// app/Repositories/Contracts/UserRepositoryInterface.php
public function bulkUpdateStatus(array $userIds, bool $isActive): bool;
public function bulkDelete(array $userIds): bool;
public function bulkAssignRole(array $userIds, string $roleId): bool;
```

#### Step 3: Implement di Repository
```php
// app/Repositories/User/UserRepository.php
public function bulkUpdateStatus(array $userIds, bool $isActive): bool
{
    DB::beginTransaction();
    
    try {
        User::whereIn('id', $userIds)->update(['is_active' => $isActive]);
        DB::commit();
        return true;
    } catch (\Exception $e) {
        DB::rollBack();
        throw $e;
    }
}
```

#### Step 4: Tambah Method di Service Interface
```php
// app/Services/Contracts/UserServiceInterface.php
public function bulkUpdateStatus(array $userIds, bool $isActive): bool;
public function bulkDelete(array $userIds): bool;
public function bulkAssignRole(array $userIds, string $roleId): bool;
```

#### Step 5: Implement di Service
```php
// app/Services/User/UserService.php
public function bulkUpdateStatus(array $userIds, bool $isActive): bool
{
    // Prevent deactivating self
    if (in_array(Auth::id(), $userIds) && !$isActive) {
        throw new \Exception('Cannot deactivate your own account');
    }
    
    return $this->userRepository->bulkUpdateStatus($userIds, $isActive);
}
```

#### Step 6: Tambah Controller Methods
```php
// app/Http/Controllers/User/UserController.php
public function bulkAction(UserBulkActionRequest $request)
{
    $action = $request->action;
    $userIds = $request->user_ids;
    
    match ($action) {
        'activate' => $this->userService->bulkUpdateStatus($userIds, true),
        'deactivate' => $this->userService->bulkUpdateStatus($userIds, false),
        'delete' => $this->userService->bulkDelete($userIds),
        'assign_role' => $this->userService->bulkAssignRole($userIds, $request->role_id),
        default => throw new \Exception('Invalid action'),
    };
    
    return redirect()->back()->with('success', 'Bulk action completed successfully');
}
```

#### Step 7: Tambah Routes
```php
// routes/user/users.php
Route::post('/users/bulk-action', [UserController::class, 'bulkAction'])
    ->name('users.bulk-action')
    ->middleware('permission:users.bulk-action');
```

### 2. Frontend Implementation

#### Step 1: Buat Custom Hook
```javascript
// resources/js/Hooks/useBulkActions.js
import { router } from '@inertiajs/react';

export const useBulkActions = () => {
    const bulkAction = (userIds, action, roleId = null) => {
        router.post(
            route('users.bulk-action'),
            {
                user_ids: userIds,
                action,
                role_id: roleId,
            },
            {
                onSuccess: () => {
                    // Refresh data
                    router.reload({ only: ['users'] });
                },
                onError: (errors) => {
                    console.error('Bulk action failed:', errors);
                },
            }
        );
    };
    
    return { bulkAction };
};
```

#### Step 2: Buat Component
```javascript
// resources/js/Components/Users/BulkActions.jsx
import React, { useState } from 'react';
import { useBulkActions } from '../../Hooks/useBulkActions';
import { usePermission } from '../../Hooks/usePermission';

const BulkActions = ({ selectedUsers, onClearSelection }) => {
    const { bulkAction } = useBulkActions();
    const { can } = usePermission();
    const [action, setAction] = useState('');
    const [roleId, setRoleId] = useState('');
    
    const handleBulkAction = () => {
        if (!action) return;
        
        bulkAction(selectedUsers, action, roleId);
        onClearSelection();
        setAction('');
        setRoleId('');
    };
    
    return (
        <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">
                {selectedUsers.length} users selected
            </span>
            
            {can('users.bulk-action') && (
                <>
                    <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="rounded border-gray-300 text-sm"
                    >
                        <option value="">Select action</option>
                        <option value="activate">Activate</option>
                        <option value="deactivate">Deactivate</option>
                        <option value="delete">Delete</option>
                        <option value="assign_role">Assign Role</option>
                    </select>
                    
                    {action === 'assign_role' && (
                        <select
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            className="rounded border-gray-300 text-sm"
                        >
                            <option value="">Select role</option>
                            {/* Role options */}
                        </select>
                    )}
                    
                    <button
                        onClick={handleBulkAction}
                        disabled={!action || (action === 'assign_role' && !roleId)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:bg-gray-300"
                    >
                        Execute
                    </button>
                </>
            )}
            
            <button
                onClick={onClearSelection}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
                Clear
            </button>
        </div>
    );
};

export default BulkActions;
```

#### Step 3: Integrate di Page Component
```javascript
// resources/js/Pages/Users/Index.jsx
import BulkActions from '../../Components/Users/BulkActions';

const Index = ({ users, roles, filters }) => {
    const [selectedUsers, setSelectedUsers] = useState([]);
    
    const handleUserSelection = (userId, selected) => {
        if (selected) {
            setSelectedUsers([...selectedUsers, userId]);
        } else {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        }
    };
    
    const handleClearSelection = () => {
        setSelectedUsers([]);
    };
    
    return (
        <AppLayout title="User Management">
            {/* ... existing code ... */}
            
            {selectedUsers.length > 0 && (
                <BulkActions
                    selectedUsers={selectedUsers}
                    onClearSelection={handleClearSelection}
                />
            )}
            
            {/* ... existing code ... */}
        </AppLayout>
    );
};
```

## Best Practices untuk User Management

### 1. Security
- Selalu validasi input di backend
- Gunakan middleware untuk permission checking
- Hash passwords dengan bcrypt
- Implement rate limiting untuk sensitive operations
- Log semua user management activities

### 2. Performance
- Gunakan pagination untuk large datasets
- Implement eager loading untuk relationships
- Cache frequently accessed data
- Optimize queries dengan proper indexing

### 3. User Experience
- Provide clear feedback untuk semua actions
- Implement confirmation dialogs untuk destructive actions
- Use loading states untuk async operations
- Mobile-first responsive design

### 4. Data Integrity
- Gunakan database transactions
- Implement proper foreign key constraints
- Validate data relationships
- Handle edge cases appropriately

## Testing Strategy

### 1. Unit Tests
```php
// tests/Unit/UserRepositoryTest.php
class UserRepositoryTest extends TestCase
{
    public function test_can_create_user()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
        ];
        
        $user = $this->userRepository->create($userData);
        
        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('Test User', $user->name);
        $this->assertEquals('test@example.com', $user->email);
    }
}
```

### 2. Feature Tests
```php
// tests/Feature/UserManagementTest.php
class UserManagementTest extends TestCase
{
    public function test_can_create_user_with_permission()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('users.create');
        
        $response = $this->actingAs($user)
            ->post(route('users.store'), [
                'name' => 'New User',
                'email' => 'newuser@example.com',
                'password' => 'password',
                'password_confirmation' => 'password',
            ]);
        
        $response->assertRedirect(route('users.index'));
        $this->assertDatabaseHas('users', ['email' => 'newuser@example.com']);
    }
}
```

### 3. Browser Tests
```php
// tests/Browser/UserManagementTest.php
class UserManagementTest extends DuskTestCase
{
    public function test_can_create_user_via_ui()
    {
        $this->browse(function (Browser $browser) {
            $browser->loginAs(User::factory()->create())
                ->visit(route('users.create'))
                ->type('name', 'Test User')
                ->type('email', 'test@example.com')
                ->type('password', 'password')
                ->type('password_confirmation', 'password')
                ->click('button[type="submit"]')
                ->assertRouteIs('users.index')
                ->assertSee('User created successfully');
        });
    }
}
```

## Monitoring dan Logging

### 1. Audit Trail
```php
// app/Observers/UserObserver.php
class UserObserver
{
    public function created(User $user)
    {
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'created',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'description' => "Created user: {$user->name}",
        ]);
    }
}
```

### 2. Performance Monitoring
```javascript
// resources/js/utils/performanceMonitoring.js
export const trackUserAction = (action, userId) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'user_action', {
            action_name: action,
            user_id: userId,
            timestamp: Date.now(),
        });
    }
};
```

## Deployment Considerations

### 1. Database Migration
```php
// database/migrations/update_users_table_for_new_features.php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('phone')->nullable();
        $table->date('birth_date')->nullable();
        $table->text('address')->nullable();
        $table->json('preferences')->nullable();
    });
}
```

### 2. Cache Management
```php
// app/Services/User/UserService.php
public function getAllUsers(int $perPage = 15): LengthAwarePaginator
{
    return Cache::remember("users.page.{$perPage}", 300, function () use ($perPage) {
        return $this->userRepository->getAll($perPage);
    });
}
```

## Conclusion

Implementasi user management di StockTrackApp mengikuti arsitektur yang konsisten dengan:
- Separation of concerns melalui Repository dan Service pattern
- Role-based access control yang komprehensif
- Mobile-first responsive design
- Proper validation dan error handling
- Performance optimizations
- Security best practices

Dengan mengikuti panduan ini, pengembangan fitur user management baru dapat dilakukan secara konsisten dan maintainable.
