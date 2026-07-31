<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class StockOpnameItem extends Model
{
    /** @use HasFactory<\Database\Factories\StockOpnameItemFactory> */
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Boot function for using with StockOpnameItem Events
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
        'stock_opname_record_id',
        'product_variant_id',
        'system_stock_draft',
        'system_stock_submit',
        'physical_stock',
        'difference',
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
            'system_stock_draft' => 'integer',
            'system_stock_submit' => 'integer',
            'physical_stock' => 'integer',
            'difference' => 'integer',
        ];
    }

    /**
     * Get the record that owns this item.
     */
    public function record(): BelongsTo
    {
        return $this->belongsTo(StockOpnameRecord::class, 'stock_opname_record_id');
    }

    /**
     * Get the product variant for this item.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
