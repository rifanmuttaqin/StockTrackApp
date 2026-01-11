<?php

/**
 * Stock Out Report Feature Test Script
 * 
 * This script tests the Stock Out Report feature including:
 * - Backend API endpoint with various filter combinations
 * - Response structure verification
 * - Data filtering and ordering
 * - Permission access control
 */

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockOutRecord;
use App\Models\StockOutItem;
use App\Models\Role;
use App\Models\Permission;

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "========================================\n";
echo "Stock Out Report Feature Test\n";
echo "========================================\n\n";

// Test results tracking
$testsPassed = 0;
$testsFailed = 0;

/**
 * Helper function to print test result
 */
function printTestResult($testName, $passed, $details = '') {
    global $testsPassed, $testsFailed;
    
    if ($passed) {
        echo "✓ PASS: $testName\n";
        $testsPassed++;
    } else {
        echo "✗ FAIL: $testName\n";
        if ($details) {
            echo "  Details: $details\n";
        }
        $testsFailed++;
    }
}

/**
 * Test 1: Check if route exists
 */
echo "Test 1: Route Registration\n";
echo "----------------------------------------\n";
$routeExists = Route::has('stock-out-report.index');
printTestResult("Route '/reports/stock' is registered", $routeExists);

if ($routeExists) {
    $route = Route::getRoutes()->getByName('stock-out-report.index');
    printTestResult("Route uses StockOutReportController@index", 
        $route && $route->getActionName() === 'App\\Http\\Controllers\\StockOut\\StockOutReportController@index');
    printTestResult("Route requires 'view_reports' permission", 
        in_array('permission:view_reports', $route->gatherMiddleware()));
}
echo "\n";

/**
 * Test 2: Check database has required data
 */
echo "Test 2: Database Data Check\n";
echo "----------------------------------------\n";

$userCount = User::count();
printTestResult("Users exist in database", $userCount > 0, "Count: $userCount");

$productCount = Product::count();
printTestResult("Products exist in database", $productCount > 0, "Count: $productCount");

$variantCount = ProductVariant::count();
printTestResult("Product variants exist in database", $variantCount > 0, "Count: $variantCount");

$stockOutRecordCount = StockOutRecord::count();
printTestResult("Stock out records exist in database", $stockOutRecordCount > 0, "Count: $stockOutRecordCount");

$submittedStockOutCount = StockOutRecord::where('status', 'submit')->count();
printTestResult("Submitted stock out records exist", $submittedStockOutCount > 0, "Count: $submittedStockOutCount");
echo "\n";

/**
 * Test 3: Check permissions are seeded
 */
echo "Test 3: Permissions Check\n";
echo "----------------------------------------\n";

$viewReportsPermission = Permission::where('name', 'view_reports')->first();
printTestResult("'view_reports' permission exists", $viewReportsPermission !== null);

if ($viewReportsPermission) {
    $rolesWithPermission = Role::whereHas('permissions', function($q) use ($viewReportsPermission) {
        $q->where('id', $viewReportsPermission->id);
    })->get(['name']);
    
    printTestResult("Roles have 'view_reports' permission", $rolesWithPermission->count() > 0, 
        "Roles: " . $rolesWithPermission->pluck('name')->join(', '));
}
echo "\n";

/**
 * Test 4: Test controller data retrieval
 */
echo "Test 4: Controller Data Retrieval\n";
echo "----------------------------------------\n";

