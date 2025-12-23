<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerUpdateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('customer')?->id;

        return [
            'first_name' => ['sometimes','required','string','max:80'],
            'last_name'  => ['sometimes','required','string','max:80'],
            'status'     => 'nullable|string',

            'doc_type'   => ['nullable','string','max:20'],
            'doc_number' => ['nullable','string','max:20', Rule::unique('customers','doc_number')->ignore($id)],
            'cuit'       => ['nullable','string','max:20', Rule::unique('customers','cuit')->ignore($id)],

            'marital_status' => ['nullable','string','max:20'],

            'email'      => ['nullable','email','max:150', Rule::unique('customers','email')->ignore($id)],
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