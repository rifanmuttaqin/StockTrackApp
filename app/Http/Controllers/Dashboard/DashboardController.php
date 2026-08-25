<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display dashboard
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        $period = $request->input('period', '30days');
        $startDate = $this->resolveStartDate($period, $request);
        $endDate = $this->resolveEndDate($period, $request);

        $dashboardData = $this->getDashboardData($startDate, $endDate);

        return Inertia::render('Dashboard/Index', [
            'user' => $user,
            'dashboardData' => $dashboardData,
            'filters' => [
                'period' => $period,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
        ]);
    }

    /**
     * Resolve start date from period
     */
    private function resolveStartDate(string $period, Request $request): Carbon
    {
        return match ($period) {
            'today' => Carbon::today(),
            '7days' => Carbon::now()->subDays(6)->startOfDay(),
            '30days' => Carbon::now()->subDays(29)->startOfDay(),
            'custom' => Carbon::parse($request->input('start_date', Carbon::now()->subDays(29)->toDateString()))->startOfDay(),
            default => Carbon::now()->subDays(29)->startOfDay(),
        };
    }

    /**
     * Resolve end date from period
     */
    private function resolveEndDate(string $period, Request $request): Carbon
    {
        return match ($period) {
            'custom' => Carbon::parse($request->input('end_date', Carbon::now()->toDateString()))->endOfDay(),
            default => Carbon::now()->endOfDay(),
        };
    }

    /**
     * Get all dashboard data
     */
    protected function getDashboardData(Carbon $startDate, Carbon $endDate): array
    {
        $lowStockThreshold = 10;

        return [
            // KPI Cards
            'totalProducts' => DB::table('products')->count(),
            'totalActiveVariants' => DB::table('product_variants')
                ->where('stock_current', '>', 0)
                ->count(),
            'lowStockCount' => DB::table('product_variants')
                ->where('stock_current', '<=', $lowStockThreshold)
                ->count(),
            'totalTransactions' => DB::table('stock_out_records')
                ->whereDate('created_at', '>=', $startDate->toDateString())
                ->whereDate('created_at', '<=', $endDate->toDateString())
                ->where('status', '!=', 'draft')
                ->count()
                + DB::table('stock_in_records')
                ->whereDate('created_at', '>=', $startDate->toDateString())
                ->whereDate('created_at', '<=', $endDate->toDateString())
                ->where('status', '!=', 'draft')
                ->count(),

            // Chart: Stock Movement Trend (daily stock in vs stock out quantity)
            'stockMovementTrend' => $this->getStockMovementTrend($startDate, $endDate),

            // Table: Low stock products (top 10)
            'lowStockProducts' => $this->getLowStockProducts($lowStockThreshold),
        ];
    }

    /**
     * Get daily stock movement trend (stock in qty vs stock out qty)
     */
    private function getStockMovementTrend(Carbon $startDate, Carbon $endDate): array
    {
        // Daily stock out quantities
        $stockOut = DB::table('stock_out_items')
            ->join('stock_out_records', 'stock_out_items.stock_out_record_id', '=', 'stock_out_records.id')
            ->where('stock_out_records.status', '!=', 'draft')
            ->whereDate('stock_out_records.created_at', '>=', $startDate->toDateString())
            ->whereDate('stock_out_records.created_at', '<=', $endDate->toDateString())
            ->select(
                DB::raw('DATE(stock_out_records.created_at) as date'),
                DB::raw('SUM(stock_out_items.quantity) as total')
            )
            ->groupBy(DB::raw('DATE(stock_out_records.created_at)'))
            ->pluck('total', 'date');

        // Daily stock in quantities
        $stockIn = DB::table('stock_in_items')
            ->join('stock_in_records', 'stock_in_items.stock_in_record_id', '=', 'stock_in_records.id')
            ->where('stock_in_records.status', '!=', 'draft')
            ->whereDate('stock_in_records.created_at', '>=', $startDate->toDateString())
            ->whereDate('stock_in_records.created_at', '<=', $endDate->toDateString())
            ->select(
                DB::raw('DATE(stock_in_records.created_at) as date'),
                DB::raw('SUM(stock_in_items.quantity) as total')
            )
            ->groupBy(DB::raw('DATE(stock_in_records.created_at)'))
            ->pluck('total', 'date');

        // Merge into daily series
        $trend = [];
        $current = $startDate->copy()->startOfDay();
        $end = $endDate->copy()->startOfDay();

        while ($current->lte($end)) {
            $dateKey = $current->toDateString();
            $trend[] = [
                'date' => $current->format('d M'),
                'stock_in' => (int) ($stockIn[$dateKey] ?? 0),
                'stock_out' => (int) ($stockOut[$dateKey] ?? 0),
            ];
            $current->addDay();
        }

        return $trend;
    }

    /**
     * Get top low stock products
     */
    private function getLowStockProducts(int $threshold): array
    {
        return DB::table('product_variants')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->leftJoin('units', 'product_variants.unit_id', '=', 'units.id')
            ->where('product_variants.stock_current', '<=', $threshold)
            ->orderBy('product_variants.stock_current', 'asc')
            ->limit(10)
            ->select(
                'products.name as product_name',
                'product_variants.variant_name',
                'product_variants.stock_current',
                'units.abbreviation as unit_abbreviation'
            )
            ->get()
            ->toArray();
    }
}
