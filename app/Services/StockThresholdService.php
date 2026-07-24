<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\StockNotification;
use App\Models\User;
use App\Notifications\StockLowNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class StockThresholdService
{
    /**
     * Check all variants with threshold > 0 and create notifications
     * for those that are at or below threshold.
     */
    public function checkAllVariants(): array
    {
        $variants = ProductVariant::with('product')
            ->where('stock_threshold', '>', 0)
            ->get();

        $notificationsCreated = 0;
        $variantsChecked = $variants->count();

        foreach ($variants as $variant) {
            $created = $this->checkVariant($variant);
            if ($created) {
                $notificationsCreated++;
            }
        }

        Log::info('Stock threshold check completed', [
            'variants_checked' => $variantsChecked,
            'notifications_created' => $notificationsCreated,
            'timestamp' => now()->toISOString(),
        ]);

        return [
            'variants_checked' => $variantsChecked,
            'notifications_created' => $notificationsCreated,
        ];
    }

    /**
     * Check a single variant and create notification if below threshold.
     * Returns true if a new notification was created.
     */
    public function checkVariant(ProductVariant $variant): bool
    {
        // Skip if threshold is not set
        if ($variant->stock_threshold <= 0) {
            return false;
        }

        // Determine notification type
        $type = $variant->isOutOfStock() ? 'out_of_stock' : 'low_stock';

        // Only create notification if stock is at or below threshold
        if (!$variant->isBelowThreshold()) {
            return false;
        }

        // Check if there's already an unread notification for this variant
        // with the EXACT same stock level (avoid duplicate notifications)
        $existingNotification = StockNotification::where('product_variant_id', $variant->id)
            ->where('status', 'unread')
            ->where('stock_current', $variant->stock_current)
            ->first();

        if ($existingNotification) {
            // Notification already exists with same stock level, skip
            return false;
        }

        // Mark any old unread notifications for this variant as read
        StockNotification::where('product_variant_id', $variant->id)
            ->where('status', 'unread')
            ->update(['status' => 'read']);

        // Create audit notification
        StockNotification::create([
            'product_variant_id' => $variant->id,
            'product_name' => $variant->product->name ?? 'Unknown Product',
            'variant_name' => $variant->variant_name,
            'stock_current' => $variant->stock_current,
            'stock_threshold' => $variant->stock_threshold,
            'type' => $type,
            'status' => 'unread',
        ]);

        // Dispatch Laravel notification to all admin/manager users
        $this->dispatchToUsers($variant, $type);

        Log::info('Stock notification created', [
            'variant_id' => $variant->id,
            'variant_name' => $variant->variant_name,
            'stock_current' => $variant->stock_current,
            'stock_threshold' => $variant->stock_threshold,
            'type' => $type,
        ]);

        return true;
    }

    /**
     * Dispatch stock notification to all admin/manager users.
     */
    private function dispatchToUsers(ProductVariant $variant, string $type): void
    {
        $users = User::where('is_active', true)
            ->where('suspended', false)
            ->get();

        $notification = new StockLowNotification($variant, $type);

        foreach ($users as $user) {
            // Check if user already has an unread notification for this variant
            // with the same stock level
            $hasDuplicate = $user->unreadNotifications()
                ->where('data->product_variant_id', $variant->id)
                ->where('data->stock_current', $variant->stock_current)
                ->exists();

            if (!$hasDuplicate) {
                // Mark old unread notifications for this variant as read
                $user->unreadNotifications()
                    ->where('data->product_variant_id', $variant->id)
                    ->update(['read_at' => now()]);

                $user->notify($notification);
            }
        }
    }

    /**
     * Get unread notifications for the authenticated user.
     */
    public function getUnreadNotifications(?int $limit = null): Collection
    {
        $user = auth()->user();

        if (!$user) {
            return collect();
        }

        $query = $user->unreadNotifications()
            ->orderBy('created_at', 'desc');

        if ($limit) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Get count of unread notifications for the authenticated user.
     */
    public function getUnreadCount(): int
    {
        $user = auth()->user();

        if (!$user) {
            return 0;
        }

        return $user->unreadNotifications()->count();
    }

    /**
     * Mark a notification as read for the authenticated user.
     */
    public function markAsRead(string $id): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        $notification = $user->unreadNotifications()->find($id);

        if (!$notification) {
            return false;
        }

        $notification->markAsRead();
        return true;
    }

    /**
     * Mark all unread notifications as read for the authenticated user.
     */
    public function markAllAsRead(): int
    {
        $user = auth()->user();

        if (!$user) {
            return 0;
        }

        return $user->unreadNotifications()->update(['read_at' => now()]);
    }

    /**
     * Get all variants that are currently below their threshold.
     */
    public function getLowStockVariants(): Collection
    {
        return ProductVariant::with('product')
            ->where('stock_threshold', '>', 0)
            ->whereColumn('stock_current', '<=', 'stock_threshold')
            ->orderBy('stock_current', 'asc')
            ->get();
    }
}
