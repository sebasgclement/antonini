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
use App\Http\Controllers\ServiceOrderController;

// Controladores Contabilidad
use App\Http\Controllers\Accounting\EntryController;
use App\Http\Controllers\Accounting\AccountingAccountController;
use App\Http\Controllers\Accounting\BusinessUnitController;
use App\Http\Controllers\ImportController;

// Controladores API Generales
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VehicleExpenseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\ReservationPaymentController;
use App\Http\Controllers\Api\DashboardController;

// Controladores y Modelos de Catálogo (Productos y Proveedores)
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProviderController;
use App\Http\Controllers\PriceListController;
use App\Models\Province;
use App\Models\TaxResponsibility;
use App\Models\Iva;

//Controladores de facturación
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\CurrentAccountController;
use App\Http\Controllers\Api\MailController;
use App\Http\Controllers\InsuranceController;


// ================== 1. RUTAS PÚBLICAS ==================
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/ping', fn () => response()->json(['pong' => true]));

// ================== 2. ZONA AUTENTICADA GENERAL ==================
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout',          [AuthController::class, 'logout']);
    Route::get ('/auth/me',              [AuthController::class, 'me']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);

    Route::get('/infoauto/brands', [InfoAutoController::class, 'getBrands']);
    Route::get('/infoauto/brands/{brandId}/groups', [InfoAutoController::class, 'getGroups']);
    Route::get('/infoauto/brands/{brandId}/groups/{groupId}/models', [InfoAutoController::class, 'getModels']);
    Route::get('/infoauto/price/{codia}', [InfoAutoController::class, 'getPrice']);

    Route::get('/dolar',           [DashboardController::class, 'getDolar']); 
    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);

    Route::get('/customers/workshop', [CustomerController::class, 'workshopCustomers']);
    Route::apiResource('customers', CustomerController::class);
    Route::post('/customers/{id}/events', [CustomerController::class, 'storeEvent']);
    Route::get('/customers/{id}/events',  [CustomerController::class, 'getEvents']);
    Route::get('/my-agenda/count',        [CustomerController::class, 'myAgendaCount']);
    Route::get('/my-agenda',              [CustomerController::class, 'myAgenda']);
    Route::post('/events/{id}/toggle',    [CustomerController::class, 'toggleEvent']);

    Route::apiResource('vehicles', VehicleController::class);
    Route::get('/brands',          [VehicleBrandController::class, 'index']);
    
    Route::get   ('/vehicles/{vehicle}/expenses',           [VehicleExpenseController::class, 'index']);
    Route::post  ('/vehicles/{vehicle}/expenses',           [VehicleExpenseController::class, 'store']);
    Route::put   ('/vehicles/{vehicle}/expenses/{expense}', [VehicleExpenseController::class, 'update']);
    Route::delete('/vehicles/{vehicle}/expenses/{expense}', [VehicleExpenseController::class, 'destroy']);

    Route::apiResource('reservations', ReservationController::class);
    Route::post('/reservations/{id}/cancel', [ReservationController::class, 'cancel']);
    Route::get('/reservas/pendientes/count', [ReservationController::class, 'pendingCount']);
    Route::apiResource('reservation-payments', ReservationPaymentController::class);

    Route::get('/dashboard/stats', [DashboardController::class, 'index']);

    Route::post('/invoices', [InvoiceController::class, 'store']);

    // Cuenta Corriente
    Route::get('/customers/{id}/current-account', [CurrentAccountController::class, 'index']);
    Route::post('/customers/{id}/current-account/pay', [CurrentAccountController::class, 'storePayment']);
    Route::post('/customers/{id}/current-account/charge', [CurrentAccountController::class, 'storeConcept']);
    Route::delete('/customers/{id}/current-account/{movementId}', [CurrentAccountController::class, 'destroy']);

    //Orden de servicio
    Route::apiResource('service-orders', ServiceOrderController::class);

    // Siniestros / CC Aseguradoras
    Route::get   ('/insurance/siniestros',                                  [InsuranceController::class, 'siniestros']);
    Route::get   ('/insurance/overdue-count',                               [InsuranceController::class, 'overdueCount']);
    Route::get   ('/insurers',                                              [InsuranceController::class, 'insurers']);
    Route::post  ('/insurers',                                              [InsuranceController::class, 'storeInsurer']);
    Route::post  ('/service-orders/{order}/insurance-payments',             [InsuranceController::class, 'storePayment']);
    Route::delete('/service-orders/{order}/insurance-payments/{payment}',   [InsuranceController::class, 'deletePayment']);

    // Correo
    Route::get   ('/mail/inbox',            [MailController::class, 'inbox']);
    Route::get   ('/mail/{uid}',            [MailController::class, 'show']);
    Route::post  ('/mail/send',             [MailController::class, 'send']);
    Route::put   ('/mail/config',           [MailController::class, 'saveConfig']);
    Route::delete('/mail/{uid}',            [MailController::class, 'deleteMessage']);
});


