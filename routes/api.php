<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\Api\ReceptionController;
use Illuminate\Http\Request;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::post('/customers/register', [CustomerController::class, 'register']);

Route::get('/ping', fn () => response()->json(['pong' => true]));

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/receptions', [ReceptionController::class, 'store']);
    Route::get('/receptions',  [ReceptionController::class, 'index']);
});
