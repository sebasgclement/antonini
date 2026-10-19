<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Valida formato de CUIT/CUIL: 11 dígitos, prefijo asignado por ARCA y dígito verificador (módulo 11).
 * No confirma que el CUIT exista en el padrón (eso requiere el web service de ARCA).
 */
class ValidCuit implements ValidationRule
{
    private const PREFIXES = ['20', '23', '24', '25', '26', '27', '30', '33', '34'];
    private const WEIGHTS  = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $cuit = preg_replace('/\D/', '', (string) $value);

        if (strlen($cuit) !== 11 || !in_array(substr($cuit, 0, 2), self::PREFIXES, true)) {
            $fail('El CUIT ingresado no es válido.');
            return;
        }

        $sum = 0;
        foreach (self::WEIGHTS as $i => $w) {
            $sum += (int) $cuit[$i] * $w;
        }
        $dv = 11 - ($sum % 11);
        if ($dv === 11) $dv = 0;

        if ($dv === 10 || $dv !== (int) $cuit[10]) {
            $fail('El CUIT ingresado no es válido (dígito verificador incorrecto).');
        }
    }
}
