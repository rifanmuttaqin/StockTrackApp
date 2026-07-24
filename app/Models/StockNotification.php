<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class StockNotification extends Model
{
    /** @use HasFactory<\Database\Factories\StockNotificationFactory> */
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Boot function for using with StockNotification Events
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
        'product_variant_id',
        'product_name',
        'variant_name',
        'stock_current',
        'stock_threshold',
        'status',
        'type',
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
            'product_variant_id' => 'string',
            'stock_current' => 'integer',
            'stock_threshold' => 'integer',
        ];
    }

    /**
     * Get the product variant that owns the notification.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    /**
     * Scope: only unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->where('status', 'unread');
    }

    /**
     * Scope: recent notifications (last 30 days).
     */
    public function scopeRecent($query)
    {
        return $query->where('created_at', '>=', now()->subDays(30));
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(): bool
    {
        return $this->update(['status' => 'read']);
    }
}
