<?php

// app/Http/Controllers/Api/ReportController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // Ventas por mes (vehículos vendidos)
    public function salesMonthly(Request $req)
    {
        $year = $req->year ?? date('Y');

        $ventas = Vehicle::select(
                DB::raw('MONTH(updated_at) as mes'),
                DB::raw('COUNT(*) as cantidad'),
                DB::raw('SUM(price) as total')
            )
            ->where('status','vendido')
            ->whereYear('updated_at',$year)
            ->groupBy(DB::raw('MONTH(updated_at)'))
            ->orderBy('mes')
            ->get();

        return response()->json(['ok'=>true,'data'=>$ventas]);
    }

    // Gastos por mes
    public function expensesMonthly(Request $req)
    {
        $year = $req->year ?? date('Y');

        $gastos = VehicleExpense::select(
                DB::raw('MONTH(date) as mes'),
                DB::raw('SUM(amount) as total')
            )
            ->whereYear('date',$year)
            ->groupBy(DB::raw('MONTH(date)'))
            ->orderBy('mes')
            ->get();

        return response()->json(['ok'=>true,'data'=>$gastos]);
    }
}
