<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InfoAutoModel extends Model
{
    use HasFactory;

    protected $guarded = [];

    // Casts para convertir JSON automáticamente
    protected $casts = [
        'prices'     => 'array',   // convierte JSON de precios en array PHP
        'features'   => 'array',   // convierte JSON de features en array PHP
        'list_price' => 'boolean'
    ];

    // Relación con Marca
    public function brand()
    {
        return $this->belongsTo(InfoAutoBrand::class);
    }

    // Relación con Grupo
    public function group()
    {
        return $this->belongsTo(InfoAutoGroup::class);
    }

    // Campo calculado para mostrar precios de forma amigable
    protected $appends = ['price_display'];

    public function getPriceDisplayAttribute()
    {
        // 1. Si tiene lista de precios usados
        if (!empty($this->prices) && is_array($this->prices)) {
            $montos = array_column($this->prices, 'price');
            if (count($montos) > 0) {
                $min = min($montos);
                $max = max($montos);

                $minStr = number_format($min, 0, ',', '.');
                $maxStr = number_format($max, 0, ',', '.');

                if ($min === $max) {
                    return "$" . $minStr;
                }

                return "$" . $minStr . " - $" . $maxStr;
            }
        }

        // 2. Si no tiene usados pero tiene precio de lista
        if ($this->list_price) {
            return "Consultar precio 0km";
        }

        // 3. Si no hay nada
        return "Consultar Valor";
    }
}
