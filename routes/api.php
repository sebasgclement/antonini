<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VehicleExpenseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\ReservationController;

// ================== AUTH ==================
Route::post('/auth/login',  [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get ('/auth/me',     [AuthController::class, 'me'])->middleware('auth:sanctum');

Route::get('/ping', fn () => response()->json(['pong' => true]));

// ================== ZONA AUTENTICADA ==================
Route::middleware('auth:sanctum')->group(function () {
    // Customers CRUD
    Route::apiResource('customers', CustomerController::class);

    // Vehicles CRUD (ya reemplaza a Reception)
    Route::apiResource('vehicles', VehicleController::class);

    // Expenses por vehículo
    Route::get   ('/vehicles/{vehicle}/expenses',          [VehicleExpenseController::class, 'index']);
    Route::post  ('/vehicles/{vehicle}/expenses',          [VehicleExpenseController::class, 'store']);
    Route::delete('/vehicles/{vehicle}/expenses/{expense}',[VehicleExpenseController::class, 'destroy']);

    // Reports
    Route::get('/reports/sales/monthly',    [ReportController::class, 'salesMonthly']);
    Route::get('/reports/expenses/monthly', [ReportController::class, 'expensesMonthly']);

    // ✅ Reservas
    Route::get('/reservations/create', [ReservationController::class, 'create']);
    Route::apiResource('reservations', ReservationController::class);

});


// ================== ZONA Roles ==================

Route::middleware(['auth:sanctum','role:admin'])->group(function () {
    // ...
    Route::get   ('/admin/roles',        [\App\Http\Controllers\Admin\RoleController::class, 'index']);
    Route::post  ('/admin/roles',        [\App\Http\Controllers\Admin\RoleController::class, 'store']);
    Route::get   ('/admin/roles/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'show']);
    Route::put   ('/admin/roles/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'update']);
    Route::delete('/admin/roles/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'destroy']);
});


// ================== ZONA ADMIN ==================
Route::middleware(['auth:sanctum','role:admin'])->group(function () {
    Route::get   ('/admin/users',        [\App\Http\Controllers\AdminUserController::class, 'index']);
    Route::post  ('/admin/users',        [\App\Http\Controllers\AdminUserController::class, 'store']);
    Route::get   ('/admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'show']);
    Route::put   ('/admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'update']);
    Route::delete('/admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'destroy']);

    Route::get('/admin/roles', [\App\Http\Controllers\AdminUserController::class, 'roles']);
});






