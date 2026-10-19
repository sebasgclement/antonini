<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxResponsibility extends Model
{
    protected $fillable = ['description'];

    protected $appends = ['invoice_letter'];

    /**
     * Letra de factura que corresponde emitirle a un cliente con esta condición,
     * siendo el emisor Responsable Inscripto.
     *  - Resp. Inscripto y Monotributo (RG 5003/2021) => A
     *  - Resto (Consumidor Final, Exento, No Alcanzado, No Inscripto...) => B
     * Se resuelve por descripción porque hay dos seeders con textos distintos.
     */
    public function getInvoiceLetterAttribute(): string
    {
        $d = mb_strtolower($this->description ?? '');

        $isRI   = str_contains($d, 'inscripto') && !str_contains($d, 'no inscripto');
        $isMono = str_contains($d, 'monotribut');

        return ($isRI || $isMono) ? 'A' : 'B';
    }
}
