<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Services\StockThresholdService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class StockThresholdController extends Controller
{
    public function __construct(
        private StockThresholdService $thresholdService
    ) {}

    /**
     * Update threshold for a single product variant.
     */
    public function update(Request $request, ProductVariant $variant)
    {
        try {
            $validated = $request->validate([
                'stock_threshold' => 'required|integer|min:0',
            ]);

            $variant->update([
                'stock_threshold' => $validated['stock_threshold'],
            ]);

            // Immediately check if this variant is now below threshold
            if ($validated['stock_threshold'] > 0) {
                $this->thresholdService->checkVariant($variant);
            }

            Log::info('Stock threshold updated', [
                'variant_id' => $variant->id,
                'variant_name' => $variant->variant_name,
                'stock_threshold' => $validated['stock_threshold'],
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Threshold berhasil diperbarui.',
                'data' => [
                    'id' => $variant->id,
                    'stock_threshold' => $variant->stock_threshold,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update stock threshold', [
                'error' => $e->getMessage(),
                'variant_id' => $variant->id,
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui threshold.',
            ], 500);
        }
    }

    /**
     * Bulk update thresholds for multiple product variants.
     */
    public function bulkUpdate(Request $request)
    {
        try {
            $validated = $request->validate([
                'variants' => 'required|array|min:1',
                'variants.*.id' => 'required|uuid|exists:product_variants,id',
                'variants.*.stock_threshold' => 'required|integer|min:0',
            ]);

            $updated = 0;
            foreach ($validated['variants'] as $item) {
                $variant = ProductVariant::find($item['id']);
                if ($variant) {
                    $variant->update([
                        'stock_threshold' => $item['stock_threshold'],
                    ]);

                    // Check threshold immediately
                    if ($item['stock_threshold'] > 0) {
                        $this->thresholdService->checkVariant($variant);
                    }

                    $updated++;
                }
            }

            Log::info('Bulk stock threshold updated', [
                'count' => $updated,
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "{$updated} threshold berhasil diperbarui.",
                'count' => $updated,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to bulk update stock thresholds', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui threshold.',
            ], 500);
        }
    }
}
