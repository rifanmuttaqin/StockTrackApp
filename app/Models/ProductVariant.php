<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ProductVariant extends Model
{
    /** @use HasFactory<\Database\Factories\ProductVariantFactory> */
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Boot function for using with ProductVariant Events
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
        'product_id',
        'variant_name',
        'sku',
        'stock_current',
        'stock_threshold',
        'unit_id',
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
            'product_id' => 'string',
            'unit_id' => 'string',
            'stock_current' => 'integer',
            'stock_threshold' => 'integer',
        ];
    }

    /**
     * Get the product that owns the variant.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Get the unit for this variant.
     */
    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    /**
     * Get stock notifications for this variant.
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(StockNotification::class, 'product_variant_id');
    }

    /**
     * Check if stock is below threshold.
     */
    public function isBelowThreshold(): bool
    {
        return $this->stock_threshold > 0 && $this->stock_current <= $this->stock_threshold;
    }

    /**
     * Check if stock is out of stock.
     */
    public function isOutOfStock(): bool
    {
        return $this->stock_current <= 0;
    }
}
