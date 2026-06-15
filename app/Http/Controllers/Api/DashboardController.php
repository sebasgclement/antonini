<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\ServiceOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'reservas_pendientes' => Reservation::where('status', 'pendiente')->count(),
            'vehiculos_disponibles' => Vehicle::where('status', 'disponible')->count(),
            'clientes_total' => Customer::count(),
            'ordenes_abiertas' => ServiceOrder::whereIn('status', ['pending', 'in_progress'])->count(),
        ]);
    }

    public function getDolar()
    {
        // Opción A: Valor fijo por ahora para que no de error
        // return response()->json(['blue' => 1200, 'oficial' => 980]);

        // Opción B: Consumir una API real (ej: DolarAPI)
        try {
            $response = Http::get('https://dolarapi.com/v1/dolares/blue');
            if ($response->successful()) {
                return response()->json($response->json());
            }
        } catch (\Exception $e) {
            // Fallo silencioso
        }

        return response()->json(['compra' => 1200, 'venta' => 1220]);
    }
}