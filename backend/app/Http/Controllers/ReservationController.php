<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Events\ReservaCreada;

class ReservationController extends Controller
{
    // ================= LISTAR TODAS LAS RESERVAS =================
    public function index()
    {
        $reservations = Reservation::with([
                'vehicle', 'usedVehicle', 'customer', 'seller', 'payments.method',
            ])
            ->orderByDesc('created_at')
            ->get();

        // Si tenés un accessor 'profit', se calcula acá
        $reservations->each(function ($r) {
            $r->profit = $r->profit;
        });

        return response()->json(['data' => $reservations]);
    }

    // ================= FORMULARIO DE CREACIÓN =================
    public function create()
    {
        $vehicles = Vehicle::where('status', 'disponible')
            ->get(['id', 'brand', 'model', 'plate', 'price']);

        $customers = Customer::orderBy('last_name')
            ->get(['id', 'first_name', 'last_name']);

        $paymentMethods = PaymentMethod::orderBy('name')->get();

        return response()->json([
            'vehicles'      => $vehicles,
            'customers'     => $customers,
            'payment_methods' => $paymentMethods,
        ]);
    }

    // ================= GUARDAR NUEVA RESERVA =================
    public function store(Request $request)
    {
        // 1. Validaciones
        $data = $request->validate([
            'vehicle_id'      => 'required|exists:vehicles,id',
            'customer_id'     => 'required|exists:customers,id',
            'price'           => 'required|numeric|min:0',
            
            // --- NUEVOS CAMPOS TOMA DE USADO ---
            'used_vehicle_id'        => 'nullable|exists:vehicles,id',
            'used_vehicle_price'     => 'nullable|numeric|min:0', // <--- IMPORTANTE
            'used_vehicle_checklist' => 'nullable|string',
            // ------------------------------------

            // VALIDACIÓN DE SOCIOS (ARRAY)
            'partners'              => 'nullable|array',
            'partners.*.full_name'  => 'required_with:partners|string',
            'partners.*.dni'        => 'nullable|string',
            'partners.*.phone'      => 'nullable|string',
            'partners.*.photo'      => 'nullable|image|max:5120', 
        ]);

        return DB::transaction(function () use ($data, $request) {
            
            $paymentMethodsPayload = $request->payment_methods;
            if(isset($data['payment_methods'])) unset($data['payment_methods']);
            
            // Quitamos 'partners' de $data porque no es una columna de la tabla 'reservations'
            $partnersData = $request->partners ?? [];
            unset($data['partners']); 

            // A. Crear la reserva (Ahora incluye used_vehicle_price automáticamente si está en $data)
            $reservation = Reservation::create($data);

            // B. Crear los pagos (Tu lógica existente)
            if (is_array($paymentMethodsPayload)) {
                 // ... (Tu código de pagos aquí, asumo que lo tienes o usas el del request anterior) ...
            }

            // =======================================================
            // C. 🔥 LÓGICA DE SOCIOS 🔥
            // =======================================================
            if (!empty($partnersData)) {
                foreach ($partnersData as $index => $partner) {
                    
                    $photoPath = null;

                    if ($request->hasFile("partners.{$index}.photo")) {
                        $photoPath = $request->file("partners.{$index}.photo")
                                               ->store('partners', 'public');
                    }

                    $reservation->partners()->create([
                        'full_name'           => $partner['full_name'],
                        'dni'                 => $partner['dni'] ?? null,
                        'phone'               => $partner['phone'] ?? null,
                        'document_photo_path' => $photoPath, 
                    ]);
                }
            }

            // D. Retorno
            return response()->json([
                'message' => 'Reserva registrada correctamente ✅',
                'data' => [
                    ...$reservation->load([
                        'vehicle', 'customer', 'seller', 'payments.method', 'partners'
                    ])->toArray(),
                ]
            ], 201);
        });
    }

