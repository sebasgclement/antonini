<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Services\CurrentAccountService;
use App\Services\VehicleStatusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReservationController extends Controller
{
    public function __construct(
        private VehicleStatusService $statusService,
        private CurrentAccountService $ccService,
    ) {}

    // ================= LISTAR TODAS LAS RESERVAS =================
    public function index()
    {
        $reservations = Reservation::with([
                'vehicle', 'usedVehicle', 'customer', 'seller', 'payments.method',
            ])
            ->orderByDesc('created_at')
            ->get();

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

    // ================= CONTEO DE RESERVAS PENDIENTES =================
    public function pendingCount()
    {
        $count = Reservation::where('status', 'pendiente')->count();
        return response()->json(['count' => $count]);
    }

    // ================= GUARDAR NUEVA RESERVA (Lógica Financiera Corregida) =================
    public function store(Request $request)
    {
        // 1. Validaciones
        $data = $request->validate([
            'vehicle_id'      => 'required|exists:vehicles,id',
            'customer_id'     => 'required|exists:customers,id',
            'price'           => 'required|numeric|min:0',
            'deposit'         => 'nullable|numeric|min:0',
            'currency'        => 'nullable|string|in:ARS,USD',
            'exchange_rate'   => 'nullable|numeric|min:0',
            'transfer_cost'   => 'nullable|numeric|min:0',
            'administrative_cost' => 'nullable|numeric|min:0',
            'date'            => 'nullable|date',

            // Validaciones de Permuta
            'used_vehicle_id'        => 'nullable|exists:vehicles,id|different:vehicle_id',
            'used_vehicle_price'     => 'nullable|numeric|min:0',
            'used_vehicle_checklist' => 'nullable|string',

            // Validaciones de Partners
            'partners'              => 'nullable|array',
            'partners.*.full_name'  => 'required_with:partners|string',
            'partners.*.dni'        => 'nullable|string',
            'partners.*.phone'      => 'nullable|string',
            'partners.*.photo'      => 'nullable|image|max:5120',
        ]);

        try {
            return DB::transaction(function () use ($data, $request) {
                
                // --- A. Limpieza de datos auxiliares ---
                $paymentMethodsPayload = $request->payment_methods;
                if(isset($data['payment_methods'])) unset($data['payment_methods']);
                
                $partnersData = $request->partners ?? [];
                unset($data['partners']); 

                // --- B. Asignar Vendedor y Fecha ---
                $data['seller_id'] = Auth::id();
                $data['date']      = $data['date'] ?? now();

                // --- C. CÁLCULO FINANCIERO OBLIGATORIO (Backend) ---
                $price        = floatval($data['price']);
                $deposit      = floatval($data['deposit'] ?? 0);
                $tradeIn      = floatval($data['used_vehicle_price'] ?? 0);
                $creditBank   = floatval($data['credit_bank'] ?? 0);
                $transferCost = floatval($data['transfer_cost'] ?? 0);
                $adminCost    = floatval($data['administrative_cost'] ?? 0);
                $currency     = $data['currency'] ?? 'ARS';
                $exchangeRate = max(1, floatval($data['exchange_rate'] ?? 1));

                if ($currency === 'USD') {
                    $priceARS = $price * $exchangeRate;
                    $tradeARS = $tradeIn * $exchangeRate;
                } else {
                    $priceARS = $price;
                    $tradeARS = $tradeIn;
                }

                // Fórmula completa: (Precio + Transferencia + Admin) - Seña - Permuta - Crédito
                $calculatedBalance = ($priceARS + $transferCost + $adminCost) - $deposit - $tradeARS - $creditBank;

                $data['balance']   = $calculatedBalance;
                $data['price_ars'] = $priceARS; // Precio congelado en ARS al tipo de cambio del momento

                // Definimos estado inicial — nunca cerrar si el precio es 0
                if ($priceARS <= 0 || $calculatedBalance > 0) {
                    $data['status'] = 'pendiente';
                } else {
                    $data['status'] = 'confirmada';
                }

                // --- D. Crear la Reserva ---
                $reservation = Reservation::create($data);

                // --- D2. Sincronizar Cuenta Corriente ---
                $reservation->load(['vehicle', 'usedVehicle']);
                $this->ccService->onReservationCreated($reservation);

                // --- E. Sincronizar estado del vehículo vía servicio ---
                $vehicle = Vehicle::find($data['vehicle_id']);
                if ($vehicle) {
                    match ($reservation->status) {
                        'pendiente'  => $this->statusService->reserve($vehicle),
                        'confirmada' => $this->statusService->onConfirmed($vehicle),
                        default      => null,
                    };
                }

                // --- F. Guardar Socios ---
                if (!empty($partnersData)) {
                    $reservation->partners()->createMany($partnersData);
                }

                return response()->json([
                    'message' => 'Reserva registrada correctamente ✅',
                    'data' => [
                        ...$reservation->load(['vehicle', 'customer', 'seller', 'payments.method', 'partners'])->toArray(),
                    ]
                ], 201);
            });

        } catch (\Exception $e) {
            Log::error("Error al crear reserva: " . $e->getMessage());
            return response()->json([
                'message' => 'Ocurrió un error al guardar la reserva.',
                'error_detail' => $e->getMessage()
            ], 500);
        }
    }

    // ================= MOSTRAR UNA RESERVA =================
    public function show(Reservation $reservation)
    {
        $reservation->load(['vehicle', 'usedVehicle', 'customer', 'seller', 'payments.method', 'partners']);
        
        $price    = (float) ($reservation->price ?? 0);
        $transfer = (float) ($reservation->transfer_cost ?? 0);
        $admin    = (float) ($reservation->administrative_cost ?? 0);
        $deposit  = (float) ($reservation->deposit ?? 0);
        $credit   = (float) ($reservation->credit_bank ?? 0);
        $trade    = (float) ($reservation->used_vehicle_price ?? 0);

        // Usar price_ars (congelado al tipo de cambio de la operación)
        $priceARS       = (float) ($reservation->price_ars ?? $price);
        $totalOperation = $priceARS + $transfer + $admin;
        $paymentsTotal  = $reservation->payments->sum('amount_ars');
        $totalPaid      = $deposit + $paymentsTotal;

        $balance = $totalOperation - $totalPaid - $credit - $trade;

        // Siempre sincronizar el balance guardado con el calculado en tiempo real
        if ((float) $reservation->balance !== $balance) {
            $reservation->updateQuietly(['balance' => $balance]);
        }

        return response()->json([
            'data' => [
                ...$reservation->toArray(),
                'balance' => $balance, // Enviamos el calculado al momento
            ],
        ]);
    }

    // ================= ACTUALIZAR RESERVA =================
    public function update(Request $request, Reservation $reservation)
    {
        $data = $request->validate([
            'vehicle_id'          => 'sometimes|exists:vehicles,id',
            'customer_id'         => 'sometimes|exists:customers,id',
            'price'               => 'sometimes|numeric|min:0',
            'deposit'             => 'nullable|numeric|min:0',
            'credit_bank'         => 'nullable|numeric|min:0',
            'transfer_cost'       => 'nullable|numeric|min:0',
            'administrative_cost' => 'nullable|numeric|min:0',
            'workshop_expenses'   => 'nullable|numeric|min:0',
            'payment_method'      => 'nullable|string',
            'payment_details'     => 'nullable|string',
            'comments'            => 'nullable|string',
            'status'              => 'nullable|string|in:pendiente,reservado,confirmada,vendido,anulada',
            'used_vehicle_id'        => 'nullable|exists:vehicles,id',
            'used_vehicle_price'     => 'nullable|numeric|min:0',
            'used_vehicle_checklist' => 'nullable|string',
            'currency'            => 'nullable|string|in:ARS,USD',
            'exchange_rate'       => 'nullable|numeric|min:0',
            'second_buyer_name'   => 'nullable|string',
            'second_buyer_dni'    => 'nullable|string',
            'second_buyer_phone'  => 'nullable|string',
        ]);

        // 1. Validar conflicto de vehículos
        $finalVehicleId = $request->has('vehicle_id') ? $request->vehicle_id : $reservation->vehicle_id;
        $finalUsedId    = $request->has('used_vehicle_id') ? $request->used_vehicle_id : $reservation->used_vehicle_id;

        if ($finalUsedId && $finalUsedId == $finalVehicleId) {
            return response()->json([
                'message' => 'Conflicto de vehículos.',
                'errors'  => ['used_vehicle_id' => ['No podés entregar el mismo vehículo que comprás.']]
            ], 422);
        }

        try {
            // --- REAJUSTE DE SALDO Y PRECIO EN ARS ---
            $balanceFields = ['price', 'deposit', 'credit_bank', 'transfer_cost', 'administrative_cost', 'used_vehicle_price', 'currency', 'exchange_rate'];
            if (collect($balanceFields)->some(fn($f) => $request->has($f))) {
                $newPrice    = floatval($data['price']               ?? $reservation->price);
                $newCurrency = $data['currency']                     ?? $reservation->currency ?? 'ARS';
                $newRate     = max(1, floatval($data['exchange_rate'] ?? $reservation->exchange_rate ?? 1));
                $newDeposit  = floatval($data['deposit']             ?? $reservation->deposit);
                $newCredit   = floatval($data['credit_bank']         ?? $reservation->credit_bank);
                $newTransfer = floatval($data['transfer_cost']       ?? $reservation->transfer_cost);
                $newAdmin    = floatval($data['administrative_cost'] ?? $reservation->administrative_cost);
                $newTrade    = floatval($data['used_vehicle_price']  ?? $reservation->used_vehicle_price);
                $paidSoFar   = floatval($reservation->payments()->sum('amount_ars'));

                $newPriceARS = $newCurrency === 'USD' ? $newPrice * $newRate : $newPrice;

                $data['price_ars'] = $newPriceARS;
                $data['balance']   = ($newPriceARS + $newTransfer + $newAdmin)
                                   - $newDeposit - $newTrade - $newCredit - $paidSoFar;
            }

            // Separar status del resto para manejar la transición vía servicio
            $newStatus = $data['status'] ?? null;
            $oldStatus = $reservation->status;
            unset($data['status']);

            $reservation->update($data);

            // Recalcular entrada de CC de la toma si el valor cambió
            if ($request->has('used_vehicle_price')) {
                $this->ccService->onTradeInUpdated($reservation->fresh());
            }

            // Sincronizar estado del vehículo si el status cambió
            if ($newStatus && $newStatus !== $oldStatus) {
                $reservation->updateQuietly(['status' => $newStatus]);
                $vehicle = $reservation->vehicle;
                if ($vehicle) {
                    match ($newStatus) {
                        'confirmada', 'vendido' => $this->statusService->onConfirmed($vehicle),
                        'anulada'               => $this->statusService->onCancelled($vehicle),
                        'pendiente', 'reservado' => $this->statusService->reserve($vehicle),
                        default                 => null,
                    };
                }
            }

            return response()->json([
                'message' => 'Reserva actualizada correctamente ✅',
                'data'    => $reservation->fresh()->load(['vehicle', 'customer', 'seller', 'payments.method']),
            ]);

        } catch (\Exception $e) {
            Log::error("Error update reserva: " . $e->getMessage());
            return response()->json(['message' => 'Error al actualizar', 'error' => $e->getMessage()], 500);
        }
    }

    // ================= ELIMINAR RESERVA =================
    public function destroy(Reservation $reservation)
    {
        return DB::transaction(function () use ($reservation) {
            $vehicle = $reservation->vehicle;

            // Limpiar CC antes de eliminar pagos
            $this->ccService->onReservationCancelled($reservation);

            $reservation->payments()->delete();
            $reservation->partners()->delete();
            $reservation->delete();

            if ($vehicle) {
                $this->statusService->onCancelled($vehicle);
            }

            return response()->json(['message' => 'Reserva eliminada y vehículo liberado ✅']);
        });
    }

    // ================= CANCELAR / ANULAR =================
    public function cancel(Request $request, $id)
    {
        $reservation = Reservation::findOrFail($id);

        return DB::transaction(function () use ($reservation, $request) {
            // Limpiar CC antes de eliminar pagos
            $this->ccService->onReservationCancelled($reservation);

            if ($request->boolean('refund')) {
                $reservation->payments()->delete();
                $reservation->updateQuietly(['deposit' => 0]);
            }

            $reservation->updateQuietly(['status' => 'anulada', 'balance' => 0]);

            if ($reservation->vehicle) {
                $this->statusService->onCancelled($reservation->vehicle);
            }

            return response()->json(['message' => 'Reserva anulada correctamente']);
        });
    }
}