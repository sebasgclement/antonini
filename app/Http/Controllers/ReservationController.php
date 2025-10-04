<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    /**
     * Muestra el listado de reservas
     */
    public function index()
    {
        $reservations = Reservation::with(['vehicle', 'customer', 'seller', 'usedVehicle'])
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($reservations);
    }

    /**
     * Devuelve datos necesarios para armar el formulario (vehículos, clientes, vendedores)
     */
    public function create(Request $request)
{
    $vehicles = \App\Models\Vehicle::where('status', 'disponible')->get(['id', 'plate', 'brand', 'model']);
    $customers = \App\Models\Customer::orderBy('last_name')->get(['id', 'first_name', 'last_name']);
    $sellers = \App\Models\User::select('id', 'name')->get();

    return response()->json([
        'vehicles' => $vehicles,
        'customers' => $customers,
        'sellers' => $sellers,
        'logged_user' => $request->user(), // opcional: te da el vendedor actual
    ]);
}


    /**
     * Registra una nueva reserva
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id'       => 'required|exists:vehicles,id',
            'customer_id'      => 'required|exists:customers,id',
            'seller_id'        => 'required|exists:users,id',
            'used_vehicle_id'  => 'nullable|exists:vehicles,id',
            'price'            => 'required|numeric|min:0',
            'deposit'          => 'nullable|numeric|min:0',
            'payment_method'   => 'nullable|string|max:50',
            'payment_details'  => 'nullable|string',
            'comments'         => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Crear reserva
            $reservation = Reservation::create(array_merge($validated, [
                'date' => now(),
                'status' => 'pendiente',
                'seller_id' => $request->user()->id, // ← usuario autenticado (vendedor)
            ]));


            // Actualizar estado del vehículo
            $vehicle = Vehicle::find($validated['vehicle_id']);
            $vehicle->update(['status' => 'reservado']);

            DB::commit();

            return response()->json([
                'message' => 'Reserva creada correctamente.',
                'reservation' => $reservation->load(['vehicle', 'customer', 'seller']),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al crear la reserva.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Muestra una reserva específica
     */
    public function show($id)
    {
        $reservation = Reservation::with(['vehicle', 'customer', 'seller', 'usedVehicle'])->findOrFail($id);
        return response()->json($reservation);
    }

    /**
     * Actualiza una reserva existente
     */
    public function update(Request $request, $id)
    {
        $reservation = Reservation::findOrFail($id);

        $validated = $request->validate([
            'price'           => 'required|numeric|min:0',
            'deposit'         => 'nullable|numeric|min:0',
            'payment_method'  => 'nullable|string|max:50',
            'payment_details' => 'nullable|string',
            'comments'        => 'nullable|string',
            'status'          => 'required|in:pendiente,confirmada,anulada',
        ]);

        DB::beginTransaction();

        try {
            $reservation->update($validated);

            // Si se confirma la reserva, el vehículo pasa a "vendido"
            if ($validated['status'] === 'confirmada') {
                $reservation->vehicle->update(['status' => 'vendido']);
            }

            // Si se anula, vuelve a "disponible"
            if ($validated['status'] === 'anulada') {
                $reservation->vehicle->update(['status' => 'disponible']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Reserva actualizada correctamente.',
                'reservation' => $reservation->load(['vehicle', 'customer', 'seller']),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al actualizar la reserva.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Elimina una reserva
     */
    public function destroy($id)
    {
        $reservation = Reservation::findOrFail($id);

        DB::beginTransaction();

        try {
            // liberar vehículo si estaba reservado
            if ($reservation->status === 'pendiente') {
                $reservation->vehicle->update(['status' => 'disponible']);
            }

            $reservation->delete();
            DB::commit();

            return response()->json(['message' => 'Reserva eliminada correctamente.']);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al eliminar la reserva.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
