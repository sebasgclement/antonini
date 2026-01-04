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
use Illuminate\Support\Facades\DB;
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

        $user = auth()->user();
        $data['user_id'] = $user->id;
        $data['seller_id'] = $req->input('seller_id') ? $req->input('seller_id') : $user->id;
        $data['locked_until'] = now()->addDays(15);

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
        $isOwner = (int)$customer->seller_id === (int)$user->id;
        $isAdmin = $user->role === 'admin' || $user->role_id === 1;

        if ($customer->seller_id && !$isOwner && !$isAdmin && $customer->locked_until && $customer->locked_until > now()) {
             return response()->json(['message' => 'Cliente bloqueado por otro vendedor.'], 403);
        }

        $data = $req->validated();

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
        if (Reservation::where('customer_id', $customer->id)->exists() || Vehicle::where('customer_id', $customer->id)->exists()) {
            return response()->json(['ok' => false, 'message' => 'El cliente tiene operaciones o vehículos vinculados.'], 409);
        }

        if ($customer->dni_front) Storage::disk('public')->delete($customer->dni_front);
        if ($customer->dni_back) Storage::disk('public')->delete($customer->dni_back);

        $customer->delete();
        return response()->json(['ok' => true]);
    }

    // ---------------------------------------------------
    // GESTIÓN DE EVENTOS, AGENDA Y JERARQUÍA
    // ---------------------------------------------------

    public function getEvents($id)
{
    // Pedimos explícitamente el parent_id para que no haya dudas
    $events = CustomerEvent::with(['user'])
                ->where('customer_id', $id)
                ->select('id', 'customer_id', 'user_id', 'parent_id', 'type', 'description', 'date', 'is_schedule')
                ->orderBy('created_at', 'asc')
                ->get();
                
    return response()->json($events);
}

    /**
     * Registro de Eventos con Jerarquía (Presente + Futuro)
     */
    public function storeEvent(Request $request, $id)
{
    // Cambiamos la validación: description solo es obligatoria si NO hay parent_id
    $request->validate([
        'type'               => 'required|string',
        'date'               => 'required|date',
        'description'        => $request->filled('parent_id') ? 'nullable|string' : 'required|string',
        'agenda_description' => 'nullable|string',
        'agenda_date'        => 'nullable|date',
        'parent_id'          => 'nullable|integer', // Agregamos este campo a la validación
    ]);

    $customer = Customer::findOrFail($id);
    $user = auth()->user();

    // ... (Tu lógica de permisos y bloqueos se mantiene igual) ...
    $isOwner = (int)$customer->seller_id === (int)$user->id;
    $isAdmin = $user->role === 'admin' || $user->role_id === 1;
    $isLocked = $customer->locked_until && $customer->locked_until > now();

    if ($customer->seller_id && !$isOwner && !$isAdmin && $isLocked) {
        return response()->json([
            'message' => 'Este cliente pertenece a ' . ($customer->seller->name ?? 'otro vendedor')
        ], 403);
    }

    try {
        $result = DB::transaction(function () use ($request, $customer, $user) {
            
            // CASO A: Estamos agregando una agenda a una visita que YA EXISTE
            if ($request->filled('parent_id')) {
                $event = CustomerEvent::create([
                    'customer_id' => $customer->id,
                    'user_id'     => $user->id,
                    'parent_id'   => $request->parent_id, // Colgamos de la visita original
                    'type'        => 'agenda',
                    'description' => $request->agenda_description,
                    'date'        => $request->agenda_date,
                    'is_schedule' => true
                ]);
            } 
            // CASO B: Es una visita nueva (lo que ya tenías)
            else {
                $event = CustomerEvent::create([
                    'customer_id' => $customer->id,
                    'user_id'     => $user->id,
                    'parent_id'   => null,
                    'type'        => $request->type,
                    'description' => $request->description,
                    'date'        => $request->date,
                    'is_schedule' => false
                ]);

                if ($request->filled('agenda_description')) {
                    CustomerEvent::create([
                        'customer_id' => $customer->id,
                        'user_id'     => $user->id,
                        'parent_id'   => $event->id,
                        'type'        => 'agenda',
                        'description' => $request->agenda_description,
                        'date'        => $request->agenda_date,
                        'is_schedule' => true
                    ]);
                }
            }

            // Renovar propiedad del cliente
            $customer->update([
                'seller_id'    => $user->id,
                'locked_until' => now()->addDays(15)
            ]);

            return $event->load('user');
        });

        return response()->json([
            'ok' => true,
            'message' => 'Operación realizada con éxito', 
            'data' => $result
        ]);

    } catch (\Exception $e) {
        return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
    }
}

    public function myAgenda()
    {
        $userId = auth()->id();

        $events = CustomerEvent::with(['customer', 'parent']) 
            ->where('user_id', $userId)
            ->where('is_schedule', true)
            ->where('completed', false)
            ->orderBy('date', 'asc') 
            ->get();

        return response()->json($events);
    }

    
public function myAgendaCount()
{
    $userId = auth()->id();
    $hoy = now()->toDateString();

    // Contamos todo lo pendiente hasta el día de hoy
    $total = CustomerEvent::where('user_id', $userId)
        ->where('is_schedule', true)
        ->whereDate('date', '<=', $hoy)
        ->where('completed', false)
        // ->where('completed', false) // Si tenés un campo para marcar como hecho, agregalo acá
        ->count();

    // Contamos específicamente lo que es de antes de hoy
    $atrasados = CustomerEvent::where('user_id', $userId)
        ->where('is_schedule', true)
        ->where('completed', false)
        ->whereDate('date', '<', $hoy)
        ->count();

    return response()->json([
        'count' => $total,
        'atrasados' => $atrasados
    ]);
}
public function toggleEvent($id)
    {
        $event = CustomerEvent::findOrFail($id);
        
        // Seguridad: Solo el dueño puede completarlo
        if ($event->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Invertimos el valor (si era false pasa a true, y viceversa)
        $event->completed = !$event->completed;
        $event->save();

        return response()->json([
            'message' => 'Estado actualizado', 
            'completed' => $event->completed
        ]);
    }
}