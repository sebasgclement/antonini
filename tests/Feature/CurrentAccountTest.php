<?php

namespace Tests\Feature;

use App\Models\CurrentAccount;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pruebas para el ledger de cuenta corriente.
 *
 * La integridad del saldo depende de que cada movimiento use el balance del
 * movimiento anterior como punto de partida. Por eso solo se puede eliminar
 * el ultimo movimiento (restriccion de integridad del ledger).
 */
class CurrentAccountTest extends TestCase
{
    use RefreshDatabase;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->customer = $this->createCustomer();
    }

    // ---- index ----

    public function test_index_returns_movements_and_current_balance(): void
    {
        $user = $this->createUser();

        CurrentAccount::create([
            'customer_id' => $this->customer->id,
            'concept'     => 'Cargo inicial',
            'debit'       => 1000,
            'credit'      => 0,
            'balance'     => 1000,
            'status'      => 'pendiente',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/customers/{$this->customer->id}/current-account");

        $response->assertOk()
            ->assertJsonStructure(['customer_name', 'current_balance', 'movements']);

        $this->assertEquals(1000, $response->json('current_balance'));
    }

    public function test_index_returns_zero_balance_with_no_movements(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/customers/{$this->customer->id}/current-account");

        $response->assertOk();
        $this->assertEquals(0, $response->json('current_balance'));
    }

    // ---- storePayment (HABER) ----

    public function test_store_payment_creates_credit_movement_with_status_pagado(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/customers/{$this->customer->id}/current-account/pay", [
                'amount'  => 5000,
                'concept' => 'Pago en efectivo',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('current_accounts', [
            'customer_id' => $this->customer->id,
            'credit'      => 5000,
            'debit'       => 0,
            'status'      => 'pagado',
        ]);
    }

    public function test_store_payment_reduces_running_balance(): void
    {
        $user = $this->createUser();

        // Cargo previo de 10000
        CurrentAccount::create([
            'customer_id' => $this->customer->id,
            'concept'     => 'Cargo previo',
            'debit'       => 10000,
            'credit'      => 0,
            'balance'     => 10000,
            'status'      => 'pendiente',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/customers/{$this->customer->id}/current-account/pay", [
                'amount' => 3000,
            ]);

        // Nuevo balance = 10000 - 3000 = 7000
        $this->assertDatabaseHas('current_accounts', [
            'customer_id' => $this->customer->id,
            'credit'      => 3000,
            'balance'     => 7000,
        ]);
    }

    public function test_store_payment_stores_payment_date_and_notes(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/customers/{$this->customer->id}/current-account/pay", [
                'amount'       => 1000,
                'payment_date' => '2026-06-14',
                'notes'        => 'Pago con transferencia Banco Galicia',
            ])
            ->assertCreated();

        // SQLite almacena la fecha como datetime string; verificamos por notes y que el registro exista
        $movement = \App\Models\CurrentAccount::where('customer_id', $this->customer->id)
            ->where('notes', 'Pago con transferencia Banco Galicia')
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals('2026-06-14', $movement->payment_date->toDateString());
    }

    // ---- storeConcept (DEBE) ----

    public function test_store_concept_creates_debit_movement_with_status_pendiente(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/customers/{$this->customer->id}/current-account/charge", [
                'amount'  => 8000,
                'concept' => 'Servicio de taller',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('current_accounts', [
            'customer_id' => $this->customer->id,
            'debit'       => 8000,
            'credit'      => 0,
            'status'      => 'pendiente',
        ]);
    }

    public function test_store_concept_accumulates_balance_across_multiple_charges(): void
    {
        $user = $this->createUser();
        $actor = $this->actingAs($user, 'sanctum');

        $actor->postJson("/api/customers/{$this->customer->id}/current-account/charge", [
            'amount'  => 5000,
            'concept' => 'Cargo 1',
        ]);

        $actor->postJson("/api/customers/{$this->customer->id}/current-account/charge", [
            'amount'  => 3000,
            'concept' => 'Cargo 2',
        ]);

        // Balance acumulado: 5000 + 3000 = 8000
        $lastBalance = CurrentAccount::where('customer_id', $this->customer->id)
            ->orderBy('id', 'desc')
            ->value('balance');

        $this->assertEquals(8000, $lastBalance);
    }

    public function test_store_concept_requires_concept_field(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/customers/{$this->customer->id}/current-account/charge", [
                'amount' => 1000,
                // sin 'concept'
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['concept']);
    }

    // ---- destroy ----

    public function test_destroy_last_movement_succeeds(): void
    {
        $user = $this->createUser();

        $movement = CurrentAccount::create([
            'customer_id' => $this->customer->id,
            'concept'     => 'Unico movimiento',
            'debit'       => 1000,
            'credit'      => 0,
            'balance'     => 1000,
            'status'      => 'pendiente',
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/customers/{$this->customer->id}/current-account/{$movement->id}")
            ->assertOk();

        $this->assertDatabaseMissing('current_accounts', ['id' => $movement->id]);
    }

    public function test_destroy_manual_non_last_movement_succeeds_and_recalculates(): void
    {
        $user = $this->createUser();

        $first = CurrentAccount::create([
            'customer_id' => $this->customer->id,
            'concept'     => 'Movimiento 1',
            'debit'       => 1000,
            'credit'      => 0,
            'balance'     => 1000,
            'status'      => 'pendiente',
        ]);

        $second = CurrentAccount::create([
            'customer_id' => $this->customer->id,
            'concept'     => 'Movimiento 2',
            'debit'       => 500,
            'credit'      => 0,
            'balance'     => 1500,
            'status'      => 'pendiente',
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/customers/{$this->customer->id}/current-account/{$first->id}")
            ->assertOk();

        $this->assertDatabaseMissing('current_accounts', ['id' => $first->id]);
        // El segundo movimiento debe recalcularse: saldo = 500
        $this->assertDatabaseHas('current_accounts', ['id' => $second->id, 'balance' => 500]);
    }

    public function test_destroy_auto_generated_movement_returns_422(): void
    {
        $user    = $this->createUser();
        $vehicle = $this->createVehicle();

        $reservation = \App\Models\Reservation::create([
            'vehicle_id'  => $vehicle->id,
            'customer_id' => $this->customer->id,
            'seller_id'   => $user->id,
            'price'       => 10000,
            'balance'     => 10000,
        ]);

        $movement = CurrentAccount::create([
            'customer_id'    => $this->customer->id,
            'reservation_id' => $reservation->id,
            'concept'        => 'Venta auto-generada',
            'debit'          => 10000,
            'credit'         => 0,
            'balance'        => 10000,
            'status'         => 'pendiente',
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/customers/{$this->customer->id}/current-account/{$movement->id}")
            ->assertUnprocessable();

        $this->assertDatabaseHas('current_accounts', ['id' => $movement->id]);
    }
}
