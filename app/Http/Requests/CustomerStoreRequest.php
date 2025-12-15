<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'first_name' => ['required','string','max:80'],
            'last_name'  => ['required','string','max:80'],
            'status' => 'nullable|string',

            'doc_type'   => ['nullable','string','max:20'], // Subí a 20 por las dudas ("Pasaporte Extranjero")
            'doc_number' => ['required','string','max:20','unique:customers,doc_number'], // Lo puse required porque es clave

            'cuit'       => ['nullable','string','max:20','unique:customers,cuit'],
            'marital_status' => ['nullable','string','max:20'], // 👈 FALTABA ESTE

            'email'      => ['nullable','email','max:150','unique:customers,email'],
            'phone'      => ['nullable','string','max:40'],
            'alt_phone'  => ['nullable','string','max:40'],

            'city'       => ['nullable','string','max:80'],
            'address'    => ['nullable','string','max:160'],
            'notes'      => ['nullable','string'],

            // 🖼️ Validaciones para las fotos (FALTABAN ESTAS)
            'dni_front'  => ['nullable', 'image', 'max:10240'], // Max 10MB
            'dni_back'   => ['nullable', 'image', 'max:10240'],
        ];
    }
}