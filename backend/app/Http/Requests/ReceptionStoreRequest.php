<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReceptionStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ya controlamos con sanctum en la ruta
    }

    public function rules(): array
    {
        return [
            // Cliente (opcional): o bien customer.id, o bien snapshot name/email/phone
            'customer.id'    => ['nullable', 'integer', 'exists:customers,id'],
            'customer.name'  => ['nullable', 'string', 'max:150'],
            'customer.email' => ['nullable', 'email', 'max:150'],
            'customer.phone' => ['nullable', 'string', 'max:60'],

            // Vehículo (lo esencial es marca y modelo)
            'vehicle.brand'  => ['required', 'string', 'max:100'],
            'vehicle.model'  => ['required', 'string', 'max:100'],
            'vehicle.year'   => ['nullable', 'integer', 'between:1900,' . (now()->year + 1)],
            'vehicle.plate'  => ['nullable', 'string', 'max:20'],
            'vehicle.vin'    => ['nullable', 'string', 'max:60'],
            'vehicle.color'  => ['nullable', 'string', 'max:50'],
            'vehicle.km'     => ['nullable', 'integer', 'min:0'],
            'vehicle.fuel_level' => ['nullable', 'integer', 'between:0,100'],

            // Checklist
            'checklist.spare' => ['nullable', 'boolean'],
            'checklist.jack'  => ['nullable', 'boolean'],
            'checklist.docs'  => ['nullable', 'boolean'],

            'notes' => ['nullable', 'string'],
        ];
    }
}