// ================== 3. ZONA EXCLUSIVA ADMIN ==================
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::apiResource('users', AdminUserController::class);
    Route::apiResource('roles', RoleController::class);
    Route::get('/roles-list', [AdminUserController::class, 'roles']);

    Route::prefix('reports')->group(function () {
        Route::get('/sales/monthly',    [ReportController::class, 'salesMonthly']);
        Route::get('/sales/by-seller',  [ReportController::class, 'salesBySeller']);
        Route::get('/sales/by-payment', [ReportController::class, 'salesByPayment']);
        Route::get('/expenses/monthly', [ReportController::class, 'expensesMonthly']);
        Route::get('/sales/export',     [ReportController::class, 'exportSalesReport'])->name('reports.sales.export');
        Route::get('/stock',            [ReportController::class, 'stock']);
    });

    Route::apiResource('payment-methods', PaymentMethodController::class)->except(['index']);
});

// ================== 4. ZONA CONTABLE (Accounting) ==================
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('accounting')->group(function () {
    
    // ✅ PLAN DE CUENTAS
    Route::get('/accounts', [AccountingAccountController::class, 'index']);
    Route::post('/accounts', [AccountingAccountController::class, 'store']);
    Route::put('/accounts/{id}', [AccountingAccountController::class, 'update']);

    // ✅ ASIENTOS
    Route::get('/entries', [EntryController::class, 'index']); 
    Route::post('/entries', [EntryController::class, 'store']);

    // ✅ UNIDADES DE NEGOCIO
    Route::get('/business-units', [BusinessUnitController::class, 'index']);
    Route::post('/business-units', [BusinessUnitController::class, 'store']);
});

// ================== 5. ZONA CATÁLOGO (Productos y Proveedores) ==================

// 🟢 LECTURA GENERAL
Route::middleware('auth:sanctum')->group(function () {
    
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/business-units', [BusinessUnitController::class, 'index']);
    Route::get('/provinces', fn () => response()->json(Province::all()));
    Route::get('/tax-responsibilities', fn () => response()->json(TaxResponsibility::all()));
    Route::get('/ivas', fn () => response()->json(Iva::all()));
});

// 🔴 ADMINISTRACIÓN ESTRICTA
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    
    // Creación, edición y archivado de productos
    Route::post('/products', [ProductController::class, 'store']); 
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Proveedores completos (solo admin)
    Route::get('/providers', [ProviderController::class, 'index']);
    Route::post('/providers', [ProviderController::class, 'store']);

    //Carga de lista de precios
    Route::post('/importar-lista', [ImportController::class, 'import']);
    Route::get('/price-lists', [PriceListController::class, 'index']);
    Route::post('/price-lists', [PriceListController::class, 'store']);

    
});
Route::get('/app/login', function() { return response()->json(['error' => 'Unauthenticated', 'message' => 'Por favor, inicia sesión desde el frontend.'], 401); })->name('login');
