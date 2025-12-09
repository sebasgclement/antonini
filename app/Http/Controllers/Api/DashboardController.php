<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DolarService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function getDolar(DolarService $service)
    {
        return response()->json($service->getBlue());
    }
}