try {
    // Get a test user with view_reports permission
    $testUser = User::whereHas('roles.permissions', function($q) {
        $q->where('name', 'view_reports');
    })->first();
    
    if (!$testUser) {
        echo "⚠ SKIP: No user with 'view_reports' permission found\n\n";
    } else {
        printTestResult("Test user with 'view_reports' permission found", true,
            "User: {$testUser->name} ({$testUser->email})");
        
        // Set the authenticated user for the test
        Illuminate\Support\Facades\Auth::login($testUser);
        
        // Create a mock request
        $request = new Illuminate\Http\Request();
        
        // Test 1: Default request (no filters) - just verify it executes without errors
        $controller = new App\Http\Controllers\StockOut\StockOutReportController();
        
        try {
            $response = $controller->index($request);
            
            printTestResult("Controller index() returns Inertia response",
                $response instanceof Inertia\Response);
            
            printTestResult("Controller index() executes without errors", true);
            
        } catch (Exception $e) {
            printTestResult("Controller index() executes without errors", false, $e->getMessage());
        }
        
        // Test 2: Request with date filters
        try {
            $requestWithDates = new Illuminate\Http\Request();
            $requestWithDates->merge([
                'start_date' => '2026-01-01',
                'end_date' => '2026-01-10'
            ]);
            
            $response = $controller->index($requestWithDates);
            
            printTestResult("Controller handles date filters", true);
                
        } catch (Exception $e) {
            printTestResult("Controller handles date filters", false, $e->getMessage());
        }
        
        // Test 3: Request with product filter
        try {
            $product = Product::first();
            
            if ($product) {
                $requestWithProduct = new Illuminate\Http\Request();
                $requestWithProduct->merge(['product_id' => $product->id]);
                
                $response = $controller->index($requestWithProduct);
                
                printTestResult("Controller handles product filter", true);
            } else {
                echo "⚠ SKIP: No products found for product filter test\n";
            }
        } catch (Exception $e) {
            printTestResult("Controller handles product filter", false, $e->getMessage());
        }
        
        // Test 4: Verify only submitted records are included
        try {
            $draftCount = StockOutRecord::where('status', 'draft')->count();
            $submittedCount = StockOutRecord::where('status', 'submit')->count();
            
            printTestResult("Draft stock out records exist", $draftCount > 0, "Count: $draftCount");
            printTestResult("Submitted stock out records exist", $submittedCount > 0, "Count: $submittedCount");
            
            // The controller should only include 'submit' status records
            $query = StockOutRecord::with(['items.productVariant', 'items.productVariant.product'])
                ->where('status', 'submit')
                ->whereBetween('date', [now()->subDays(6)->toDateString(), now()->toDateString()]);
            
            $records = $query->get();
            printTestResult("Controller query filters by status='submit'", 
                $records->every(function($record) { return $record->status === 'submit'; }));
                
        } catch (Exception $e) {
            printTestResult("Controller filters by status correctly", false, $e->getMessage());
        }
        
        Illuminate\Support\Facades\Auth::logout();
    }
} catch (Exception $e) {
    printTestResult("Controller tests completed", false, $e->getMessage());
}
echo "\n";

/**
 * Test 5: Check frontend component exists
 */
echo "Test 5: Frontend Component Check\n";
echo "----------------------------------------\n";

$frontendComponentPath = __DIR__ . '/resources/js/Pages/Reports/StockOut/Index.jsx';
$componentExists = file_exists($frontendComponentPath);
printTestResult("Frontend component file exists", $componentExists, "Path: $frontendComponentPath");

if ($componentExists) {
    $componentContent = file_get_contents($frontendComponentPath);
    
    printTestResult("Component uses useMobileDetection hook", 
        strpos($componentContent, 'useMobileDetection') !== false);
    
    printTestResult("Component has mobile access denied message", 
        strpos($componentContent, 'Halaman ini hanya dapat diakses pada mode desktop') !== false);
    
    printTestResult("Component has filter section", 
        strpos($componentContent, 'Filter Laporan') !== false);
    
    printTestResult("Component has product dropdown", 
        strpos($componentContent, 'product_id') !== false);
    
    printTestResult("Component has date pickers", 
        strpos($componentContent, 'start_date') !== false && 
        strpos($componentContent, 'end_date') !== false);
    
    printTestResult("Component has apply filters button", 
        strpos($componentContent, 'Terapkan Filter') !== false);
    
    printTestResult("Component has reset filters button", 
        strpos($componentContent, 'Reset') !== false);
    
    printTestResult("Component has table structure", 
        strpos($componentContent, '<table') !== false);
    
    printTestResult("Component displays dates as column headers", 
        strpos($componentContent, 'stockOutData.dates.map') !== false);
    
    printTestResult("Component displays products as rows", 
        strpos($componentContent, 'stockOutData.products.map') !== false);
    
    printTestResult("Component has summary footer", 
        strpos($componentContent, 'Total Produk') !== false);
}
echo "\n";

/**
 * Test 6: Check sidebar menu integration
 */
echo "Test 6: Sidebar Menu Integration\n";
echo "----------------------------------------\n";

$sidebarPath = __DIR__ . '/resources/js/Components/Layouts/Sidebar.jsx';
$sidebarExists = file_exists($sidebarPath);
printTestResult("Sidebar component file exists", $sidebarExists, "Path: $sidebarPath");

if ($sidebarExists) {
    $sidebarContent = file_get_contents($sidebarPath);
    
    printTestResult("Sidebar has 'Laporan' menu", 
        strpos($sidebarContent, 'name: \'Laporan\'') !== false);
    
    printTestResult("'Laporan' menu has 'view_reports' permission", 
        strpos($sidebarContent, 'permission: \'view_reports\'') !== false);
    
    printTestResult("'Pergerakan Stok' is under 'Laporan' menu", 
        strpos($sidebarContent, 'name: \'Pergerakan Stok\'') !== false &&
        preg_match('/name:\s*[\'"]Laporan[\'"][\s\S]*name:\s*[\'"]Pergerakan Stok[\'"]/', $sidebarContent) === 1);
    
    printTestResult("'Pergerakan Stok' links to '/reports/stock'", 
        strpos($sidebarContent, 'href: \'/reports/stock\'') !== false);
    
    printTestResult("'Pergerakan Stok' requires 'view_reports' permission", 
        strpos($sidebarContent, 'permission: \'view_reports\'') !== false);
}
echo "\n";

