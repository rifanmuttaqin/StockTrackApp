<?php

use App\Http\Controllers\Settings\WhatsAppSettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('settings')->name('settings.')->group(function () {
    // Main settings page (redirects to WhatsApp)
    Route::get('/', function () {
        return redirect()->route('settings.whatsapp.index');
    })->name('index');

    // WhatsApp Settings
    Route::get('/whatsapp', [WhatsAppSettingController::class, 'index'])->name('whatsapp.index');
    Route::put('/whatsapp', [WhatsAppSettingController::class, 'update'])->name('whatsapp.update');
    Route::post('/whatsapp/test', [WhatsAppSettingController::class, 'testConnection'])->name('whatsapp.test');
    Route::get('/whatsapp/status', [WhatsAppSettingController::class, 'status'])->name('whatsapp.status');
    Route::get('/whatsapp/log', [WhatsAppSettingController::class, 'log'])->name('whatsapp.log');
});
