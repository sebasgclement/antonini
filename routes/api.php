<?php

// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\Api\ReceptionController;

// AUTH
Route::post('/auth/login',  [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get ('/auth/me',     [AuthController::class, 'me'])->middleware('auth:sanctum');

Route::get('/ping', fn () => response()->json(['pong' => true]));

// ZONA AUTENTICADA
Route::middleware('auth:sanctum')->group(function () {
    // Customers CRUD
    Route::get   ('/customers',            [CustomerController::class, 'index']);
    Route::post  ('/customers',            [CustomerController::class, 'store']);
    Route::get   ('/customers/{customer}', [CustomerController::class, 'show']);
    Route::put   ('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);

    // Receptions
    Route::post('/receptions', [ReceptionController::class, 'store']);
    Route::get ('/receptions', [ReceptionController::class, 'index']);
});

// ZONA ADMIN (solo admin)
Route::middleware(['auth:sanctum','role:admin'])->group(function () {
    Route::get   ('/admin/users',        [\App\Http\Controllers\AdminUserController::class, 'index']);
    Route::post  ('/admin/users',        [\App\Http\Controllers\AdminUserController::class, 'store']);
    Route::get   ('/admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'show']);
    Route::put   ('/admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'update']);
    Route::delete('/admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'destroy']);

    Route::get('/admin/roles', [\App\Http\Controllers\AdminUserController::class, 'roles']);
});
