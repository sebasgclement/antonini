<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VehicleController extends Controller
{
    // ======================= INDEX =======================
    public function index(Request $request)
    {
        $search = trim($request->input('search'));
        
        // 1. Iniciamos la consulta cargando la relación del cliente (dueño)
        $query = Vehicle::with(['customer']); 

        // 2. 🛡️ FILTRO HISTÓRICOS:
        // Si NO estoy pidiendo explícitamente ver "historial" o "vendidos",
        // entonces ocultamos los vendidos para no saturar la lista.
        if ($request->input('status') !== 'vendido' && !$request->has('show_history')) {
            $query->where('status', '!=', 'vendido');
        }

        // 3. Lógica del Buscador
        if ($search) {
            $query->where(function($q) use ($search) {
                // A. Busca por datos del auto
                $q->where('plate', 'like', "%$search%")
                  ->orWhere('brand', 'like', "%$search%")
                  ->orWhere('model', 'like', "%$search%")
                  ->orWhere('vin', 'like', "%$search%")
                  
                  // B. 🔥 MAGIA: Busca dentro de la tabla relacionada 'customers' (Dueño)
                  ->orWhereHas('customer', function($qCustomer) use ($search) {
                      $qCustomer->where('first_name', 'like', "%$search%")
                                ->orWhere('last_name', 'like', "%$search%")
                                ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%$search%"]);
                  });
            });
        }

        // Ordenamos: primero los disponibles, luego los más nuevos
        $vehicles = $query->orderByRaw("FIELD(status, 'disponible', 'reservado', 'ofrecido', 'vendido')")
                          ->latest()
                          ->paginate(20);

        return response()->json($vehicles);
    }

    // ======================= SHOW =======================
    public function show(Vehicle $vehicle)
    {
        $sides = ['front', 'back', 'left', 'right', 'interior_front', 'interior_back', 'trunk'];

        foreach ($sides as $side) {
            $key = "photo_{$side}";
            $vehicle->{$key . '_url'} = $vehicle->{$key}
                ? asset('storage/' . $vehicle->{$key})
                : null;
        }

        return response()->json([
            'ok' => true,
            'data' => $vehicle->load('customer', 'expenses'),
        ]);
    }

    // ======================= STORE =======================
    public function store(Request $req)
    {
        $data = $req->validate([
            'brand' => 'required|string',
            'model' => 'required|string',
            'year' => 'nullable|integer',
            'plate' => 'required|string|unique:vehicles,plate',
            'vin' => 'nullable|string',
            'color' => 'nullable|string',
            'km' => 'nullable|integer',
            'fuel_type' => 'nullable|string|max:50',
            'ownership' => 'required|in:propio,consignado',
            'customer_id' => 'nullable|exists:customers,id',
            'reference_price' => 'nullable|numeric',
            'take_price' => 'nullable|numeric',
            'price' => 'nullable|numeric',
            'status' => 'in:disponible,reservado,vendido,ofrecido',
            'check_spare' => 'boolean',
            'check_jack' => 'boolean',
            'check_tools'    => 'boolean',
            'check_docs' => 'boolean',
            'check_key_copy' => 'boolean', // 🆕 duplicado llave
            'check_manual'   => 'boolean', // 🆕 manual
            'notes' => 'nullable|string',

            // 📸 Validaciones nuevas
            'photo_front' => 'nullable|image|max:4096',
            'photo_back' => 'nullable|image|max:4096',
            'photo_left' => 'nullable|image|max:4096',
            'photo_right' => 'nullable|image|max:4096',
            'photo_interior_front' => 'nullable|image|max:4096',
            'photo_interior_back'  => 'nullable|image|max:4096',
            'photo_trunk'          => 'nullable|image|max:4096',
        ]);

        // 📸 Guardar fotos si las hay
        foreach ([
            'front', 'back', 'left', 'right',
            'interior_front', 'interior_back', 'trunk'
        ] as $side) {
            $key = "photo_{$side}";
            if ($req->hasFile($key)) {
                $data[$key] = $req->file($key)->store('vehicles', 'public');
            }
        }

        $vehicle = Vehicle::create($data);

        return response()->json([
            'ok' => true,
            'data' => $vehicle->load('customer'),
        ], 201);
    }

    // ======================= UPDATE =======================
    public function update(Request $req, Vehicle $vehicle)
    {
        $data = $req->validate([
            'brand' => 'sometimes|string',
            'model' => 'sometimes|string',
            'year' => 'nullable|integer',
            'plate' => 'sometimes|string|unique:vehicles,plate,' . $vehicle->id,
            'vin' => 'nullable|string',
            'color' => 'nullable|string',
            'km' => 'nullable|integer',
            'fuel_type' => 'nullable|string|max:50',
            'ownership' => 'in:propio,consignado',
            'customer_id' => 'nullable|exists:customers,id',
            'reference_price' => 'nullable|numeric',
            'take_price' => 'nullable|numeric',
            'price' => 'nullable|numeric',
            'status' => 'in:disponible,reservado,vendido,ofrecido',
            'check_spare' => 'boolean',
            'check_jack' => 'boolean',
            'check_tools'    => 'boolean',
            'check_docs' => 'boolean',
            'check_key_copy' => 'boolean', // 🆕 duplicado llave
            'check_manual'   => 'boolean', // 🆕 manual
            'notes' => 'nullable|string',

            // 📸 Validaciones nuevas
            'photo_front' => 'nullable|image|max:4096',
            'photo_back' => 'nullable|image|max:4096',
            'photo_left' => 'nullable|image|max:4096',
            'photo_right' => 'nullable|image|max:4096',
            'photo_interior_front' => 'nullable|image|max:4096',
            'photo_interior_back'  => 'nullable|image|max:4096',
            'photo_trunk'          => 'nullable|image|max:4096',
        ]);

        // 📸 Manejo seguro de imágenes
        foreach ([
            'front', 'back', 'left', 'right',
            'interior_front', 'interior_back', 'trunk'
        ] as $side) {
            $key = "photo_{$side}";

            // Eliminar si se pide
            if ($req->has("delete_photo_{$side}")) {
                if (!empty($vehicle->{$key})) {
                    Storage::disk('public')->delete($vehicle->{$key});
                }
                $vehicle->{$key} = null;
            }

            // Subir nueva si se incluye
            if ($req->hasFile($key)) {
                if (!empty($vehicle->{$key})) {
                    Storage::disk('public')->delete($vehicle->{$key});
                }
                $data[$key] = $req->file($key)->store('vehicles', 'public');
            }
        }

        // 🔹 Si el vehículo se marca como "disponible", eliminar reserva asociada
        if (isset($data['status']) && $data['status'] === 'disponible') {
            Reservation::where('vehicle_id', $vehicle->id)->delete();
        }

        // 🚫 Si intentan venderlo mientras tiene una reserva, bloquear
        if (isset($data['status']) && $data['status'] === 'vendido') {
            $hasReservation = Reservation::where('vehicle_id', $vehicle->id)->exists();
            if ($hasReservation) {
                return response()->json([
                    'ok' => false,
                    'message' => 'No se puede marcar como vendido: el vehículo tiene una reserva activa.',
                ], 422);
            }
        }

        $vehicle->update($data);

        return response()->json([
            'ok' => true,
            'data' => $vehicle->load('customer', 'expenses'),
        ]);
    }

    // ======================= DESTROY =======================
    public function destroy(Vehicle $vehicle)
    {
        // 🧹 Eliminar fotos si existen
        foreach ([
            'front', 'back', 'left', 'right',
            'interior_front', 'interior_back', 'trunk'
        ] as $side) {
            $key = "photo_{$side}";
            if (!empty($vehicle->{$key})) {
                Storage::disk('public')->delete($vehicle->{$key});
            }
        }

        $vehicle->delete();

        return response()->json(['ok' => true]);
    }
}
