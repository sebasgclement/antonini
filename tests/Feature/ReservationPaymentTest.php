<?php

namespace Tests\Feature;

use App\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pruebas para el calculo de amount_ars en pagos de reserva.
 *
 * La regla: si el pago es en USD, amount_ars = amount * exchange_rate.
 * Si es en ARS, amount_ars = amount.
 * Este calculo es critico porque el balance de la reserva usa sum(amount_ars).
 */
class ReservationPaymentTest extends TestCase
{
    use RefreshDatabase;

    private function makeReservation(): Reservation
    {
        $user     = $this->createUser();
        $vehicle  = $this->createVehicle(['status' => 'disponible']);
        $customer = $this->createCustomer();

        return Reservation::withoutEvents(function () use ($vehicle, $customer, $user) {
            return Reservation::create([
                'vehicle_id'        => $vehicle->id,
                'customer_id'       => $customer->id,
                'seller_id'         => $user->id,
                'price'             => 20000,
                'price_ars'         => 20000,
                'deposit'           => 0,
                'payment_method'    => 'efectivo',
                'workshop_expenses' => 0,
                'balance'           => 20000,
                'status'            => 'pendiente',
                'date'              => now(),
            ]);
        });
    }

    public function test_ars_payment_stores_amount_ars_equal_to_amount(): void
    {
        $user        = $this->createUser();
        $reservation = $this->makeReservation();
        $method      = $this->createPaymentMethod();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservation-payments', [
                'reservation_id'    => $reservation->id,
                'payment_method_id' => $method->id,
                'amount'            => 5000,
                'currency'          => 'ARS',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('reservation_payments', [
            'reservation_id' => $reservation->id,
            'amount'         => 5000,
            'amount_ars'     => 5000,
            'currency'       => 'ARS',
        ]);
    }

    public function test_usd_payment_converts_to_ars_using_exchange_rate(): void
    {
        $user        = $this->createUser();
        $reservation = $this->makeReservation();
        $method      = $this->createPaymentMethod();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservation-payments', [
                'reservation_id'    => $reservation->id,
                'payment_method_id' => $method->id,
                'amount'            => 100,
                'currency'          => 'USD',
                'exchange_rate'     => 1200,
            ])
            ->assertCreated();

        // amount_ars = 100 * 1200 = 120000
        $this->assertDatabaseHas('reservation_payments', [
            'reservation_id' => $reservation->id,
            'amount'         => 100,
            'amount_ars'     => 120000,
            'currency'       => 'USD',
        ]);
    }

    public function test_payment_requires_exchange_rate_when_currency_is_usd(): void
    {
        $user        = $this->createUser();
        $reservation = $this->makeReservation();
        $method      = $this->createPaymentMethod();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservation-payments', [
                'reservation_id'    => $reservation->id,
                'payment_method_id' => $method->id,
                'amount'            => 100,
                'currency'          => 'USD',
                // sin exchange_rate
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['exchange_rate']);
    }

    public function test_updating_payment_recomputes_amount_ars(): void
    {
        $user        = $this->createUser();
        $reservation = $this->makeReservation();
        $method      = $this->createPaymentMethod();

        // Crear pago en ARS
        $paymentId = $this->actingAs($user, 'sanctum')
            ->postJson('/api/reservation-payments', [
                'reservation_id'    => $reservation->id,
                'payment_method_id' => $method->id,
                'amount'            => 5000,
                'currency'          => 'ARS',
            ])
            ->json('payment.id');

        // Actualizar a USD con cotizacion
        $this->actingAs($user, 'sanctum')
            ->putJson("/api/reservation-payments/{$paymentId}", [
                'amount'        => 200,
                'currency'      => 'USD',
                'exchange_rate' => 1100,
            ])
            ->assertOk();

        $this->assertDatabaseHas('reservation_payments', [
            'id'         => $paymentId,
            'amount_ars' => 220000,  // 200 * 1100
        ]);
    }

    public function test_paid_amount_accessor_sums_amount_ars_across_currencies(): void
    {
        $user        = $this->createUser();
        $reservation = $this->makeReservation();
        $method      = $this->createPaymentMethod();
        $actor       = $this->actingAs($user, 'sanctum');

        // Pago 1: 5000 ARS -> amount_ars = 5000
        $actor->postJson('/api/reservation-payments', [
            'reservation_id'    => $reservation->id,
            'payment_method_id' => $method->id,
            'amount'            => 5000,
            'currency'          => 'ARS',
        ]);

        // Pago 2: 100 USD a 1000 -> amount_ars = 100000
        $actor->postJson('/api/reservation-payments', [
            'reservation_id'    => $reservation->id,
            'payment_method_id' => $method->id,
            'amount'            => 100,
            'currency'          => 'USD',
            'exchange_rate'     => 1000,
        ]);

        $reservation->refresh();
        // paid_amount = sum(amount_ars) = 5000 + 100000 = 105000
        $this->assertEquals(105000, $reservation->paid_amount);
    }
}
