<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Boot function for using with Product Events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
        });

        static::deleting(function ($product) {
            // Soft delete varian hanya jika bukan force delete
            if (!$product->isForceDeleting()) {
                $product->variants()->delete();
            }
        });

        static::restoring(function ($product) {
            // Restore semua varian yang terkait
            $product->variants()->withTrashed()->restore();
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'sku',
        'description',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'variants_count',
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
        ];
    }

    /**
     * Get variants for the product.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }

    /**
     * Get the count of variants for the product.
     *
     * @return int
     */
    public function getVariantsCountAttribute(): int
    {
        return $this->variants()->count();
    }
}
