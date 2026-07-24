<?php

namespace App\Console\Commands;

use App\Services\StockThresholdService;
use Illuminate\Console\Command;

class CheckStockThreshold extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stock:check-threshold';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check all product variants against their stock threshold and create notifications for low stock';

    /**
     * Execute the console command.
     */
    public function handle(StockThresholdService $service): int
    {
        $this->info('Starting stock threshold check...');

        $result = $service->checkAllVariants();

        $this->info("Check completed:");
        $this->info("  - Variants checked: {$result['variants_checked']}");
        $this->info("  - Notifications created: {$result['notifications_created']}");

        if ($result['notifications_created'] > 0) {
            $this->warn("⚠ {$result['notifications_created']} variant(s) are below threshold!");
        } else {
            $this->info('✓ All variants are above their thresholds.');
        }

        return Command::SUCCESS;
    }
}
