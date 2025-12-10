<?php

namespace App\Events;

use App\Models\Reservation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservaCreada implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $data;

    public function __construct(Reservation $reserva)
    {
        $this->data = [
            'id' => $reserva->id,
            'clientName' => $reserva->customer ? ($reserva->customer->first_name . ' ' . $reserva->customer->last_name) : 'Cliente',
            'amount' => $reserva->deposit,
            'timestamp' => now()->timestamp 
        ];
    }

    public function broadcastOn(): array
    {
        // El canal debe coincidir con el del frontend
        return [
            new PrivateChannel('admin-notifications'),
        ];
    }

    // 🔥 ESTO ES CRÍTICO: Define el nombre exacto que escucha React
    public function broadcastAs(): string
    {
        return 'reserva.creada';
    }

    public function broadcastWith(): array
    {
        return ['reserva' => $this->data];
    }
}