<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VehicleExpenseController;
use App\Http\Controllers\Api\ReportController;

// ================== AUTH ==================
Route::post('/auth/login',  [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get ('/auth/me',     [AuthController::class, 'me'])->middleware('auth:sanctum');

Route::get('/ping', fn () => response()->json(['pong' => true]));

// ================== ZONA AUTENTICADA ==================
Route::middleware('auth:sanctum')->group(function () {
    // Customers CRUD
    Route::get   ('/customers',            [CustomerController::class, 'index']);
    Route::post  ('/customers',            [CustomerController::class, 'store']);
    Route::get   ('/customers/{customer}', [CustomerController::class, 'show']);
    Route::put   ('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);

    // Vehicles CRUD (ya reemplaza a Reception)
    Route::get   ('/vehicles',            [VehicleController::class, 'index']);
    Route::post  ('/vehicles',            [VehicleController::class, 'store']);
    Route::get   ('/vehicles/{vehicle}',  [VehicleController::class, 'show']);
    Route::put   ('/vehicles/{vehicle}',  [VehicleController::class, 'update']);
    Route::delete('/vehicles/{vehicle}',  [VehicleController::class, 'destroy']);

    // Expenses por vehículo
    Route::get   ('/vehicles/{vehicle}/expenses',          [VehicleExpenseController::class, 'index']);
    Route::post  ('/vehicles/{vehicle}/expenses',          [VehicleExpenseController::class, 'store']);
    Route::delete('/vehicles/{vehicle}/expenses/{expense}',[VehicleExpenseController::class, 'destroy']);

    // Reports
    Route::get('/reports/sales/monthly',    [ReportController::class, 'salesMonthly']);
    Route::get('/reports/expenses/monthly', [ReportController::class, 'expensesMonthly']);
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
