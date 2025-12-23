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
    // GET /api/customers
    public function index(Request $request)
    {
        // 🔹 Búsqueda directa por DNI
        if ($request->filled('dni')) {
            $dni = trim($request->query('dni'));
            $customer = Customer::with(['user', 'seller'])->where('doc_number', $dni)->first();

            return response()->json([
                'ok' => true,
                'data' => $customer ? [$customer] : []
            ]);
        }

        // 🔹 Búsqueda general
        $term = (string) $request->query('search', '');

        $rows = Customer::query()
            ->with(['user', 'seller']) // Traemos creador y vendedor actual
            ->when($term, function ($q) use ($term) {
                $q->where(function ($qq) use ($term) {
                    $qq->where('first_name', 'like', "%$term%")
                        ->orWhere('last_name', 'like', "%$term%")
                        ->orWhere('email', 'like', "%$term%")
                        ->orWhere('doc_number', 'like', "%$term%")
                        ->orWhere('cuit', 'like', "%$term%")
                        ->orWhere('phone', 'like', "%$term%");
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

        if ($req->hasFile('dni_front')) {
            $data['dni_front'] = $req->file('dni_front')->store('dni', 'public');
        }
        if ($req->hasFile('dni_back')) {
            $data['dni_back'] = $req->file('dni_back')->store('dni', 'public');
        }

        // El que lo crea queda registrado como creador (user_id)
        $data['user_id'] = auth()->id() ?? 1;
        
        // OPCIONAL: ¿El que lo crea se lo asigna automáticamente?
        // Si querés que al crear ya sea "propiedad" del vendedor, descomenta esto:
        // $data['seller_id'] = auth()->id();
        // $data['locked_until'] = now()->addDays(15);

        $c = Customer::create($data);

        return response()->json(['ok' => true, 'data' => $c], 201);
    }

    // GET /api/customers/{id}
    public function show(Customer $customer)
    {
        $customer->load(['user', 'seller']);

        $customer->dni_front_url = $customer->dni_front ? asset('storage/' . $customer->dni_front) : null;
        $customer->dni_back_url  = $customer->dni_back  ? asset('storage/' . $customer->dni_back)  : null;

        return response()->json(['ok' => true, 'data' => $customer]);
    }

    // PUT /api/customers/{id}
    public function update(CustomerUpdateRequest $req, Customer $customer)
    {
        // 🛡️ PROTECCIÓN: Si el cliente es de otro y está bloqueado, no podés editar sus datos
        $user = auth()->user();
        if ($customer->seller_id && 
            $customer->seller_id !== $user->id && 
            $customer->locked_until && 
            $customer->locked_until > now()) {
             return response()->json(['message' => 'Cliente bloqueado por otro vendedor.'], 403);
        }

        $data = $req->validated();

        // Manejo de imágenes (borrar/subir)
        if ($req->has('delete_dni_front')) {
            if ($customer->dni_front) Storage::disk('public')->delete($customer->dni_front);
            $customer->dni_front = null;
        }
        if ($req->has('delete_dni_back')) {
            if ($customer->dni_back) Storage::disk('public')->delete($customer->dni_back);
            $customer->dni_back = null;
        }
        if ($req->hasFile('dni_front')) {
            if ($customer->dni_front) Storage::disk('public')->delete($customer->dni_front);
            $data['dni_front'] = $req->file('dni_front')->store('dni', 'public');
        }
        if ($req->hasFile('dni_back')) {
            if ($customer->dni_back) Storage::disk('public')->delete($customer->dni_back);
            $data['dni_back'] = $req->file('dni_back')->store('dni', 'public');
        }

        $customer->update($data);

        return response()->json(['ok' => true, 'data' => $customer]);
    }

    // DELETE /api/customers/{id}
    public function destroy(Customer $customer)
    {
        if (Reservation::where('customer_id', $customer->id)->exists()) {
            return response()->json(['ok' => false, 'message' => 'Tiene operaciones registradas.'], 409);
        }
        if (Vehicle::where('customer_id', $customer->id)->exists()) {
            return response()->json(['ok' => false, 'message' => 'Tiene vehículos en stock.'], 409);
        }

        if ($customer->dni_front) Storage::disk('public')->delete($customer->dni_front);
        if ($customer->dni_back) Storage::disk('public')->delete($customer->dni_back);

        $customer->delete();
        return response()->json(['ok' => true]);
    }

    // ---------------------------------------------------
    // EVENTOS Y BLOQUEO (LA PARTE IMPORTANTE)
    // ---------------------------------------------------

    public function getEvents($id)
    {
        $events = CustomerEvent::with('user') // Traer nombre del que hizo la nota
                    ->where('customer_id', $id)
                    ->orderBy('created_at', 'desc')
                    ->get();
        return response()->json($events);
    }

    public function storeEvent(Request $request, $id)
    {
        $request->validate([
            'type' => 'required|string',
            'description' => 'required|string',
            'date' => 'required|date',
            'is_schedule' => 'boolean' // True si es "Agendar"
        ]);

        $customer = Customer::findOrFail($id);
        $user = auth()->user();

        // 1. VALIDAR BLOQUEO
        if ($customer->seller_id && 
            $customer->seller_id !== $user->id && 
            $customer->locked_until && 
            $customer->locked_until > now()) 
        {
            return response()->json([
                'message' => 'Este cliente pertenece a ' . ($customer->seller->name ?? 'otro vendedor')
            ], 403);
        }

        // 2. GUARDAR EVENTO
        $event = new CustomerEvent();
        $event->customer_id = $id;
        $event->user_id = $user->id;
        $event->type = $request->type;
        $event->description = $request->description;
        $event->date = $request->date;
        $event->save();

        // 3. APLICAR LÓGICA DE PROPIEDAD
        // Si es "Agendar" (is_schedule = true) -> Bloqueo fuerte por 15 días
        if ($request->boolean('is_schedule')) {
            $customer->update([
                'seller_id' => $user->id,
                'locked_until' => now()->addDays(15)
            ]);
        }
        // Si el cliente estaba libre -> Se lo asigna (aunque sea nota simple)
        elseif (is_null($customer->seller_id) || ($customer->locked_until && $customer->locked_until < now())) {
            $customer->update([
                'seller_id' => $user->id,
                'locked_until' => now()->addDays(15) // Opcional: ¿Nota simple también bloquea? Acá puse que sí.
            ]);
        }

        $event->load('user');

        return response()->json([
            'message' => 'Registrado correctamente', 
            'data' => $event,
            'customer_status' => [
                'seller_id' => $customer->seller_id,
                'locked_until' => $customer->locked_until
            ]
        ]);
    }
}