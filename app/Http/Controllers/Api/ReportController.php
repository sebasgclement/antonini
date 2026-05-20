<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * 📅 Ventas por mes (basadas en vehículos vendidos)
     */
    public function salesMonthly(Request $req)
    {
        try {
            $query = Vehicle::query()
                ->selectRaw('YEAR(COALESCE(sold_at, updated_at)) as year')
                ->selectRaw('MONTH(COALESCE(sold_at, updated_at)) as month')
                ->selectRaw('COUNT(*) as cantidad')
                ->selectRaw('SUM(price) as total')
                ->selectRaw('SUM(price - COALESCE(reference_price, 0)) as ganancia')
                ->where('status', 'vendido');

            // 🔹 Filtros opcionales
            if ($req->filled('seller_id')) {
                $query->where('seller_id', $req->seller_id);
            }

            if ($req->filled('start_date') && $req->filled('end_date')) {
                $query->whereBetween(DB::raw('DATE(COALESCE(sold_at, updated_at))'), [$req->start_date, $req->end_date]);
            } elseif ($req->filled('year')) {
                $query->whereYear(DB::raw('COALESCE(sold_at, updated_at)'), $req->year);
            } else {
                $query->whereYear(DB::raw('COALESCE(sold_at, updated_at)'), date('Y'));
            }

            $ventas = $query
                ->groupByRaw('YEAR(COALESCE(sold_at, updated_at)), MONTH(COALESCE(sold_at, updated_at))')
                ->orderByRaw('YEAR(COALESCE(sold_at, updated_at)) desc, MONTH(COALESCE(sold_at, updated_at))')
                ->get();

            return response()->json(['ok' => true, 'data' => $ventas]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 👤 Ventas por vendedor (usando seller_id del vehículo)
     */
    public function salesBySeller(Request $req)
    {
        $query = DB::table('vehicles')
            ->join('users', 'vehicles.seller_id', '=', 'users.id')
            ->select(
                'users.name as vendedor',
                DB::raw('COUNT(vehicles.id) as cantidad'),
                DB::raw('SUM(vehicles.price) as total'),
                DB::raw('SUM(vehicles.price - COALESCE(vehicles.reference_price,0)) as ganancia')
            )
            ->where('vehicles.status', 'vendido');

        if ($req->filled('start_date') && $req->filled('end_date')) {
            $query->whereBetween(DB::raw('DATE(vehicles.sold_at)'), [$req->start_date, $req->end_date]);
        }

        if ($req->filled('year')) {
            $query->whereYear('vehicles.sold_at', $req->year);
        } else {
            $query->whereYear('vehicles.sold_at', date('Y'));
        }

        $ventas = $query
            ->groupBy('users.name')
            ->orderByDesc('ganancia')
            ->get();

        return response()->json(['ok' => true, 'data' => $ventas]);
    }

    /**
     * 💳 Ventas por forma de pago (si hubo reserva asociada)
     */
    public function salesByPayment(Request $req)
    {
        $query = DB::table('vehicles')
            ->leftJoin('reservations', 'vehicles.id', '=', 'reservations.vehicle_id')
            ->select(
                'reservations.payment_method',
                DB::raw('COUNT(vehicles.id) as cantidad'),
                DB::raw('SUM(vehicles.price) as total'),
                DB::raw('SUM(vehicles.price - COALESCE(vehicles.reference_price,0)) as ganancia')
            )
            ->where('vehicles.status', 'vendido');

        if ($req->filled('start_date') && $req->filled('end_date')) {
            $query->whereBetween(DB::raw('DATE(vehicles.sold_at)'), [$req->start_date, $req->end_date]);
        }

        if ($req->filled('seller_id')) {
            $query->where('vehicles.seller_id', $req->seller_id);
        }

        $pagos = $query
            ->groupBy('reservations.payment_method')
            ->orderByDesc('total')
            ->get();

        return response()->json(['ok' => true, 'data' => $pagos]);
    }

    /**
     * 🚗 Distribución del stock por estado
     */
    public function stock()
    {
        $counts = Vehicle::query()
            ->whereNotNull('status')
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json(['ok' => true, 'data' => $counts]);
    }

    /**
     * 🧾 Gastos de taller por mes
     */
    public function expensesMonthly(Request $req)
    {
        $query = VehicleExpense::select(
            DB::raw('MONTH(date) as mes'),
            DB::raw('SUM(amount) as total')
        );

        if ($req->filled('year')) {
            $query->whereYear('date', $req->year);
        } else {
            $query->whereYear('date', date('Y'));
        }

        $gastos = $query
            ->groupBy(DB::raw('MONTH(date)'))
            ->orderBy('mes')
            ->get();

        return response()->json(['ok' => true, 'data' => $gastos]);
    }

    /**
     * 🧾 Exportar reporte de ventas a PDF (basado en vehículos vendidos)
     */
    public function exportSalesReport(Request $req)
    {
        $year = $req->year ?? date('Y');
        $startDate = $req->start_date;
        $endDate = $req->end_date;

        $query = Vehicle::with('customer')
            ->where('status', 'vendido')
            ->whereYear(DB::raw('COALESCE(sold_at, updated_at)'), $year);

        if ($startDate) {
            $query->where(DB::raw('DATE(COALESCE(sold_at, updated_at))'), '>=', $startDate);
        }

        if ($endDate) {
            $query->where(DB::raw('DATE(COALESCE(sold_at, updated_at))'), '<=', $endDate);
        }

        $vehiculos = $query->orderBy('sold_at', 'asc')->get();

        $totalVentas = $vehiculos->sum('price');
        $totalGanancia = $vehiculos->sum(fn($v) => $v->price - ($v->reference_price ?? 0));

        $pdf = Pdf::loadView('reports.sales', [
            'vehiculos' => $vehiculos,
            'year' => $year,
            'totalVentas' => $totalVentas,
            'totalGanancia' => $totalGanancia,
            'seller' => '—',
        ])->setPaper('a4', 'landscape');

        return $pdf->download("reporte_ventas_{$year}.pdf");
    }
}
