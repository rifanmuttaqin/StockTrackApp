<?php

namespace App\Http\Controllers\StockOpname;

use App\Http\Controllers\Controller;
use App\Models\StockOpnameItem;
use App\Models\StockOpnameRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StockOpnameReportController extends Controller
{
    /**
     * Display the stock opname report
     */
    public function index(Request $request): Response
    {
        try {
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');
            $status = $request->get('status', 'submit');

            $query = StockOpnameRecord::with(['items.productVariant.baseUnit', 'items.productVariant.baseUnit.conversions', 'items.productVariant.product', 'creator', 'submitter'])
                ->where('status', 'submit');

            if ($dateFrom) {
                $query->where('date', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->where('date', '<=', $dateTo);
            }

            $records = $query->orderBy('date', 'desc')->get()
                ->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'code' => $record->transaction_code,
                        'date' => $record->date->format('Y-m-d'),
                        'status' => $record->status,
                        'creator_name' => $record->creator?->name ?? '-',
                        'submitter_name' => $record->submitter?->name ?? '-',
                        'submitted_at' => $record->submitted_at?->format('Y-m-d H:i:s') ?? '-',
                        'items' => $record->items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'product_name' => $item->productVariant?->product?->name ?? '-',
                                'variant_name' => $item->productVariant?->variant_name ?? '-',
                                'unit' => $item->productVariant?->baseUnit ? [
                                    'id' => $item->productVariant->baseUnit->id,
                                    'name' => $item->productVariant->baseUnit->name,
                                    'abbreviation' => $item->productVariant->baseUnit->abbreviation,
                                ] : null,
                                'system_stock_draft' => $item->system_stock_draft,
                                'system_stock_submit' => $item->system_stock_submit,
                                'physical_stock' => $item->physical_stock,
                                'difference' => $item->difference,
                            ];
                        }),
                    ];
                });

            // Aggregate statistics
            $allItems = StockOpnameItem::whereHas('record', function ($q) use ($dateFrom, $dateTo) {
                $q->where('status', 'submit');
                if ($dateFrom) $q->where('date', '>=', $dateFrom);
                if ($dateTo) $q->where('date', '<=', $dateTo);
            })->get();

            $totalShortage = abs((int) $allItems->where('difference', '<', 0)->sum('difference'));
            $totalSurplus = (int) $allItems->where('difference', '>', 0)->sum('difference');
            $totalMatching = (int) $allItems->where('difference', '=', 0)->count();

            return Inertia::render('Reports/StockOpname/Index', [
                'records' => $records,
                'statistics' => [
                    'total_shortage' => $totalShortage,
                    'total_surplus' => $totalSurplus,
                    'total_matching' => $totalMatching,
                    'total_records' => $records->count(),
                ],
                'filters' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load stock opname report', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return Inertia::render('Reports/StockOpname/Index', [
                'records' => collect([]),
                'statistics' => [
                    'total_shortage' => 0,
                    'total_surplus' => 0,
                    'total_matching' => 0,
                    'total_records' => 0,
                ],
                'filters' => [
                    'date_from' => null,
                    'date_to' => null,
                ],
                'error' => 'Gagal memuat laporan stock opname. Silakan coba lagi.',
            ]);
        }
    }

    /**
     * Export stock opname report as CSV
     */
    public function export(Request $request): StreamedResponse
    {
        try {
            $dateFrom = $request->get('date_from');
            $dateTo = $request->get('date_to');

            $query = StockOpnameRecord::with(['items.productVariant.baseUnit', 'items.productVariant.baseUnit.conversions', 'items.productVariant.product', 'creator'])
                ->where('status', 'submit');

            if ($dateFrom) {
                $query->where('date', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->where('date', '<=', $dateTo);
            }

            $records = $query->orderBy('date', 'desc')->get();

            $filename = 'stock_opname_report_' . now()->format('Y-m-d_His') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            return response()->stream(function () use ($records) {
                $handle = fopen('php://output', 'w');

                // CSV header
                fputcsv($handle, [
                    'Kode Transaksi',
                    'Tanggal',
                    'Status',
                    'Dibuat Oleh',
                    'Disubmit Oleh',
                    'Tanggal Submit',
                    'Nama Produk',
                    'Nama Varian',
                    'Satuan',
                    'Stok Sistem (Draft)',
                    'Stok Sistem (Submit)',
                    'Stok Fisik',
                    'Selisih',
                    'Keterangan',
                ]);

                foreach ($records as $record) {
                    foreach ($record->items as $item) {
                        $keterangan = '';
                        if ($item->difference !== null) {
                            if ($item->difference < 0) {
                                $keterangan = 'Shortage';
                            } elseif ($item->difference > 0) {
                                $keterangan = 'Surplus';
                            } else {
                                $keterangan = 'Matching';
                            }
                        }

                        fputcsv($handle, [
                            $record->transaction_code,
                            $record->date->format('Y-m-d'),
                            $record->status,
                            $record->creator?->name ?? '-',
                            $record->submitter?->name ?? '-',
                            $record->submitted_at?->format('Y-m-d H:i:s') ?? '-',
                            $item->productVariant?->product?->name ?? '-',
                            $item->productVariant?->variant_name ?? '-',
                            $item->productVariant?->baseUnit?->abbreviation ?? '-',
                            $item->system_stock_draft,
                            $item->system_stock_submit,
                            $item->physical_stock ?? '-',
                            $item->difference ?? '-',
                            $keterangan,
                        ]);
                    }
                }

                fclose($handle);
            }, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Failed to export stock opname report', [
                'error' => $e->getMessage(),
                'performed_by' => Auth::id(),
            ]);

            return response()->stream(function () {
                echo 'Gagal mengekspor data. Silakan coba lagi.';
            }, 500, ['Content-Type' => 'text/plain']);
        }
    }
}
