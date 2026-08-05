<?php

namespace App\Http\Controllers\StockOut;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockOutRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class StockOutReportController extends Controller
{
    /**
     * Log stock out report actions for audit trail
     */
    private function logReportAction(string $action, array $details = []): void
    {
        $currentUser = Auth::user();

        Log::info('Stock Out Report Action', [
            'action' => $action,
            'performed_by' => $currentUser->id,
            'performed_by_name' => $currentUser->name,
            'details' => $details,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Export stock out report as JSON for AI analysis
     */
    public function exportJson(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        try {
            $productId = $request->get('product_id');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            if (!$startDate || !$endDate) {
                $endDate = now()->toDateString();
                $startDate = now()->subDays(29)->toDateString();
            }

            $totalDays = \Carbon\Carbon::parse($startDate)->diffInDays(\Carbon\Carbon::parse($endDate)) + 1;

            Log::info('Stock Out JSON Export Request', [
                'product_id' => $productId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'performed_by' => Auth::id(),
            ]);

            // Query stock out records
            $query = StockOutRecord::with(['items.productVariant', 'items.productVariant.product'])
                ->where('status', 'submit')
                ->whereBetween('date', [$startDate, $endDate]);

            if ($productId) {
                $query->whereHas('items.productVariant', function ($q) use ($productId) {
                    $q->where('product_id', $productId);
                });
            }

            $stockOutRecords = $query->orderBy('date')->get();

            // Get products with variants
            $productsQuery = Product::with('variants');
            if ($productId) {
                $productsQuery->where('id', $productId);
            }
            $products = $productsQuery->orderBy('name')->get();

            // Build date range
            $dates = [];
            $currentDate = \Carbon\Carbon::parse($startDate);
            $endCarbon = \Carbon\Carbon::parse($endDate);
            while ($currentDate->lte($endCarbon)) {
                $dates[] = $currentDate->toDateString();
                $currentDate->addDay();
            }

            // Build products data
            $productsData = [];
            $totalStockOutQty = 0;
            $totalVariantsBelow = 0;
            $totalVariantsOOS = 0;
            $totalVariants = 0;

            foreach ($products as $product) {
                $variants = $product->variants->sortBy('variant_name');
                $variantsData = [];

                foreach ($variants as $variant) {
                    $totalVariants++;

                    // Daily consumption map
                    $dailyDetail = [];
                    foreach ($dates as $date) {
                        $qty = $stockOutRecords
                            ->filter(fn($r) => $r->date->toDateString() === $date)
                            ->flatMap(fn($r) => $r->items->filter(fn($i) => $i->product_variant_id === $variant->id))
                            ->sum('quantity');
                        $dailyDetail[$date] = $qty;
                    }

                    // Consumption stats
                    $totalOut = array_sum($dailyDetail);
                    $nonZeroDays = array_filter($dailyDetail, fn($v) => $v > 0);
                    $dailyAverage = count($nonZeroDays) > 0
                        ? round(array_sum($nonZeroDays) / count($nonZeroDays), 2)
                        : 0;
                    $maxDaily = count($nonZeroDays) > 0 ? max($nonZeroDays) : 0;
                    $minDaily = count($nonZeroDays) > 0 ? min($nonZeroDays) : 0;

                    $totalStockOutQty += $totalOut;

                    $isBelowThreshold = $variant->stock_threshold > 0 && $variant->stock_current <= $variant->stock_threshold;
                    $isOutOfStock = $variant->stock_current <= 0;

                    if ($isBelowThreshold) $totalVariantsBelow++;
                    if ($isOutOfStock) $totalVariantsOOS++;

                    // Projection
                    $daysUntilStockout = null;
                    $recommendedReorderQty = null;
                    $suggestedReorderDate = null;

                    if ($dailyAverage > 0 && $variant->stock_current > 0) {
                        $daysUntilStockout = (int) floor($variant->stock_current / $dailyAverage);
                        $recommendedReorderQty = (int) ceil($dailyAverage * 30); // 30-day safety stock
                        $reorderDay = max(0, $daysUntilStockout - 7); // 7-day lead time
                        $suggestedReorderDate = now()->addDays($reorderDay)->toDateString();
                    }

                    $variantsData[] = [
                        'variant_id' => $variant->id,
                        'variant_name' => $variant->variant_name,
                        'variant_sku' => $variant->sku,
                        'current_stock' => $variant->stock_current,
                        'stock_threshold' => $variant->stock_threshold ?? 0,
                        'is_below_threshold' => $isBelowThreshold,
                        'is_out_of_stock' => $isOutOfStock,
                        'consumption' => [
                            'total_out' => $totalOut,
                            'daily_average' => $dailyAverage,
                            'days_with_consumption' => count($nonZeroDays),
                            'max_daily' => $maxDaily,
                            'min_daily' => $minDaily,
                            'daily_detail' => $dailyDetail,
                        ],
                        'projection' => [
                            'days_until_stockout' => $daysUntilStockout,
                            'recommended_reorder_quantity' => $recommendedReorderQty,
                            'suggested_reorder_date' => $suggestedReorderDate,
                        ],
                    ];
                }

                $productsData[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'variants' => $variantsData,
                ];
            }

            $data = [
                'export_info' => [
                    'generated_at' => now()->toISOString(),
                    'period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'total_days' => $totalDays,
                ],
                'summary' => [
                    'total_products' => count($productsData),
                    'total_variants' => $totalVariants,
                    'total_stock_out_quantity' => $totalStockOutQty,
                    'variants_below_threshold' => $totalVariantsBelow,
                    'variants_out_of_stock' => $totalVariantsOOS,
                ],
                'products' => $productsData,
            ];

            $this->logReportAction('export_stock_out_json', [
                'product_id' => $productId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'variants_count' => $totalVariants,
            ]);

            $filename = 'stock_out_report_' . now()->format('Y-m-d_His') . '.json';

            return response()->stream(function () use ($data) {
                echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            }, 200, [
                'Content-Type' => 'application/json',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to export stock out JSON', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'performed_by' => Auth::id(),
            ]);

            return response()->json(['error' => 'Gagal mengekspor data JSON.'], 500);
        }
    }

    /**
     * Display the stock out report
     */
    public function index(Request $request): Response
    {
        try {
            $productId = $request->get('product_id');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            // Set default date range to last 7 days if not specified
            if (!$startDate || !$endDate) {
                $endDate = now()->toDateString();
                $startDate = now()->subDays(6)->toDateString();
            }

            Log::info('Stock Out Report Request', [
                'product_id' => $productId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'performed_by' => Auth::id(),
            ]);

            // Query stock out records with eager loading
            $query = StockOutRecord::with(['items.productVariant', 'items.productVariant.product'])
                ->where('status', 'submit')
                ->whereBetween('date', [$startDate, $endDate]);

            // Filter by product if provided
            if ($productId) {
                $query->whereHas('items.productVariant', function ($q) use ($productId) {
                    $q->where('product_id', $productId);
                });
            }

            $stockOutRecords = $query->orderBy('date')->get();

            // Get unique dates from the records (convert Carbon objects to strings)
            $dates = $stockOutRecords->pluck('date')
                ->map(function ($date) {
                    return $date->toDateString();
                })
                ->unique()
                ->sort()
                ->values()
                ->toArray();

            // If no records found, generate dates from the date range
            if (empty($dates)) {
                $dates = [];
                $currentDate = \Carbon\Carbon::parse($startDate);
                $endCarbon = \Carbon\Carbon::parse($endDate);
                while ($currentDate->lte($endCarbon)) {
                    $dates[] = $currentDate->toDateString();
                    $currentDate->addDay();
                }
            }

            // Get all products for the dropdown filter (always include all products)
            $allProducts = Product::orderBy('name')->get();
            
            // Get products with their variants for the report data (filtered by product_id if provided)
            $productsQuery = Product::with('variants');
            if ($productId) {
                $productsQuery->where('id', $productId);
            }
            $products = $productsQuery->orderBy('name')->get();

            // Build stock out data structure grouped by product and variant
            $stockOutData = [
                'dates' => $dates,
                'products' => [],
            ];

            foreach ($products as $product) {
                $variants = $product->variants->sortBy('variant_name');

                $productData = [
                    'id' => $product->id,
                    'name' => $product->name,
                    'variants' => [],
                ];

                foreach ($variants as $variant) {
                    // Calculate stock out quantity for each date
                    $stockOutByDate = [];

                    foreach ($dates as $date) {
                        $totalQuantity = $stockOutRecords
                            ->filter(function ($record) use ($date, $variant) {
                                return $record->date->toDateString() === $date;
                            })
                            ->flatMap(function ($record) use ($variant) {
                                return $record->items->filter(function ($item) use ($variant) {
                                    return $item->product_variant_id === $variant->id;
                                });
                            })
                            ->sum('quantity');

                        $stockOutByDate[$date] = $totalQuantity;
                    }

                    // Calculate average of numeric values in stock_out_by_date
                    // Ignore empty (0) values and non-numeric values
                    $numericValues = array_filter($stockOutByDate, function ($value) {
                        return is_numeric($value) && $value > 0;
                    });
                    
                    $average = 0;
                    if (!empty($numericValues)) {
                        $average = round(array_sum($numericValues) / count($numericValues), 2);
                    }

                    // Calculate total (jumlah) of all values in stock_out_by_date
                    $total = array_sum($stockOutByDate);

                    $productData['variants'][] = [
                        'id' => $variant->id,
                        'name' => $variant->variant_name,
                        'sku' => $variant->sku,
                        'stock' => $variant->stock_current,
                        'stock_out_by_date' => $stockOutByDate,
                        'average' => $average,
                        'total' => $total,
                    ];
                }

                // Calculate product-level totals
                $productTotal = 0;
                $productAverageSum = 0;
                $variantCount = 0;

                foreach ($productData['variants'] as $variant) {
                    $productTotal += $variant['total'];
                    if ($variant['average'] > 0) {
                        $productAverageSum += $variant['average'];
                        $variantCount++;
                    }
                }

                // Calculate average of variant averages
                $productAverage = 0;
                if ($variantCount > 0) {
                    $productAverage = round($productAverageSum / $variantCount, 2);
                }

                $productData['total'] = $productTotal;
                $productData['average'] = $productAverage;

                $stockOutData['products'][] = $productData;
            }

            $this->logReportAction('view_stock_out_report', [
                'product_id' => $productId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'dates_count' => count($dates),
                'products_count' => count($stockOutData['products']),
            ]);

            return Inertia::render('Reports/StockOut/Index', [
                'products' => $allProducts,
                'stockOutData' => $stockOutData,
                'filters' => [
                    'product_id' => $productId,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate stock out report', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('Reports/StockOut/Index', [
                'products' => [],
                'stockOutData' => [
                    'dates' => [],
                    'products' => [],
                ],
                'filters' => [
                    'product_id' => $request->get('product_id'),
                    'start_date' => $request->get('start_date'),
                    'end_date' => $request->get('end_date'),
                ],
                'error' => 'Gagal memuat laporan stock out. Silakan coba lagi.',
            ]);
        }
    }
}
