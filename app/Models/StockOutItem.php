<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class StockOutItem extends Model
{
    /** @use HasFactory<\Database\Factories\StockOutItemFactory> */
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Boot function for using with StockOutItem Events
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
        'stock_out_record_id',
        'product_variant_id',
        'quantity',
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
            'stock_out_record_id' => 'string',
            'product_variant_id' => 'string',
            'quantity' => 'integer',
        ];
    }

    /**
     * Get the stock out record that owns the item.
     */
    public function stockOutRecord(): BelongsTo
    {
        return $this->belongsTo(StockOutRecord::class, 'stock_out_record_id');
    }

    /**
     * Get the product variant that owns the item.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    /**
     * Get the variant name from the related product variant.
     *
     * @return string|null
     */
    public function getVariantNameAttribute(): ?string
    {
        return $this->productVariant?->variant_name;
    }
}
