<?php

/**
 * Test Script: Transaction Code and Note Implementation
 * 
 * This script tests the stock-out transaction code and note functionality.
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\StockOutRecord;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "========================================\n";
echo "Stock-Out Transaction Code & Note Test\n";
echo "========================================\n\n";

// Test 1: Verify Database Schema
echo "Test 1: Verifying Database Schema\n";
echo "------------------------------------\n";

$columns = Schema::getColumnListing('stock_out_records');
$hasTransactionCode = in_array('transaction_code', $columns);
$hasNote = in_array('note', $columns);

echo "Transaction code column exists: " . ($hasTransactionCode ? "✓ PASS" : "✗ FAIL") . "\n";
echo "Note column exists: " . ($hasNote ? "✓ PASS" : "✗ FAIL") . "\n";

// Check unique constraint (PostgreSQL compatible)
$uniqueIndexes = DB::select("
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = 'stock_out_records'
    AND indexdef LIKE '%transaction_code%'
    AND indexdef LIKE '%UNIQUE%'
");
$hasUniqueIndex = count($uniqueIndexes) > 0;
echo "Unique index on transaction_code: " . ($hasUniqueIndex ? "✓ PASS" : "✗ FAIL") . "\n\n";

// Test 2: Transaction Code Generation
echo "Test 2: Transaction Code Generation\n";
echo "------------------------------------\n";

// Create a test stock-out record
$testRecord = StockOutRecord::create([
    'status' => 'draft',
    'date' => now()->toDateString(),
]);

echo "Created stock-out record ID: {$testRecord->id}\n";
echo "Transaction code generated: {$testRecord->transaction_code}\n";

// Verify format
$isValidFormat = preg_match('/^ALBR-\d{12}$/', $testRecord->transaction_code);
echo "Format validation (ALBR-{12 digits}): " . ($isValidFormat ? "✓ PASS" : "✗ FAIL") . "\n";

// Test uniqueness by creating multiple records
$codes = [];
for ($i = 0; $i < 5; $i++) {
    $record = StockOutRecord::create([
        'status' => 'draft',
        'date' => now()->toDateString(),
    ]);
    $codes[] = $record->transaction_code;
}

$uniqueCodes = count(array_unique($codes));
echo "Created 5 records, generated {$uniqueCodes} unique codes: " . ($uniqueCodes === 5 ? "✓ PASS" : "✗ FAIL") . "\n";

// Display generated codes
echo "\nGenerated transaction codes:\n";
foreach ($codes as $code) {
    echo "  - {$code}\n";
}

// Test 3: Note Functionality
echo "\nTest 3: Note Functionality\n";
echo "------------------------------------\n";

// Test creating with note
$testRecordWithNote = StockOutRecord::create([
    'status' => 'draft',
    'date' => now()->toDateString(),
    'note' => 'This is a test note for stock-out record',
]);

echo "Created record with note: {$testRecordWithNote->note}\n";
echo "Note saved successfully: " . ($testRecordWithNote->note ? "✓ PASS" : "✗ FAIL") . "\n";

// Test updating note
$testRecordWithNote->note = 'Updated note content';
$testRecordWithNote->save();

echo "Updated note: {$testRecordWithNote->note}\n";
echo "Note updated successfully: " . ($testRecordWithNote->note === 'Updated note content' ? "✓ PASS" : "✗ FAIL") . "\n";

// Test removing note
$testRecordWithNote->note = null;
$testRecordWithNote->save();

$noteRemovedSuccessfully = $testRecordWithNote->note === null;
echo "Removed note, current value: " . ($testRecordWithNote->note ?? 'null') . "\n";
echo "Note removed successfully: " . ($noteRemovedSuccessfully ? "✓ PASS" : "✗ FAIL") . "\n";

// Test max length validation (500 characters)
$longNote = str_repeat('a', 500);
$testRecordWithNote->note = $longNote;
$testRecordWithNote->save();

$noteLength = strlen($testRecordWithNote->note);
$noteLengthTest = $noteLength === 500;
echo "Note with 500 characters saved: " . ($noteLengthTest ? "✓ PASS" : "✗ FAIL (length: {$noteLength})") . "\n";

// Test 4: Transaction Code on Submit
echo "\nTest 4: Transaction Code on Status Change\n";
echo "------------------------------------\n";

$draftRecord = StockOutRecord::create([
    'status' => 'draft',
    'date' => now()->toDateString(),
]);

$draftCode = $draftRecord->transaction_code;
echo "Draft record transaction code: {$draftCode}\n";

$draftRecord->status = 'submitted';
$draftRecord->save();

$submittedCode = $draftRecord->transaction_code;
echo "Submitted record transaction code: {$submittedCode}\n";
echo "Code preserved on status change: " . ($draftCode === $submittedCode ? "✓ PASS" : "✗ FAIL") . "\n";

// Test 5: Database Constraints
echo "\nTest 5: Database Constraints\n";
echo "------------------------------------\n";

// Test unique constraint violation
$duplicateCodeRecord = new StockOutRecord([
    'status' => 'draft',
    'date' => now()->toDateString(),
    'transaction_code' => $testRecord->transaction_code, // Duplicate code
]);

try {
    $duplicateCodeRecord->save();
    echo "✗ FAIL: Duplicate transaction code was allowed\n";
} catch (\Illuminate\Database\QueryException $e) {
    echo "✓ PASS: Duplicate transaction code was rejected\n";
    echo "  Error: " . $e->getMessage() . "\n";
}

// Test 6: Summary
echo "\n========================================\n";
echo "Test Summary\n";
echo "========================================\n";

$allPassed = true;
$allPassed &= $hasTransactionCode;
$allPassed &= $hasNote;
$allPassed &= $hasUniqueIndex;
$allPassed &= $isValidFormat;
$allPassed &= ($uniqueCodes === 5);
$allPassed &= $noteRemovedSuccessfully;
$allPassed &= $noteLengthTest;
$allPassed &= ($draftCode === $submittedCode);

echo "\nOverall Result: " . ($allPassed ? "✓ ALL TESTS PASSED" : "✗ SOME TESTS FAILED") . "\n\n";

// Cleanup test records
echo "Cleaning up test records...\n";
StockOutRecord::whereIn('id', [$testRecord->id, $testRecordWithNote->id, $draftRecord->id])->delete();
StockOutRecord::whereIn('transaction_code', $codes)->delete();
echo "Cleanup complete.\n\n";

exit($allPassed ? 0 : 1);
