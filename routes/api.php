<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Controladores Principales
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\VehicleBrandController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\InfoAutoController;
use App\Http\Controllers\Accounting\EntryController; // ✅ Importado correctamente

// Controladores API
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VehicleExpenseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\ReservationPaymentController;
use App\Http\Controllers\Api\DashboardController;

// Modelos
use App\Models\Reservation;
use App\Models\AccountingAccount;

// ================== 1. RUTAS PÚBLICAS ==================
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/ping', fn () => response()->json(['pong' => true]));

// ================== 2. ZONA AUTENTICADA GENERAL (Vendedores, Admin, Contables) ==================
Route::middleware('auth:sanctum')->group(function () {

    // ✅ AUTH
    Route::post('/auth/logout',          [AuthController::class, 'logout']);
    Route::get ('/auth/me',              [AuthController::class, 'me']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);

    // ✅ INFO AUTO
    Route::get('/infoauto/brands', [InfoAutoController::class, 'getBrands']);
    Route::get('/infoauto/brands/{brandId}/groups', [InfoAutoController::class, 'getGroups']);
    Route::get('/infoauto/brands/{brandId}/groups/{groupId}/models', [InfoAutoController::class, 'getModels']);
    Route::get('/infoauto/price/{codia}', [InfoAutoController::class, 'getPrice']);

    // ✅ DASHBOARD / GRAL
    Route::get('/dolar',           [DashboardController::class, 'getDolar']); 
    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);

    // ✅ CLIENTES
    Route::apiResource('customers', CustomerController::class);
    Route::post('/customers/{id}/events', [CustomerController::class, 'storeEvent']);
    Route::get('/customers/{id}/events',  [CustomerController::class, 'getEvents']);

    // ✅ VEHÍCULOS e INVENTARIO
    Route::apiResource('vehicles', VehicleController::class);
    Route::get('/brands',          [VehicleBrandController::class, 'index']);
    
    // ✅ GASTOS
    Route::get   ('/vehicles/{vehicle}/expenses',           [VehicleExpenseController::class, 'index']);
    Route::post  ('/vehicles/{vehicle}/expenses',           [VehicleExpenseController::class, 'store']);
    Route::delete('/vehicles/{vehicle}/expenses/{expense}', [VehicleExpenseController::class, 'destroy']);

    // ✅ RESERVAS Y PAGOS
    Route::apiResource('reservations', ReservationController::class);
    Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);
    Route::apiResource('reservation-payments', ReservationPaymentController::class);

    Route::get('/dashboard/stats', [DashboardController::class, 'index']);
}); 

// ================== 3. ZONA EXCLUSIVA ADMIN (Solo Rol: admin) ==================
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {

    // ✅ USUARIOS Y ROLES
    Route::apiResource('users', AdminUserController::class);
    Route::apiResource('roles', RoleController::class);
    Route::get('/roles-list', [AdminUserController::class, 'roles']);

    // ✅ REPORTES
    Route::prefix('reports')->group(function () {
        Route::get('/sales/monthly',    [ReportController::class, 'salesMonthly']);
        Route::get('/sales/by-seller',  [ReportController::class, 'salesBySeller']);
        Route::get('/expenses/monthly', [ReportController::class, 'expensesMonthly']);
        Route::get('/sales/export',     [ReportController::class, 'exportSalesReport'])->name('reports.sales.export');
    });

    // ✅ CONFIGURACIÓN EXTRA
    Route::apiResource('payment-methods', PaymentMethodController::class)->except(['index']);
});

// ================== 4. ZONA CONTABLE (Solo Rol: admin_contable) ==================
Route::middleware(['auth:sanctum'])->prefix('accounting')->group(function () {
    
    // ✅ CREAR ASIENTO
    // URL: POST /api/accounting/entries
    Route::post('/entries', [EntryController::class, 'store']);

    // ✅ OBTENER PLAN DE CUENTAS (Para el select de React)
    // URL: GET /api/accounting/accounts
    Route::get('/accounts', function() {
        return AccountingAccount::where('is_selectable', true)
            ->orderBy('code', 'asc')
            ->get();
    });
});