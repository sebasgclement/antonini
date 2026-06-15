<?php

namespace Tests\Feature\Services;

use App\Models\Reservation;
use App\Models\Vehicle;
use App\Services\VehicleStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VehicleStatusServiceTest extends TestCase
{
    use RefreshDatabase;

    private VehicleStatusService $service;
    private Vehicle $vehicle;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new VehicleStatusService();
        $seller        = $this->createUser();
        $customer      = $this->createCustomer();
        $this->vehicle = $this->createVehicle([
            "status"      => "disponible",
            "customer_id" => $customer->id,
            "seller_id"   => $seller->id,  // evita que onConfirmed use Auth::id() ?? 1 cuando no hay session
        ]);
    }

    public function test_reserve_marks_vehicle_as_reservado(): void
    {
        $this->service->reserve($this->vehicle);
        $this->assertDatabaseHas("vehicles", ["id" => $this->vehicle->id, "status" => "reservado"]);
    }

    public function test_reserve_uses_update_quietly_so_no_model_events_fire(): void
    {
        $eventFired = false;
        Vehicle::updated(function () use (&$eventFired) { $eventFired = true; });
        $this->service->reserve($this->vehicle);
        $this->assertFalse($eventFired);
    }

    public function test_on_confirmed_marks_vehicle_as_vendido(): void
    {
        $this->service->onConfirmed($this->vehicle);
        $this->assertDatabaseHas("vehicles", ["id" => $this->vehicle->id, "status" => "vendido"]);
    }

    public function test_on_confirmed_stamps_sold_at(): void
    {
        $this->assertNull($this->vehicle->sold_at);
        $this->service->onConfirmed($this->vehicle);
        $this->assertNotNull($this->vehicle->fresh()->sold_at);
    }

    public function test_on_confirmed_preserves_existing_sold_at(): void
    {
        $existingSoldAt = now()->subDay();
        $this->vehicle->updateQuietly(["sold_at" => $existingSoldAt]);
        $this->service->onConfirmed($this->vehicle);
        $this->assertEquals(
            $existingSoldAt->toDateString(),
            $this->vehicle->fresh()->sold_at->toDateString()
        );
    }

    private function makeReservationForVehicle(string $status): void
    {
        $seller   = $this->createUser();
        $customer = $this->createCustomer();
        Reservation::withoutEvents(fn() => $this->vehicle->reservations()->create([
            "customer_id"       => $customer->id,
            "seller_id"         => $seller->id,
            "price"             => 20000,
            "deposit"           => 0,
            "payment_method"    => "efectivo",
            "workshop_expenses" => 0,
            "status"            => $status,
            "date"              => now(),
        ]));
    }

    public function test_on_cancelled_releases_vehicle_when_no_active_reservations(): void
    {
        $this->makeReservationForVehicle("anulada");
        $this->vehicle->updateQuietly(["status" => "reservado"]);
        $this->service->onCancelled($this->vehicle);
        $this->assertDatabaseHas("vehicles", ["id" => $this->vehicle->id, "status" => "disponible"]);
    }

    public function test_on_cancelled_keeps_reservado_when_another_active_reservation_exists(): void
    {
        $this->makeReservationForVehicle("pendiente");
        $this->vehicle->updateQuietly(["status" => "reservado"]);
        $this->service->onCancelled($this->vehicle);
        $this->assertDatabaseHas("vehicles", ["id" => $this->vehicle->id, "status" => "reservado"]);
    }

    public function test_direct_sale_marks_vehicle_as_vendido(): void
    {
        $this->actingAs($this->createUser());
        $this->service->directSale($this->vehicle);
        $this->assertDatabaseHas("vehicles", ["id" => $this->vehicle->id, "status" => "vendido"]);
    }

    public function test_direct_sale_creates_automatic_reservation(): void
    {
        $this->actingAs($this->createUser());
        $this->service->directSale($this->vehicle);
        $this->assertDatabaseHas("reservations", [
            "vehicle_id" => $this->vehicle->id,
            "status"     => "vendido",
            "comments"   => "Venta directa generada automáticamente",
        ]);
    }

    public function test_direct_sale_skips_reservation_if_confirmed_exists(): void
    {
        $seller = $this->createUser();
        $this->actingAs($seller);
        $this->makeReservationForVehicle("confirmada");
        $countBefore = $this->vehicle->reservations()->count();
        $this->service->directSale($this->vehicle);
        $this->assertEquals($countBefore, $this->vehicle->reservations()->count());
    }

    public function test_release_sets_vehicle_to_disponible_by_default(): void
    {
        $this->vehicle->updateQuietly(["status" => "vendido"]);
        $this->service->release($this->vehicle);
        $this->assertDatabaseHas("vehicles", ["id" => $this->vehicle->id, "status" => "disponible"]);
    }

    public function test_release_can_target_ofrecido(): void
    {
        $this->service->release($this->vehicle, "ofrecido");
        $this->assertDatabaseHas("vehicles", ["id" => $this->vehicle->id, "status" => "ofrecido"]);
    }

    public function test_release_clears_sold_at(): void
    {
        $this->vehicle->updateQuietly(["sold_at" => now(), "status" => "vendido"]);
        $this->service->release($this->vehicle);
        $this->assertNull($this->vehicle->fresh()->sold_at);
    }

    public function test_release_cancels_all_active_reservations(): void
    {
        // 'reservado' no es un status valido en la tabla reservations (enum constraint).
        // Los estados activos validos que puede tener una reserva son 'pendiente' y 'confirmada'.
        foreach (["pendiente", "confirmada"] as $status) {
            $this->makeReservationForVehicle($status);
        }
        $this->service->release($this->vehicle);
        $activeCount = $this->vehicle->reservations()
            ->whereIn("status", ["pendiente", "confirmada"])
            ->count();
        $this->assertEquals(0, $activeCount);
    }
}
