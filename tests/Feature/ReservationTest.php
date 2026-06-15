<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pruebas HTTP para el flujo completo de reservas.
 *
 * Cubre: creacion ARS/USD, transiciones de status y la formula de balance.
 */
class ReservationTest extends TestCase
{
    use RefreshDatabase;

    private function makeVehicleAndCustomer(): array
    {
        return [
            $this->createVehicle(['price' => 20000, 'status' => 'disponible']),
            $this->createCustomer(),
        ];
    }

    // ---- Creacion ----

    public function test_creating_ars_reservation_sets_price_ars_equal_to_price(): void
    {
        $user = $this->createUser();
        [$vehicle, $customer] = $this->makeVehicleAndCustomer();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservations', [
                'vehicle_id'  => $vehicle->id,
                'customer_id' => $customer->id,
                'price'       => 15000,
                'deposit'     => 0,
                'currency'    => 'ARS',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('reservations', [
            'vehicle_id' => $vehicle->id,
            'price_ars'  => 15000,
        ]);
    }

    public function test_creating_usd_reservation_converts_price_to_ars(): void
    {
        $user = $this->createUser();
        [$vehicle, $customer] = $this->makeVehicleAndCustomer();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservations', [
                'vehicle_id'    => $vehicle->id,
                'customer_id'   => $customer->id,
                'price'         => 10000,
                'deposit'       => 0,
                'currency'      => 'USD',
                'exchange_rate' => 1200,
            ])
            ->assertCreated();

        // price_ars = 10000 * 1200 = 12_000_000
        $this->assertDatabaseHas('reservations', [
            'vehicle_id' => $vehicle->id,
            'price_ars'  => 12000000,
        ]);
    }

    public function test_creating_reservation_marks_vehicle_as_reservado(): void
    {
        $user = $this->createUser();
        [$vehicle, $customer] = $this->makeVehicleAndCustomer();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservations', [
                'vehicle_id'  => $vehicle->id,
                'customer_id' => $customer->id,
                'price'       => 5000,
                'deposit'     => 0,
                'currency'    => 'ARS',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('vehicles', ['id' => $vehicle->id, 'status' => 'reservado']);
    }

    public function test_balance_formula_includes_transfer_and_admin_costs(): void
    {
        $user = $this->createUser();
        [$vehicle, $customer] = $this->makeVehicleAndCustomer();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservations', [
                'vehicle_id'          => $vehicle->id,
                'customer_id'         => $customer->id,
                'price'               => 20000,
                'deposit'             => 2000,
                'transfer_cost'       => 500,
                'administrative_cost' => 300,
                'currency'            => 'ARS',
            ])
            ->assertCreated();

        // balance = (20000 + 500 + 300) - 2000 = 18800
        $this->assertDatabaseHas('reservations', [
            'vehicle_id' => $vehicle->id,
            'balance'    => 18800,
        ]);
    }

    public function test_full_deposit_sets_status_to_confirmada(): void
    {
        $user = $this->createUser();
        [$vehicle, $customer] = $this->makeVehicleAndCustomer();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservations', [
                'vehicle_id'  => $vehicle->id,
                'customer_id' => $customer->id,
                'price'       => 5000,
                'deposit'     => 5000,
                'currency'    => 'ARS',
            ])
            ->assertCreated();

        $this->assertEquals('confirmada', $response->json('data.status'));
    }

    // ---- Confirmacion ----

    public function test_confirming_reservation_marks_vehicle_as_vendido(): void
    {
        $user = $this->createUser();
        [$vehicle, $customer] = $this->makeVehicleAndCustomer();

        $reservationId = $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservations', [
                'vehicle_id'  => $vehicle->id,
                'customer_id' => $customer->id,
                'price'       => 5000,
                'deposit'     => 0,
                'currency'    => 'ARS',
            ])
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/reservations/{$reservationId}", ['status' => 'confirmada'])
            ->assertOk();

        $this->assertDatabaseHas('vehicles', ['id' => $vehicle->id, 'status' => 'vendido']);
    }

    // ---- Cancelacion ----

    public function test_cancelling_reservation_releases_vehicle_to_disponible(): void
    {
        $user = $this->createUser();
        [$vehicle, $customer] = $this->makeVehicleAndCustomer();

        $reservationId = $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservations', [
                'vehicle_id'  => $vehicle->id,
                'customer_id' => $customer->id,
                'price'       => 5000,
                'deposit'     => 0,
                'currency'    => 'ARS',
            ])
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/reservations/{$reservationId}/cancel")
            ->assertOk();

        $this->assertDatabaseHas('vehicles', ['id' => $vehicle->id, 'status' => 'disponible']);
    }

    public function test_deleting_reservation_releases_vehicle(): void
    {
        $user = $this->createUser();
        [$vehicle, $customer] = $this->makeVehicleAndCustomer();

        $reservationId = $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservations', [
                'vehicle_id'  => $vehicle->id,
                'customer_id' => $customer->id,
                'price'       => 5000,
                'deposit'     => 0,
                'currency'    => 'ARS',
            ])
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/reservations/{$reservationId}")
            ->assertOk();

        $this->assertDatabaseHas('vehicles', ['id' => $vehicle->id, 'status' => 'disponible']);
    }

    // ---- Show / Balance sincronizado ----

    public function test_show_returns_recalculated_balance(): void
    {
        $user = $this->createUser();
        [$vehicle, $customer] = $this->makeVehicleAndCustomer();

        $reservationId = $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservations', [
                'vehicle_id'  => $vehicle->id,
                'customer_id' => $customer->id,
                'price'       => 20000,
                'deposit'     => 5000,
                'currency'    => 'ARS',
            ])
            ->json('data.id');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/reservations/{$reservationId}");

        $response->assertOk();
        // balance = 20000 - 5000 = 15000
        $this->assertEquals(15000, $response->json('data.balance'));
    }
}
