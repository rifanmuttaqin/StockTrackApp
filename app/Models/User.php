<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Permission\Traits\HasPermissions;
use Illuminate\Support\Str;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, HasPermissions;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['status'];

    /**
     * Boot function for using with User Events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'current_role_id',
        'is_active',
        'suspended',
        'suspension_reason',
        'suspended_at',
        'last_login_at',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'string',
            'current_role_id' => 'string',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'suspended' => 'boolean',
            'suspended_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Get current role associated with user.
     */
    public function currentRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'current_role_id');
    }

    /**
     * Get roles assigned to user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'model_has_roles', 'model_id', 'role_id')
            ->withPivot('model_type');
    }

    /**
     * Get permissions for user.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'model_has_permissions', 'model_id', 'permission_id')
            ->withPivot('model_type');
    }

    /**
     * Check if user is active
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Check if user is suspended
     */
    public function isSuspended(): bool
    {
        return $this->suspended;
    }

    /**
     * Suspend user
     */
    public function suspend(string $reason = null): bool
    {
        $this->suspended = true;
        $this->suspension_reason = $reason;
        $this->suspended_at = now();

        return $this->save();
    }

    /**
     * Unsuspend user
     */
    public function unsuspend(): bool
    {
        $this->suspended = false;
        $this->suspension_reason = null;
        $this->suspended_at = null;

        return $this->save();
    }

    /**
     * Get user status as string
     */
    public function getStatusAttribute(): string
    {
        if ($this->suspended) {
            return 'suspended';
        }

        if ($this->is_active) {
            return 'active';
        }

        return 'inactive';
    }

    /**
     * Get user's full name attribute.
     */
    public function getFullNameAttribute(): string
    {
        return $this->name;
    }
}
