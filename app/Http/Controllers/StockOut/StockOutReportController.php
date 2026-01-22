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

                    $productData['variants'][] = [
                        'id' => $variant->id,
                        'name' => $variant->variant_name,
                        'sku' => $variant->sku,
                        'stock' => $variant->stock_current,
                        'stock_out_by_date' => $stockOutByDate,
                        'average' => $average,
                    ];
                }

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
