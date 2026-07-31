<?php

namespace App\Providers;

use App\Events\StockOpnameSubmitted;
use App\Listeners\AdjustProductVariantStock;
use App\Listeners\CheckStockThresholdAfterOpname;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Event::listen(StockOpnameSubmitted::class, AdjustProductVariantStock::class);
        Event::listen(StockOpnameSubmitted::class, CheckStockThresholdAfterOpname::class);
    }
}
