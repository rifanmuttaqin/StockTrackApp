<?php

namespace App\Notifications;

use App\Models\ProductVariant;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class StockLowNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        private ProductVariant $variant,
        private string $notificationType = 'low_stock'
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'product_variant_id' => $this->variant->id,
            'product_name' => $this->variant->product->name ?? 'Unknown Product',
            'variant_name' => $this->variant->variant_name,
            'stock_current' => $this->variant->stock_current,
            'stock_threshold' => $this->variant->stock_threshold,
            'type' => $this->notificationType,
            'message' => $this->notificationType === 'out_of_stock'
                ? "Stok habis: {$this->variant->variant_name}"
                : "Stok rendah: {$this->variant->variant_name} ({$this->variant->stock_current}/{$this->variant->stock_threshold})",
        ];
    }

    /**
     * Get the notification's database type.
     */
    public function databaseType(object $notifiable): string
    {
        return 'stock_low';
    }
}
