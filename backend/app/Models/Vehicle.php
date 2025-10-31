<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Auth;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
    'brand','model','year','plate','vin','color','km','fuel_type',
    'ownership','customer_id','seller_id','reference_price','price','status',
    'check_spare','check_jack','check_docs','notes',
    'photo_front','photo_back','photo_left','photo_right',
    'photo_interior_front','photo_interior_back','photo_trunk',
    'sold_at',
];



    protected $casts = [
        'year'            => 'integer',
        'km'              => 'integer',
        'reference_price' => 'decimal:2',
        'price'           => 'decimal:2',
        'check_spare'     => 'boolean',
        'check_jack'      => 'boolean',
        'check_docs'      => 'boolean',
        'sold_at'         => 'datetime',
    ];

    // ================= RELACIONES =================
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function expenses()
    {
        return $this->hasMany(VehicleExpense::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    // ================= ATRIBUTOS COMPUTADOS =================
protected $appends = ['has_unpaid_expenses'];

public function getHasUnpaidExpensesAttribute(): bool
{
    try {
        return $this->expenses()
            ->where('status', 'no_pagado')
            ->exists();
    } catch (\Throwable $e) {
        \Log::error('Error calculando has_unpaid_expenses: ' . $e->getMessage());
        return false;
    }
}


    // ================= EVENTOS AUTOMÁTICOS =================
    protected static function booted()
    {
        static::updated(function (Vehicle $vehicle) {
            try {
                // Sólo actuar si cambió el status
                $oldStatus = $vehicle->getOriginal('status');
                $newStatus = $vehicle->status;
                if ($oldStatus === $newStatus) {
                    return;
                }

                // 🟢 Si el vehículo pasa a "vendido"
                if ($newStatus === 'vendido') {
                    // Asegurar seller y fecha de venta en vehicles
                    $updates = [];
                    if (empty($vehicle->seller_id)) {
                        $updates['seller_id'] = Auth::id() ?? 1;
                    }
                    if (empty($vehicle->sold_at)) {
                        $updates['sold_at'] = now();
                    }
                    if (!empty($updates)) {
                        // Evita recursión de eventos
                        $vehicle->fill($updates)->saveQuietly();
                    }

                    // Mantener tu lógica previa de sincronizar con reservas
                    $reservation = $vehicle->reservations()
                        ->whereIn('status', ['pendiente', 'reservado'])
                        ->latest('id')
                        ->first();

                    if ($reservation) {
                        $reservation->update(['status' => 'vendido']);
                    } else {
                        // Crea una reserva "venta directa" si no hay previa
                        $vehicle->reservations()->create([
                            'vehicle_id'        => $vehicle->id,
                            'customer_id'       => $vehicle->customer_id ?? 1,
                            'seller_id'         => $vehicle->seller_id ?? (Auth::id() ?? 1),
                            'price'             => $vehicle->price ?? 0,
                            'deposit'           => 0,
                            'payment_method'    => 'contado',
                            'workshop_expenses' => 0,
                            'comments'          => 'Venta directa generada automáticamente',
                            'status'            => 'vendido',
                            'date'              => now(),
                        ]);
                    }
                }

                // 🔄 Si vuelve a "disponible"
                if ($newStatus === 'disponible') {
                    // limpiar fecha de venta
                    if ($vehicle->sold_at !== null) {
                        $vehicle->forceFill(['sold_at' => null])->saveQuietly();
                    }

                    // anular última reserva vendida
                    $reservation = $vehicle->reservations()
                        ->where('status', 'vendido')
                        ->latest('id')
                        ->first();

                    if ($reservation) {
                        $reservation->update(['status' => 'anulada']);
                    }
                }

                // 🟡 Si queda en "reservado" no tocamos sold_at; corresponde a reserva en curso
            } catch (\Throwable $e) {
                \Log::error('Error en Vehicle::booted updated(): ' . $e->getMessage());
            }
        });
    }
}
