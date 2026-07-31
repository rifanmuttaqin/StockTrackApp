<?php

namespace App\Listeners;

use App\Events\StockOpnameSubmitted;
use App\Models\ProductVariant;

class AdjustProductVariantStock
{
    /**
     * Synchronous listener that mutates stock to product variants.
     * Runs within the active database transaction from the controller.
     */
    public function handle(StockOpnameSubmitted $event): void
    {
        $record = $event->record->load('items');

        foreach ($record->items as $item) {
            // Row-level lock on product variant
            $variant = ProductVariant::lockForUpdate()->findOrFail($item->product_variant_id);

            $systemStockSubmit = $variant->stock_current;
            $physicalStock = $item->physical_stock;
            $difference = $physicalStock - $systemStockSubmit;

            // Save actual submit snapshot from DB (not from request payload)
            $item->update([
                'system_stock_submit' => $systemStockSubmit,
                'difference' => $difference,
            ]);

            // Mutate stock absolutely
            $variant->stock_current = $physicalStock;
            $variant->save();
        }
    }
}
