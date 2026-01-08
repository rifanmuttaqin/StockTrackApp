<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class StockOutRecord extends Model
{
    /** @use HasFactory<\Database\Factories\StockOutRecordFactory> */
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Boot function for using with StockOutRecord Events
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
        'date',
        'status',
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
            'date' => 'date',
            'status' => 'string',
        ];
    }

    /**
     * Get the items for the stock out record.
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockOutItem::class, 'stock_out_record_id');
    }

    /**
     * Check if the stock out record is in draft status.
     *
     * @return bool
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if the stock out record is in submitted status.
     *
     * @return bool
     */
    public function isSubmitted(): bool
    {
        return $this->status === 'submit';
    }
}
