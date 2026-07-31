<?php

namespace App\Listeners;

use App\Events\StockOpnameSubmitted;
use App\Services\StockThresholdService;

class CheckStockThresholdAfterOpname
{
    protected StockThresholdService $thresholdService;

    public function __construct(StockThresholdService $thresholdService)
    {
        $this->thresholdService = $thresholdService;
    }

    /**
     * Handle the event.
     */
    public function handle(StockOpnameSubmitted $event): void
    {
        $record = $event->record->load('items.productVariant.product');

        foreach ($record->items as $item) {
            $variant = $item->productVariant;
            $this->thresholdService->checkVariant($variant);
        }
    }
}
