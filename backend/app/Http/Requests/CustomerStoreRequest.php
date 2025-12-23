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
            'status'     => 'nullable|string',

            'doc_type'   => ['nullable','string','max:20'],
            'doc_number' => ['required','string','max:20','unique:customers,doc_number'],
            'cuit'       => ['nullable','string','max:20','unique:customers,cuit'],
            
            'marital_status' => ['nullable','string','max:20'],

            'email'      => ['nullable','email','max:150','unique:customers,email'],
            'phone'      => ['nullable','string','max:40'],
            'alt_phone'  => ['nullable','string','max:40'],

            'city'       => ['nullable','string','max:80'],
            'address'    => ['nullable','string','max:160'],
            'notes'      => ['nullable','string'],

            'dni_front'  => ['nullable', 'image', 'max:10240'],
            'dni_back'   => ['nullable', 'image', 'max:10240'],
        ];
    }
}