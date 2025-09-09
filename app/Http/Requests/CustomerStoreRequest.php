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

            'doc_type'   => ['nullable','string','max:10'],
            'doc_number' => ['nullable','string','max:20','unique:customers,doc_number'],

            'cuit'       => ['nullable','string','max:20','unique:customers,cuit'],

            'email'      => ['nullable','email','max:150','unique:customers,email'],
            'phone'      => ['nullable','string','max:40'],
            'alt_phone'  => ['nullable','string','max:40'],

            'city'       => ['nullable','string','max:80'],
            'address'    => ['nullable','string','max:160'],
            'notes'      => ['nullable','string'],
        ];
    }
}