    // ================= MOSTRAR UNA RESERVA =================
    public function show(Reservation $reservation)
    {
        $reservation->load(['vehicle', 'usedVehicle', 'customer', 'seller', 'payments.method', 'partners']);
        
        $price   = (float) ($reservation->price ?? 0);
        $deposit = (float) ($reservation->deposit ?? 0);
        $credit  = (float) ($reservation->credit_bank ?? 0);
        
        // 🔥 CORRECCIÓN AQUÍ: Usamos el precio guardado en la reserva, no el del vehículo
        $trade   = (float) ($reservation->used_vehicle_price ?? 0);
        
        $paymentsTotal = $reservation->payments->sum('amount');
        $totalPaid = max($deposit, $paymentsTotal);
        
        if(isset($reservation->paid_amount) && $reservation->paid_amount > 0) {
             $totalPaid = $reservation->paid_amount;
        }

        $balance = $price - $totalPaid - $credit - $trade;

        $formatted = [
            'price_fmt'       => '$ ' . number_format($price, 2, ',', '.'),
            'deposit_fmt'     => '$ ' . number_format($deposit, 2, ',', '.'),
            'credit_bank_fmt' => '$ ' . number_format($credit, 2, ',', '.'),
            'trade_in_fmt'    => '$ ' . number_format($trade, 2, ',', '.'),
            'balance_fmt'     => '$ ' . number_format($balance, 2, ',', '.'),
            'profit_fmt'      => '$ ' . number_format($reservation->profit, 2, ',', '.'),
        ];

        // Actualizar saldo si difiere
        if (empty($reservation->balance) || abs($reservation->balance - $balance) > 0.01) {
            $reservation->updateQuietly(['balance' => $balance]);
        }

        return response()->json([
            'data' => [
                ...$reservation->toArray(),
                ...$formatted,
                'balance' => $balance,
            ],
        ]);
    }

    // ================= ACTUALIZAR RESERVA =================
    public function update(Request $request, Reservation $reservation)
    {
        $data = $request->validate([
            'vehicle_id'      => 'sometimes|exists:vehicles,id',
            'customer_id'     => 'sometimes|exists:customers,id',
            'price'           => 'sometimes|numeric|min:0',
            'deposit'         => 'nullable|numeric|min:0',
            'status'          => 'nullable|string',
            
            // 🔥 AGREGAMOS ESTO PARA PODER EDITAR LA TOMA
            'used_vehicle_id'        => 'nullable|exists:vehicles,id',
            'used_vehicle_price'     => 'nullable|numeric|min:0',
            'used_vehicle_checklist' => 'nullable|string',
        ]);

        $reservation->update($data);

        return response()->json([
            'message' => 'Reserva actualizada correctamente ✅',
            'data' => $reservation
        ]);
    }

    // ================= ELIMINAR RESERVA =================
    public function destroy(Reservation $reservation)
    {
        return DB::transaction(function() use ($reservation) {
            $vehicle = $reservation->vehicle;
            
            $reservation->payments()->delete();
            $reservation->partners()->delete(); // Limpiamos socios también
            $reservation->delete();

            if ($vehicle) {
                $vehicle->update(['status' => 'disponible']);
            }

            return response()->json(['message' => 'Reserva eliminada y vehículo liberado ✅']);
        });
    }

    // ================= CANCELAR / ANULAR =================
    public function cancel(Request $request, $id)
    {
        $reservation = Reservation::findOrFail($id);
        $refund = $request->input('refund', false); 

        return DB::transaction(function() use ($reservation, $refund) {
            
            if ($refund) {
                $reservation->payments()->delete(); 
                $reservation->deposit = 0;
            } 
            
            $reservation->status = 'anulada';
            $reservation->save();

            if ($reservation->vehicle) {
                $reservation->vehicle->status = 'disponible';
                $reservation->vehicle->save();
            }

            return response()->json(['message' => 'Reserva anulada correctamente']);
        });
    }

}