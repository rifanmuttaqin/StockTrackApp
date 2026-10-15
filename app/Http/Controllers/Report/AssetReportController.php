<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AssetReportController extends Controller
{
    /**
     * Display the asset report (total nilai modal barang).
     *
     * Nilai aset dihitung per varian: purchase_price x stock_current.
     * Varian/produk yang di-soft-delete dikecualikan.
     */
    public function index(Request $request): Response
    {
        try {
            $search = trim((string) $request->get('search', ''));

            $query = Product::with(['variants' => function ($q) {
                $q->with('baseUnit')->orderBy('variant_name', 'asc');
            }])->orderBy('name', 'asc');

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                        ->orWhere('sku', 'ILIKE', "%{$search}%")
                        ->orWhereHas('variants', function ($vq) use ($search) {
                            $vq->where('variant_name', 'ILIKE', "%{$search}%")
                                ->orWhere('sku', 'ILIKE', "%{$search}%");
                        });
                });
            }

            $products = $query->get();

            $items = [];
            $grandTotal = 0.0;
            $totalQty = 0;

            foreach ($products as $product) {
                $productTotal = 0.0;
                $productQty = 0;

                foreach ($product->variants as $variant) {
                    $purchasePrice = (float) ($variant->purchase_price ?? 0);
                    $stock = (int) ($variant->stock_current ?? 0);
                    $subtotal = round($purchasePrice * $stock, 2);

                    $productTotal += $subtotal;
                    $productQty += $stock;
                    $grandTotal += $subtotal;
                    $totalQty += $stock;

                    $items[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'product_sku' => $product->sku,
                        'variant_id' => $variant->id,
                        'variant_name' => $variant->variant_name,
                        'variant_sku' => $variant->sku,
                        'unit' => $variant->baseUnit ? [
                            'name' => $variant->baseUnit->name,
                            'abbreviation' => $variant->baseUnit->abbreviation,
                        ] : null,
                        'stock_current' => $stock,
                        'purchase_price' => $purchasePrice,
                        'subtotal' => $subtotal,
                    ];
                }

                // Sisipkan ringkasan per produk sebagai penanda grup di akhir item produknya
                // (dipakai frontend untuk subtotal per produk bila diperlukan)
                if ($product->variants->count() > 0) {
                    $items[] = [
                        'is_product_summary' => true,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'product_sku' => $product->sku,
                        'variant_count' => $product->variants->count(),
                        'product_qty' => $productQty,
                        'product_total' => round($productTotal, 2),
                    ];
                }
            }

            $grandTotal = round($grandTotal, 2);

            return Inertia::render('Reports/Asset/Index', [
                'items' => $items,
                'statistics' => [
                    'grand_total' => $grandTotal,
                    'total_qty' => $totalQty,
                    'total_products' => $products->count(),
                    'total_variants' => $products->sum(fn ($p) => $p->variants->count()),
                ],
                'filters' => [
                    'search' => $search !== '' ? $search : null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load asset report', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('Reports/Asset/Index', [
                'items' => [],
                'statistics' => [
                    'grand_total' => 0,
                    'total_qty' => 0,
                    'total_products' => 0,
                    'total_variants' => 0,
                ],
                'filters' => [
                    'search' => null,
                ],
                'error' => 'Gagal memuat laporan aset. Silakan coba lagi.',
            ]);
        }
    }
}
