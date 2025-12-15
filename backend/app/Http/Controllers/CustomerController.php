<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerEvent;
use App\Models\Reservation;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use App\Http\Requests\CustomerStoreRequest;
use App\Http\Requests\CustomerUpdateRequest;
use Illuminate\Support\Facades\Storage;

class CustomerController extends Controller
{
    // GET /api/customers?search=&page=  o /api/customers?dni=12345678
    public function index(Request $request)
    {
        // 🔹 Búsqueda directa por DNI
        if ($request->filled('dni')) {
            $dni = trim($request->query('dni'));
            // Agregamos ->with('user') para saber quién lo cargó
            $customer = Customer::with('user')->where('doc_number', $dni)->first();

            return response()->json([
                'ok' => true,
                'data' => $customer ? [$customer] : []
            ]);
        }

        // 🔹 Búsqueda general
        $term = (string) $request->query('search', '');

        $rows = Customer::query()
            ->with('user') // 👈 IMPORTANTE: Trae los datos del vendedor
            ->when($term, function ($q) use ($term) {
                $q->where(function ($qq) use ($term) {
                    $qq->where('first_name', 'like', "%$term%")
                        ->orWhere('last_name', 'like', "%$term%")
                        ->orWhere('email', 'like', "%$term%")
                        ->orWhere('doc_number', 'like', "%$term%")
                        ->orWhere('cuit', 'like', "%$term%")
                        ->orWhere('phone', 'like', "%$term%")
                        ->orWhere('alt_phone', 'like', "%$term%")
                        ->orWhere('city', 'like', "%$term%");
                });
            })
            ->latest()
            ->paginate(10);

        return response()->json(['ok' => true, 'data' => $rows]);
    }

    // POST /api/customers
    public function store(CustomerStoreRequest $req)
    {
        $data = $req->validated();

        // 🖼️ Guardar archivos si existen
        if ($req->hasFile('dni_front')) {
            $data['dni_front'] = $req->file('dni_front')->store('dni', 'public');
        }
        if ($req->hasFile('dni_back')) {
            $data['dni_back'] = $req->file('dni_back')->store('dni', 'public');
        }

        // ✍️ Asignar vendedor actual (quién carga al cliente)
        $data['user_id'] = auth()->id() ?? 1;

        $c = Customer::create($data);

        return response()->json(['ok' => true, 'data' => $c], 201);
    }

    // GET /api/customers/{id}
    public function show(Customer $customer)
    {
        // Cargar relación con usuario para mostrar "Vendedor: Juan"
        $customer->load('user');

        // 🔹 Incluir URLs absolutas de las imágenes
        $customer->dni_front_url = $customer->dni_front ? asset('storage/' . $customer->dni_front) : null;
        $customer->dni_back_url  = $customer->dni_back  ? asset('storage/' . $customer->dni_back)  : null;

        return response()->json(['ok' => true, 'data' => $customer]);
    }

    // PUT /api/customers/{id}
    public function update(CustomerUpdateRequest $req, Customer $customer)
    {
        $data = $req->validated();

        // 🗑️ Eliminar imágenes si se pidió
        if ($req->has('delete_dni_front')) {
            Storage::disk('public')->delete($customer->dni_front);
            $customer->dni_front = null;
        }
        if ($req->has('delete_dni_back')) {
            Storage::disk('public')->delete($customer->dni_back);
            $customer->dni_back = null;
        }

        // 🖼️ Subir nuevas imágenes si se enviaron
        if ($req->hasFile('dni_front')) {
            // eliminar la anterior si existe
            if ($customer->dni_front) {
                Storage::disk('public')->delete($customer->dni_front);
            }
            $data['dni_front'] = $req->file('dni_front')->store('dni', 'public');
        }

        if ($req->hasFile('dni_back')) {
            if ($customer->dni_back) {
                Storage::disk('public')->delete($customer->dni_back);
            }
            $data['dni_back'] = $req->file('dni_back')->store('dni', 'public');
        }

        $customer->update($data);

        return response()->json(['ok' => true, 'data' => $customer]);
    }

    // DELETE /api/customers/{id}
    public function destroy(Customer $customer)
    {
        // 🛡️ REGLA 1: Verificar si tiene Reservas (Compras)
        if (Reservation::where('customer_id', $customer->id)->exists()) {
            return response()->json([
                'ok' => false,
                'message' => 'No se puede eliminar: El cliente tiene operaciones (reservas/ventas) registradas.'
            ], 409); // 409 = Conflicto
        }

        // 🛡️ REGLA 2: Verificar si es dueño de Vehículos (Consignaciones)
        // Buscamos autos donde él sea el 'customer_id' (dueño consignante)
        if (Vehicle::where('customer_id', $customer->id)->exists()) {
            return response()->json([
                'ok' => false,
                'message' => 'No se puede eliminar: El cliente tiene vehículos asignados en stock.'
            ], 409);
        }

        // --- Si pasó los filtros, procedemos a borrar ---

        // 🧹 Eliminar imágenes asociadas
        if ($customer->dni_front) {
            Storage::disk('public')->delete($customer->dni_front);
        }
        if ($customer->dni_back) {
            Storage::disk('public')->delete($customer->dni_back);
        }

        $customer->delete();

        return response()->json(['ok' => true]);
    }

    // ---------------------------------------------------
    // EVENTOS / AGENDA
    // ---------------------------------------------------

    // GET /api/customers/{id}/events
    public function getEvents($id)
    {
        $events = CustomerEvent::where('customer_id', $id)
                    ->orderBy('created_at', 'desc')
                    ->get();

        return response()->json($events);
    }

    // POST /api/customers/{id}/events
    public function storeEvent(Request $request, $id)
    {
        $data = $request->validate([
            'type' => 'required|string',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $event = new CustomerEvent();
        $event->customer_id = $id;
        $event->type = $data['type'];
        $event->description = $data['description'];
        $event->date = $data['date'];
        
        // Asignamos el usuario actual (o 1 si no hay auth)
        $event->user_id = auth()->id() ?? 1;
        
        $event->save();

        return response()->json(['message' => 'Evento guardado', 'data' => $event]);
    }
}