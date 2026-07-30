<?php

namespace Tests;

use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\Role;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function createUser(array $attrs = []): User
    {
        return User::factory()->create($attrs);
    }

    protected function createAdmin(array $attrs = []): User
    {
        $user = User::factory()->create($attrs);
        $role = Role::firstOrCreate(['name' => 'Admin'], ['description' => 'Administrator']);
        $user->roles()->attach($role->id);
        return $user;
    }

    protected function createVehicle(array $attrs = []): Vehicle
    {
        return Vehicle::create(array_merge([
            'brand'  => 'Toyota',
            'model'  => 'Corolla',
            'year'   => 2020,
            'plate'  => 'TST' . rand(100, 999),
            'status' => 'disponible',
            'price'  => 20000.00,
        ], $attrs));
    }

    protected function createCustomer(array $attrs = []): Customer
    {
        return Customer::create(array_merge([
            'first_name' => 'Test',
            'last_name'  => 'Customer',
            'email'      => 'test' . uniqid() . '@example.com',
            'phone'      => '1122334455',
        ], $attrs));
    }

    protected function createPaymentMethod(array $attrs = []): PaymentMethod
    {
        return PaymentMethod::create(array_merge([
            'name' => 'Efectivo',
            'type' => 'cash',
        ], $attrs));
    }
}
