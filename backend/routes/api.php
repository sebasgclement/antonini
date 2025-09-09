<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\Api\ReceptionController;
use Illuminate\Http\Request;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    // CRUD
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);

    
    Route::post('/customers/register', [CustomerController::class, 'store']);
});

Route::get('/ping', fn () => response()->json(['pong' => true]));

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/receptions', [ReceptionController::class, 'store']);
    Route::get('/receptions',  [ReceptionController::class, 'index']);
});
