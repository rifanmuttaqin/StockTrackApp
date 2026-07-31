<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class StockOpnameRecord extends Model
{
    /** @use HasFactory<\Database\Factories\StockOpnameRecordFactory> */
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    /**
     * Boot function for using with StockOpnameRecord Events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
            if (empty($model->transaction_code)) {
                $model->transaction_code = $model->generateTransactionCode();
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
        'created_by',
        'submitted_by',
        'submitted_at',
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
            'submitted_at' => 'datetime',
        ];
    }

    /**
     * Get the items for the stock opname record.
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class, 'stock_opname_record_id');
    }

    /**
     * Get the audit logs for the stock opname record.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(StockOpnameAuditLog::class, 'stock_opname_record_id');
    }

    /**
     * Get the user who created this record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who submitted this record.
     */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /**
     * Check if the stock opname record is in draft status.
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if the stock opname record is in submitted status.
     */
    public function isSubmitted(): bool
    {
        return $this->status === 'submit';
    }

    /**
     * Generate a unique transaction code with ALBR-OPN prefix.
     */
    public function generateTransactionCode(): string
    {
        $maxAttempts = 5;
        $attempts = 0;

        while ($attempts < $maxAttempts) {
            $randomNumber = random_int(0, 999999999999);
            $paddedNumber = str_pad($randomNumber, 12, '0', STR_PAD_LEFT);
            $transactionCode = 'ALBR-OPN-' . $paddedNumber;

            if (!self::where('transaction_code', $transactionCode)->exists()) {
                return $transactionCode;
            }

            $attempts++;
        }

        $fallbackNumber = (int) (microtime(true) * 1000000);
        $paddedFallback = str_pad(substr($fallbackNumber, -12), 12, '0', STR_PAD_LEFT);
        return 'ALBR-OPN-' . $paddedFallback;
    }
}
