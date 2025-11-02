<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VehicleExpenseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\VehicleBrandController;


// ================== AUTH ==================
Route::post('/auth/login',  [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get ('/auth/me',     [AuthController::class, 'me'])->middleware('auth:sanctum');

Route::get('/ping', fn () => response()->json(['pong' => true]));


// ================== ZONA AUTENTICADA ==================
Route::middleware('auth:sanctum')->group(function () {

    // ✅ Clientes
    Route::apiResource('customers', CustomerController::class);

    // ✅ Vehículos
    Route::apiResource('vehicles', VehicleController::class);

    // ✅ Marcas de vehículo (CRUD simple)
    Route::get('/brands', [VehicleBrandController::class, 'index']);
    Route::post('/brands', [VehicleBrandController::class, 'store']);
    Route::put('/brands/{brand}', [VehicleBrandController::class, 'update']);
    Route::delete('/brands/{brand}', [VehicleBrandController::class, 'destroy']);

    // ✅ Gastos por vehículo
    Route::get   ('/vehicles/{vehicle}/expenses',           [VehicleExpenseController::class, 'index']);
    Route::post  ('/vehicles/{vehicle}/expenses',           [VehicleExpenseController::class, 'store']);
    Route::delete('/vehicles/{vehicle}/expenses/{expense}', [VehicleExpenseController::class, 'destroy']);

    // ✅ Reservas
    Route::get('/reservations/create', [ReservationController::class, 'create']);
    Route::apiResource('reservations', ReservationController::class);

    // ✅ Cambio de contraseña
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);

    // ✅ 📄 Listar métodos de pago (visible para vendedores, reservas, etc.)
    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
});


// ================== ZONA ADMIN ==================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {

    // ================== ROLES ==================
    Route::prefix('admin/roles')->group(function () {
        Route::get   ('/',          [RoleController::class, 'index']);
        Route::post  ('/',          [RoleController::class, 'store']);
        Route::get   ('/{role}',    [RoleController::class, 'show']);
        Route::put   ('/{role}',    [RoleController::class, 'update']);
        Route::delete('/{role}',    [RoleController::class, 'destroy']);
    });

    // ✅ Listado simple de roles (para selects en formularios)
    Route::get('/admin/roles-list', [AdminUserController::class, 'roles']);

    // ================== USUARIOS ==================
    Route::prefix('admin/users')->group(function () {
        Route::get   ('/',        [AdminUserController::class, 'index']);
        Route::post  ('/',        [AdminUserController::class, 'store']);
        Route::get   ('/{user}',  [AdminUserController::class, 'show']);
        Route::put   ('/{user}',  [AdminUserController::class, 'update']);
        Route::delete('/{user}',  [AdminUserController::class, 'destroy']);
    });

    // ✅ CRUD completo de métodos de pago (solo admin)
    Route::apiResource('payment-methods', PaymentMethodController::class)
        ->except(['index']);

    // ================== REPORTES ==================
    Route::prefix('reports')->group(function () {
        Route::get('/sales/monthly',    [ReportController::class, 'salesMonthly']);
        Route::get('/sales/by-seller',  [ReportController::class, 'salesBySeller']);
        Route::get('/sales/by-payment', [ReportController::class, 'salesByPayment']);
        Route::get('/expenses/monthly', [ReportController::class, 'expensesMonthly']);

        // ✅ Exportar reporte de ventas a PDF
        // Ejemplo: GET /api/reports/sales/export?year=2025&seller_id=1
        Route::get('/sales/export', [ReportController::class, 'exportSalesReport'])
             ->name('reports.sales.export');
    });
});
