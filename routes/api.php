<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// Controladores Principales
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\VehicleBrandController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\RoleController; // Added RoleController import

// Controladores API (Namespace Api)
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VehicleExpenseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\ReservationPaymentController;
use App\Http\Controllers\Api\DashboardController;

// Modelos
use App\Models\Reservation; 

// ================== RUTAS PÚBLICAS ==================
Route::post('/auth/login',  [AuthController::class, 'login']);
Route::get('/ping', fn () => response()->json(['pong' => true]));


// ================== ZONA AUTENTICADA (Vendedores + Admin) ==================
Route::middleware('auth:sanctum')->group(function () {

    // ✅ AUTH
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get ('/auth/me',     [AuthController::class, 'me']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);

    // ✅ DASHBOARD / GRAL
    Route::get('/dolar', [DashboardController::class, 'getDolar']); 
    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);

    // ✅ NOTIFICACIONES (Contador para el Sidebar)
    // Usamos closure directo para rapidez, como tenías en local
    Route::get('/reservas/pendientes/count', function () {
        $count = Reservation::where('status', 'pendiente')->count();
        return response()->json(['count' => $count]);
    });

    // ✅ CONTADOR AGENDA (Solo eventos de HOY para el usuario actual)
    Route::get('/my-agenda/count', function () {
        $count = \App\Models\CustomerEvent::where('user_id', auth()->id())
            ->whereDate('date', \Carbon\Carbon::today())
            ->count();
        return response()->json(['count' => $count]);
    });

    // ✅ AGENDA USERS
    Route::get('/my-agenda', [CustomerController::class, 'myAgenda']);

    // ✅ CLIENTES
    Route::apiResource('customers', CustomerController::class);
    Route::post('/customers/{id}/events', [CustomerController::class, 'storeEvent']);
    Route::get('/customers/{id}/events', [CustomerController::class, 'getEvents']);

    // ✅ VEHÍCULOS
    Route::apiResource('vehicles', VehicleController::class);
    
    // ✅ MARCAS
    Route::get('/brands', [VehicleBrandController::class, 'index']);
    Route::post('/brands', [VehicleBrandController::class, 'store']);
    Route::put('/brands/{brand}', [VehicleBrandController::class, 'update']);
    Route::delete('/brands/{brand}', [VehicleBrandController::class, 'destroy']);

    // ✅ GASTOS
    Route::get   ('/vehicles/{vehicle}/expenses',           [VehicleExpenseController::class, 'index']);
    Route::post  ('/vehicles/{vehicle}/expenses',           [VehicleExpenseController::class, 'store']);
    Route::delete('/vehicles/{vehicle}/expenses/{expense}', [VehicleExpenseController::class, 'destroy']);

    // ✅ RESERVAS
    Route::get('/reservations/create', [ReservationController::class, 'create']);
    Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);
    Route::apiResource('reservations', ReservationController::class);

    // ✅ PAGOS DE RESERVAS
    Route::get   ('/reservation-payments',              [ReservationPaymentController::class, 'index']);
    Route::post  ('/reservation-payments',              [ReservationPaymentController::class, 'store']);
    Route::put   ('/reservation-payments/{payment}',    [ReservationPaymentController::class, 'update']);
    Route::delete('/reservation-payments/{payment}',    [ReservationPaymentController::class, 'destroy']);
    
    // ✅ DASHBOARD STATS (Agregado para que no de error el Home)
    Route::get('/dashboard/stats', [DashboardController::class, 'index']);

}); 


// ================== ZONA ADMIN (Solo Rol Admin) ==================
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {

    // ✅ USUARIOS
    Route::prefix('admin/users')->group(function () {
        Route::get   ('/',        [AdminUserController::class, 'index']);
        Route::post  ('/',        [AdminUserController::class, 'store']);
        Route::get   ('/{user}',  [AdminUserController::class, 'show']);
        Route::put   ('/{user}',  [AdminUserController::class, 'update']);
        Route::delete('/{user}',  [AdminUserController::class, 'destroy']);
    });

    // ✅ ROLES
    Route::prefix('admin/roles')->group(function () {
        Route::get   ('/',          [RoleController::class, 'index']);
        Route::post  ('/',          [RoleController::class, 'store']);
        Route::get   ('/{role}',    [RoleController::class, 'show']);
        Route::put   ('/{role}',    [RoleController::class, 'update']);
        Route::delete('/{role}',    [RoleController::class, 'destroy']);
    });
    Route::get('/admin/roles-list', [AdminUserController::class, 'roles']);

    // ✅ CONFIGURACIÓN (Payment Methods CRUD)
    Route::apiResource('payment-methods', PaymentMethodController::class)->except(['index']);

    // ✅ REPORTES
    Route::prefix('reports')->group(function () {
        Route::get('/sales/monthly',    [ReportController::class, 'salesMonthly']);
        Route::get('/sales/by-seller',  [ReportController::class, 'salesBySeller']);
        Route::get('/sales/by-payment', [ReportController::class, 'salesByPayment']);
        Route::get('/expenses/monthly', [ReportController::class, 'expensesMonthly']);
        Route::get('/sales/export',     [ReportController::class, 'exportSalesReport'])->name('reports.sales.export');
    });

});