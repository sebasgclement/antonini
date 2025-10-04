<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleExpense;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * 📅 Ventas por mes (filtrable por año, vendedor o rango de fechas)
     */
    public function salesMonthly(Request $req)
    {
        $query = Reservation::query()
            ->select(
                DB::raw('YEAR(date) as year'),
                DB::raw('MONTH(date) as month'),
                DB::raw('COUNT(*) as cantidad'),
                DB::raw('SUM(price) as total'),
                DB::raw('SUM(price - COALESCE((SELECT v.price FROM vehicles v WHERE v.id = used_vehicle_id), 0) - COALESCE(workshop_expenses, 0)) as ganancia')
            )
            ->where('status', 'confirmada');

        // 🔹 Filtros opcionales
        if ($req->filled('seller_id')) {
            $query->where('seller_id', $req->seller_id);
        }

        if ($req->filled('start_date') && $req->filled('end_date')) {
            $query->whereBetween(DB::raw('DATE(date)'), [$req->start_date, $req->end_date]);
        } elseif ($req->filled('year')) {
            $query->whereYear('date', $req->year);
        } else {
            $query->whereYear('date', date('Y'));
        }

        $ventas = $query
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month')
            ->get();

        return response()->json(['ok' => true, 'data' => $ventas]);
    }

    /**
     * 👤 Ventas por vendedor
     */
    public function salesBySeller(Request $req)
    {
        $query = Reservation::query()
            ->select(
                'users.name as vendedor',
                DB::raw('COUNT(reservations.id) as cantidad'),
                DB::raw('SUM(reservations.price) as total'),
                DB::raw('SUM(reservations.price - COALESCE((SELECT v.price FROM vehicles v WHERE v.id = used_vehicle_id), 0) - COALESCE(reservations.workshop_expenses, 0)) as ganancia')
            )
            ->join('users', 'reservations.seller_id', '=', 'users.id')
            ->where('reservations.status', 'confirmada');

        // 🔹 Rango de fechas
        if ($req->filled('start_date') && $req->filled('end_date')) {
            $query->whereBetween(DB::raw('DATE(reservations.date)'), [$req->start_date, $req->end_date]);
        }

        // 🔹 Año opcional
        if ($req->filled('year')) {
            $query->whereYear('reservations.date', $req->year);
        }

        $ventas = $query
            ->groupBy('users.name')
            ->orderByDesc('ganancia')
            ->get();

        return response()->json(['ok' => true, 'data' => $ventas]);
    }

    /**
     * 💳 Ventas por forma de pago
     */
    public function salesByPayment(Request $req)
    {
        $query = Reservation::query()
            ->select(
                'payment_method',
                DB::raw('COUNT(*) as cantidad'),
                DB::raw('SUM(price) as total'),
                DB::raw('SUM(price - COALESCE((SELECT v.price FROM vehicles v WHERE v.id = used_vehicle_id), 0) - COALESCE(workshop_expenses, 0)) as ganancia')
            )
            ->where('status', 'confirmada');

        // 🔹 Filtros opcionales
        if ($req->filled('start_date') && $req->filled('end_date')) {
            $query->whereBetween(DB::raw('DATE(date)'), [$req->start_date, $req->end_date]);
        }
        if ($req->filled('seller_id')) {
            $query->where('seller_id', $req->seller_id);
        }

        $pagos = $query
            ->groupBy('payment_method')
            ->orderByDesc('total')
            ->get();

        return response()->json(['ok' => true, 'data' => $pagos]);
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

    public function exportSalesReport(Request $req)
{
    $year = $req->year ?? date('Y');
    $sellerId = $req->seller_id;
    $startDate = $req->start_date;
    $endDate = $req->end_date;

    // 🔎 Filtramos las reservas confirmadas (ventas reales)
    $query = Reservation::with(['vehicle', 'customer', 'seller'])
        ->where('status', 'confirmada')
        ->whereYear('date', $year);

    if ($sellerId) {
        $query->where('seller_id', $sellerId);
    }

    if ($startDate) {
        $query->whereDate('date', '>=', $startDate);
    }

    if ($endDate) {
        $query->whereDate('date', '<=', $endDate);
    }

    $reservas = $query->orderBy('date', 'asc')->get();

    // Calcular totales
    $totalVentas = $reservas->sum('price');
    $totalGanancia = $reservas->sum(fn($r) => $r->profit);

    // Generar PDF con la vista Blade
    $pdf = Pdf::loadView('reports.sales', [
        'reservas' => $reservas,
        'year' => $year,
        'totalVentas' => $totalVentas,
        'totalGanancia' => $totalGanancia,
        'seller' => $reservas->first()?->seller?->name ?? 'Todos los vendedores',
    ])->setPaper('a4', 'portrait');

    // Descargar el archivo
    $filename = "reporte_ventas_{$year}.pdf";
    return $pdf->download($filename);
}
}
