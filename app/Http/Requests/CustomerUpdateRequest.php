<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Rules\ValidCuit;

class CustomerUpdateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    // El CUIT se guarda sólo con dígitos (20123456789), igual que en proveedores
    protected function prepareForValidation(): void
    {
        if ($this->has('cuit')) {
            $digits = preg_replace('/\D/', '', (string) $this->input('cuit'));
            $this->merge(['cuit' => $digits !== '' ? $digits : null]);
        }
    }

    public function rules(): array
    {
        $id = $this->route('customer')?->id;

        return [
            'first_name' => ['sometimes','required','string','max:80'],
            'last_name'  => ['sometimes','required','string','max:80'],
            'status'     => 'nullable|string',
            'seller_id'  => 'nullable|exists:users,id',

            'doc_type'   => ['nullable','string','max:20'],
            'doc_number' => ['nullable','string','max:20', Rule::unique('customers','doc_number')->ignore($id)],
            'cuit'       => ['nullable','digits:11', new ValidCuit, Rule::unique('customers','cuit')->ignore($id)],
            'tax_responsibility_id' => ['nullable','exists:tax_responsibilities,id'],

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