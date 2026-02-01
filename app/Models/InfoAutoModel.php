<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InfoAutoModel extends Model
{
    use HasFactory;

    protected $guarded = [];

    // ESTA ES LA PARTE IMPORTANTE 👇
    protected $casts = [
        'prices'     => 'array',  // Convierte el JSON string a Array de PHP automáticamente
        'features'   => 'array',  // Lo mismo para features
        'list_price' => 'boolean'
    ];

    protected $appends = ['price_display'];

    public function brand()
    {
        return $this->belongsTo(InfoAutoBrand::class);
    }

    public function group()
    {
        return $this->belongsTo(InfoAutoGroup::class);
    }
    
    // Si tenías un getPricesAttribute manual, BORRALO. 
    // El 'casts' ya hace el trabajo sucio por vos de forma nativa.
// Laravel usa esto para generar el campo 'price_display' automáticamente
    public function getPriceDisplayAttribute()
    {
        // 1. Si tiene lista de precios usados
        if (!empty($this->prices) && is_array($this->prices)) {
            // Extraemos solo los valores de precio
            $montos = array_column($this->prices, 'price');
            
            if (count($montos) > 0) {
                $min = min($montos);
                $max = max($montos);

                // Formateamos como moneda (sin decimales)
                $minStr = number_format($min, 0, ',', '.');
                $maxStr = number_format($max, 0, ',', '.');

                if ($min === $max) {
                    return "$ " . $minStr;
                }

                return "$ " . $minStr . " - $ " . $maxStr;
            }
        }

        // 2. Si no tiene usados, pero tiene precio de lista (aunque en tu DB vi que 0km viene aparte)
        // Aquí podrías agregar lógica si guardaste el precio 0km en alguna columna.
        
        // 3. Si no hay nada
        return "Consultar Valor";
    }

    }