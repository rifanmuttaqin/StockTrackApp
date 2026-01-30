<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class StockInRecord extends Model
{
    /** @use HasFactory<\Database\Factories\StockInRecordFactory> */
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Boot function for using with StockInRecord Events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
            if (empty($model->transaction_code)) {
                $model->setTransactionCode();
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
        'transaction_code',
        'note',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'items_count',
        'total_quantity',
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
            'note' => 'string',
        ];
    }

    /**
     * Get the items for the stock in record.
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockInItem::class, 'stock_in_record_id');
    }

    /**
     * Check if the stock in record is in draft status.
     *
     * @return bool
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if the stock in record is in submitted status.
     *
     * @return bool
     */
    public function isSubmitted(): bool
    {
        return $this->status === 'submit';
    }

    /**
     * Get the items count for the stock in record.
     *
     * @return int
     */
    public function getItemsCountAttribute(): int
    {
        return $this->items->count();
    }

    /**
     * Get the total quantity for the stock in record.
     *
     * @return int
     */
    public function getTotalQuantityAttribute(): int
    {
        return (int) $this->items->sum('quantity');
    }

    /**
     * Generate a unique transaction code.
     *
     * @return string
     */
    public function generateTransactionCode(): string
    {
        $maxAttempts = 5;
        $attempts = 0;

        while ($attempts < $maxAttempts) {
            // Generate a random 12-digit integer
            $randomNumber = random_int(0, 999999999999);
            // Pad with leading zeros to ensure 12 digits
            $paddedNumber = str_pad($randomNumber, 12, '0', STR_PAD_LEFT);
            // Format as ALBR-{12 digit integer}
            $transactionCode = 'ALBR-' . $paddedNumber;

            // Check if the code is unique
            if (!self::where('transaction_code', $transactionCode)->exists()) {
                return $transactionCode;
            }

            $attempts++;
        }

        // If all attempts fail, use timestamp-based fallback
        $timestamp = microtime(true);
        $fallbackNumber = (int) ($timestamp * 1000000);
        $paddedFallback = str_pad(substr($fallbackNumber, -12), 12, '0', STR_PAD_LEFT);
        return 'ALBR-' . $paddedFallback;
    }

    /**
     * Set the transaction code for the model.
     *
     * @return void
     */
    public function setTransactionCode(): void
    {
        $this->transaction_code = $this->generateTransactionCode();
    }
}
