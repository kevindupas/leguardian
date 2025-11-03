<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BraceletController;
use App\Http\Controllers\Api\DeviceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Auth Routes
Route::prefix('mobile/auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
});

// Protected Mobile App Routes
Route::prefix('mobile')->middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'me']);
    Route::post('user/notification-token', [AuthController::class, 'updateFcmToken']);

    // Bracelets
    Route::get('bracelets', [BraceletController::class, 'index']);
    Route::get('bracelets/available', [BraceletController::class, 'getAvailableBracelets']);
    Route::post('bracelets/register', [BraceletController::class, 'register']);
    Route::get('bracelets/{bracelet}', [BraceletController::class, 'show']);
    Route::put('bracelets/{bracelet}', [BraceletController::class, 'update']);
    Route::post('bracelets/{bracelet}/vibrate', [BraceletController::class, 'vibrate']);
    Route::post('bracelets/{bracelet}/resolve-emergency', [BraceletController::class, 'resolveEmergency']);
    Route::get('bracelets/{bracelet}/events', [BraceletController::class, 'getEvents']);
});

// Device (Bracelet) Routes - No authentication (for ESP32)
Route::prefix('devices')->group(function () {
    // Authentication
    Route::post('auth', [DeviceController::class, 'authenticate']);

    // Button events
    Route::post('button/arrived', [DeviceController::class, 'buttonArrived']);
    Route::post('button/lost', [DeviceController::class, 'buttonLost']);
    Route::post('button/danger', [DeviceController::class, 'buttonDanger']);

    // Danger mode updates
    Route::post('danger/update', [DeviceController::class, 'dangerUpdate']);

    // Commands polling
    Route::get('commands', [DeviceController::class, 'getCommands']);
    Route::post('commands/{id}/ack', [DeviceController::class, 'acknowledgeCommand']);

    // Heartbeat
    Route::post('heartbeat', [DeviceController::class, 'heartbeat']);
});

// Health check
Route::get('health', function () {
    return response()->json(['status' => 'ok']);
});
