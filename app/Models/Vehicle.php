<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'brand','model','year','plate','vin','color','km','fuel_type',
        'ownership','customer_id','seller_id','reference_price', 'take_price', 'price','status',
        'check_spare','check_jack', 'check_tools', 'check_docs', 'check_key_copy', 'check_manual', 'notes',
        'photo_front','photo_back','photo_left','photo_right',
        'photo_interior_front','photo_interior_back','photo_trunk',
        'sold_at',
    ];

    protected $casts = [
        'year'            => 'integer',
        'km'              => 'integer',
        'reference_price' => 'decimal:2',
        'take_price'      => 'decimal:2',
        'price'           => 'decimal:2',
        'check_spare'     => 'boolean',
        'check_jack'      => 'boolean',
        'check_tools'     => 'boolean',
        'check_docs'      => 'boolean',
        'check_key_copy'  => 'boolean',
        'check_manual'    => 'boolean',
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
    
    if ($this->relationLoaded('expenses')) {
        return $this->expenses->where('status', 'no_pagado')->count() > 0;
    }

    return $this->expenses()->where('status', 'no_pagado')->exists();
}


    // ================= EVENTOS AUTOMÁTICOS =================
    protected static function booted()
    {
        static::updated(function (Vehicle $vehicle) {
            try {
                $oldStatus = $vehicle->getOriginal('status');
                $newStatus = $vehicle->status;
                if ($oldStatus === $newStatus) return;

                // 🟢 Lógica de Venta
                if ($newStatus === 'vendido') {
                    $updates = [];
                    if (empty($vehicle->seller_id)) $updates['seller_id'] = Auth::id() ?? 1;
                    if (empty($vehicle->sold_at)) $updates['sold_at'] = now();
                    
                    if (!empty($updates)) {
                        $vehicle->fill($updates)->saveQuietly();
                    }

                    $reservation = $vehicle->reservations()
                        ->whereIn('status', ['pendiente', 'reservado'])
                        ->latest('id')->first();

                    if ($reservation) {
                        $reservation->update(['status' => 'vendido']);
                    } else {
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

                // 🔄 Lógica de Retorno a Disponible
                if ($newStatus === 'disponible' || $newStatus === 'ofrecido') {
                    if ($vehicle->sold_at !== null) {
                        $vehicle->forceFill(['sold_at' => null])->saveQuietly();
                    }

                    $reservation = $vehicle->reservations()
                        ->where('status', 'vendido')
                        ->latest('id')->first();

                    if ($reservation) {
                        $reservation->update(['status' => 'anulada']);
                    }
                }
            } catch (\Throwable $e) {
                \Log::error('Error en Vehicle::booted: ' . $e->getMessage());
            }
        });
    }
}
