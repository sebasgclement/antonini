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
use Carbon\Carbon;

class CustomerController extends Controller
{
    // GET /api/customers
    public function index(Request $request)
    {
        if ($request->filled('dni')) {
            $dni = trim($request->query('dni'));
            $customer = Customer::with(['user', 'seller'])->where('doc_number', $dni)->first();

            return response()->json([
                'ok' => true,
                'data' => $customer ? [$customer] : []
            ]);
        }

        $term = (string) $request->query('search', '');

        $rows = Customer::query()
            ->with(['user', 'seller'])
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

        // El usuario que crea el registro (Creator)
        $user = auth()->user();
        $data['user_id'] = $user->id;

        // 👇 CORRECCIÓN AQUÍ 👇
        // Usamos el que viene del formulario. Si no viene nada, usamos el usuario logueado.
        $data['seller_id'] = $req->input('seller_id') ? $req->input('seller_id') : $user->id;
        
        // Siempre asignamos el bloqueo de 15 días al crear
        $data['locked_until'] = now()->addDays(15);
        // 👆 FIN CORRECCIÓN 👆

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
        $user = auth()->user();
        
        // 👇 CORRECCIÓN 1: Comparación segura de IDs (int)
        $isOwner = (int)$customer->seller_id === (int)$user->id;
        
        // 👇 CORRECCIÓN 2: Detectar si es Admin (ajusta según tu lógica de roles)
        // Asumo que role_id 1 es admin o role 'admin'
        $isAdmin = $user->role === 'admin' || $user->role_id === 1;

        // PROTECCIÓN: Si tiene dueño, NO soy yo, está bloqueado y NO soy admin -> Error
        if ($customer->seller_id && 
            !$isOwner && 
            !$isAdmin &&
            $customer->locked_until && 
            $customer->locked_until > now()) {
             return response()->json(['message' => 'Cliente bloqueado por otro vendedor.'], 403);
        }

        $data = $req->validated();

        // Manejo de imágenes
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
    // EVENTOS Y BLOQUEO (AQUÍ ESTABA EL ERROR)
    // ---------------------------------------------------

    public function getEvents($id)
    {
        $events = CustomerEvent::with('user')
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
            'is_schedule' => 'boolean'
        ]);

        $customer = Customer::findOrFail($id);
        $user = auth()->user();

        // 👇 LÓGICA DE PERMISOS CORREGIDA
        
        // 1. ¿Soy el dueño? (Forzamos a entero para evitar error 5 !== "5")
        $isOwner = (int)$customer->seller_id === (int)$user->id;

        // 2. ¿Soy Admin? (Permite saltarse el bloqueo)
        $isAdmin = $user->role === 'admin' || $user->role_id === 1;

        // 3. ¿El bloqueo está activo?
        $isLocked = $customer->locked_until && $customer->locked_until > now();

        // CONDICIÓN:
        // Si tiene dueño Y no soy yo Y no soy admin Y está bloqueado -> ERROR
        if ($customer->seller_id && !$isOwner && !$isAdmin && $isLocked) {
            return response()->json([
                'message' => 'Este cliente pertenece a ' . ($customer->seller->name ?? 'otro vendedor')
            ], 403);
        }

        // 4. GUARDAR EVENTO
        $event = new CustomerEvent();
        $event->customer_id = $id;
        $event->user_id = $user->id;
        $event->type = $request->type;
        $event->description = $request->description;
        $event->date = $request->date;
        $event->save();

        // 5. ACTUALIZAR PROPIEDAD
        // Si es "Agendar" O si el cliente estaba libre O vencido -> Me lo quedo (o renuevo)
        // NOTA: Si soy Admin y agendo, también me lo asigno a mi mismo o al dueño actual?
        // Por defecto aquí dejamos que si se agenda, se renueva la propiedad al usuario actual.
        
        $shouldAssign = $request->boolean('is_schedule') || is_null($customer->seller_id) || !$isLocked;

        if ($shouldAssign) {
            // Si soy admin, tal vez no quiero "robárselo" al vendedor solo por poner una nota.
            // Pero si es "Agendar" (Próximo paso), tiene sentido renovar.
            
            // Lógica: Asignar al usuario actual por 15 días
            $customer->update([
                'seller_id' => $user->id,
                'locked_until' => now()->addDays(15)
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

    // GET /api/my-agenda
    public function myAgenda()
    {
        $userId = auth()->id();

        $events = CustomerEvent::with('customer') // Traemos al cliente para mostrar el nombre
            ->where('user_id', $userId)
            // Solo eventos futuros o de hoy
            ->whereDate('date', '>=', now()) 
            // Ordenados por fecha (el más próximo primero)
            ->orderBy('date', 'asc') 
            // Traemos solo los próximos 5 para no saturar el dashboard
            ->take(5) 
            ->get();

        return response()->json($events);
    }
}