<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class WhatsAppSetting extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'whatsapp_settings';

    /**
     * The primary key type.
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * Boot function for UUID generation.
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
        'is_active',
        'api_key',
        'api_url',
        'phone_number_id',
        'message_template',
        'recipients',
        'notify_low_stock',
        'notify_out_of_stock',
        'notify_stock_opname',
        'batch_size',
        'batch_delay',
        'last_sent_at',
        'last_error',
        'send_status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'string',
            'is_active' => 'boolean',
            'api_key' => 'encrypted',
            'message_template' => 'array',
            'recipients' => 'array',
            'notify_low_stock' => 'boolean',
            'notify_out_of_stock' => 'boolean',
            'notify_stock_opname' => 'boolean',
            'batch_size' => 'integer',
            'batch_delay' => 'integer',
            'last_sent_at' => 'datetime',
            'send_status' => 'boolean',
        ];
    }

    /**
     * Get singleton instance or create default.
     */
    public static function getInstance(): self
    {
        return static::firstOrCreate(
            ['id' => static::first()?->id ?? Str::uuid()],
            [
                'is_active' => false,
                'notify_low_stock' => true,
                'notify_out_of_stock' => true,
                'notify_stock_opname' => true,
                'batch_size' => 10,
                'batch_delay' => 1,
                'send_status' => false,
            ]
        );
    }

    /**
     * Check if WhatsApp is configured and active.
     */
    public function isActiveAndConfigured(): bool
    {
        return $this->is_active
            && !empty($this->api_key)
            && !empty($this->api_url)
            && !empty($this->phone_number_id);
    }

    /**
     * Get formatted recipients as collection of User models.
     */
    public function getRecipientUsers(): \Illuminate\Support\Collection
    {
        if (empty($this->recipients)) {
            return collect();
        }

        return User::whereIn('id', $this->recipients)
            ->where('is_active', true)
            ->get();
    }

    /**
     * Get masked API key (show last 4 characters).
     */
    public function getMaskedApiKey(): ?string
    {
        if (empty($this->api_key)) {
            return null;
        }

        $key = $this->api_key;
        $len = strlen($key);

        if ($len <= 4) {
            return str_repeat('*', $len);
        }

        return str_repeat('*', $len - 4) . substr($key, -4);
    }

    /**
     * Get default message template.
     */
    public static function getDefaultTemplate(): array
    {
        return [
            'low_stock' => [
                'subject' => '⚠️ Peringatan Stok Rendah - StockTrackApp',
                'body' => "Produk berikut memiliki stok di bawah threshold:\n\n• {product_name} - {variant_name}\n  Stok: {stock_current} / Threshold: {stock_threshold}\n  Status: Rendah\n\n---\nWaktu: {timestamp}",
            ],
            'out_of_stock' => [
                'subject' => '🚨 Stok Habis - StockTrackApp',
                'body' => "Produk berikut telah habis:\n\n• {product_name} - {variant_name}\n  Stok: {stock_current} / Threshold: {stock_threshold}\n  Status: Habis\n\n---\nWaktu: {timestamp}",
            ],
            'test' => [
                'subject' => '✅ Test Notifikasi - StockTrackApp',
                'body' => "Koneksi WhatsApp berhasil!\nPesan ini dikirim dari sistem StockTrackApp.\n\nWaktu: {timestamp}",
            ],
            'stock_opname' => [
                'subject' => '📋 Stock Opname Disubmit - StockTrackApp',
                'opening' => 'Halo, berikut adalah hasil stock opname yang telah disubmit:',
                'closing' => 'Terima kasih.',
                'body' => "{opening}\n\n📋 *Detail Stock Opname*\nKode: {transaction_code}\nTanggal: {date}\nDisubmit oleh: {submitted_by}\n\n📦 *Item Opname:*\n{items_detail}\nTotal Item: {total_items}\nTotal Selisih: {total_difference}\n\n{closing}\n\n---\nWaktu: {timestamp}",
            ],
        ];
    }
}