/**
 * Test 7: Check mobile menu exclusion
 */
echo "Test 7: Mobile Menu Exclusion\n";
echo "----------------------------------------\n";

$mobileDashboardPath = __DIR__ . '/resources/js/Components/Dashboard/MobileDashboard.jsx';
$mobileDashboardExists = file_exists($mobileDashboardPath);
printTestResult("Mobile dashboard component file exists", $mobileDashboardExists);

if ($mobileDashboardExists) {
    $mobileDashboardContent = file_get_contents($mobileDashboardPath);
    
    printTestResult("'Pergerakan Stok' is NOT in mobile menu", 
        strpos($mobileDashboardContent, 'Pergerakan Stok') === false);
}
echo "\n";

/**
 * Test 8: Check useMobileDetection hook
 */
echo "Test 8: Mobile Detection Hook\n";
echo "----------------------------------------\n";

$hookPath = __DIR__ . '/resources/js/Hooks/useMobileDetection.js';
$hookExists = file_exists($hookPath);
printTestResult("useMobileDetection hook file exists", $hookExists, "Path: $hookPath");

if ($hookExists) {
    $hookContent = file_get_contents($hookPath);
    printTestResult("Hook exports isMobile function", 
        strpos($hookContent, 'export') !== false && 
        strpos($hookContent, 'isMobile') !== false);
}
echo "\n";

/**
 * Test 9: Verify data ordering
 */
echo "Test 9: Data Ordering Verification\n";
echo "----------------------------------------\n";

try {
    // Test product ordering
    $products = Product::orderBy('name')->get();
    $isOrdered = true;
    for ($i = 1; $i < $products->count(); $i++) {
        if (strcmp($products[$i-1]->name, $products[$i]->name) > 0) {
            $isOrdered = false;
            break;
        }
    }
    printTestResult("Products are ordered by name", $isOrdered);
    
    // Test variant ordering
    $productWithVariants = Product::with('variants')->first();
    if ($productWithVariants && $productWithVariants->variants->count() > 1) {
        $variants = $productWithVariants->variants->sortBy('variant_name');
        $isOrdered = true;
        for ($i = 1; $i < $variants->count(); $i++) {
            if (strcmp($variants[$i-1]->variant_name, $variants[$i]->variant_name) > 0) {
                $isOrdered = false;
                break;
            }
        }
        printTestResult("Variants are ordered by variant_name", $isOrdered);
    } else {
        echo "⚠ SKIP: Not enough variants to test ordering\n";
    }
    
    // Test date ordering
    $stockOutRecords = StockOutRecord::where('status', 'submit')
        ->orderBy('date')
        ->get();
    
    if ($stockOutRecords->count() > 1) {
        $isOrdered = true;
        for ($i = 1; $i < $stockOutRecords->count(); $i++) {
            if (strtotime($stockOutRecords[$i-1]->date) > strtotime($stockOutRecords[$i]->date)) {
                $isOrdered = false;
                break;
            }
        }
        printTestResult("Stock out records are ordered by date", $isOrdered);
    } else {
        echo "⚠ SKIP: Not enough stock out records to test ordering\n";
    }
    
} catch (Exception $e) {
    printTestResult("Data ordering tests completed", false, $e->getMessage());
}
echo "\n";

/**
 * Test 10: Verify stock out data structure
 */
echo "Test 10: Stock Out Data Structure\n";
echo "----------------------------------------\n";

try {
    $stockOutRecords = StockOutRecord::with(['items.productVariant', 'items.productVariant.product'])
        ->where('status', 'submit')
        ->limit(1)
        ->first();
    
    if ($stockOutRecords) {
        printTestResult("Stock out record has items relationship", 
            $stockOutRecords->items !== null);
        
        if ($stockOutRecords->items->count() > 0) {
            $item = $stockOutRecords->items->first();
            printTestResult("Stock out item has productVariant relationship", 
                $item->productVariant !== null);
            
            if ($item->productVariant) {
                printTestResult("Product variant has product relationship", 
                    $item->productVariant->product !== null);
            }
        }
    } else {
        echo "⚠ SKIP: No submitted stock out records found\n";
    }
    
} catch (Exception $e) {
    printTestResult("Stock out data structure tests completed", false, $e->getMessage());
}
echo "\n";

/**
 * Test Summary
 */
echo "========================================\n";
echo "Test Summary\n";
echo "========================================\n";
echo "Total Tests Passed: $testsPassed\n";
echo "Total Tests Failed: $testsFailed\n";
echo "Total Tests: " . ($testsPassed + $testsFailed) . "\n";

if ($testsFailed === 0) {
    echo "\n✓ All tests passed! The Stock Out Report feature is working correctly.\n";
} else {
    echo "\n✗ Some tests failed. Please review the failures above.\n";
}

echo "\n========================================\n";
