<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
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

        // Get dashboard data
        $dashboardData = $this->getDashboardData();

        return Inertia::render('Dashboard/Index', [
            'user' => $user,
            'dashboardData' => $dashboardData,
        ]);
    }

    /**
     * Get dashboard data
     */
    protected function getDashboardData(): array
    {
        return [
            // 1. Total Produk - Count of all products
            'totalProducts' => DB::table('products')->count(),

            // 2. Stok menipis - Count of product variants where stock > 10
            'lowStockCount' => DB::table('product_variants')
                ->where('stock_current', '>', 10)
                ->count(),

            // 3. Aksi Cepat - Quick action buttons/links
            'quickActions' => [
                [
                    'label' => 'Buat Stock Out',
                    'route' => 'stock-out.create',
                    'icon' => 'add'
                ],
                [
                    'label' => 'Daftar Stock Out',
                    'route' => 'stock-out.index',
                    'icon' => 'list'
                ]
            ],

            // 4. Ringkasan record stock aktif hari ini - Summary of active stock records created today
            'todayStockRecords' => DB::table('stock_out_records')
                ->where('status', '!=', 'draft')
                ->whereDate('created_at', today())
                ->count(),
        ];
    }
}
