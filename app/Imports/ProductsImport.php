<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\ProductPrice;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Carbon\Carbon;

class ProductsImport implements ToCollection
{
    protected $providerId;
    protected $businessUnitId;
    protected $priceListId;

    public function __construct($providerId, $priceListId, $businessUnitId = 1)
    {
        $this->providerId = $providerId;
        $this->priceListId = $priceListId;
        $this->businessUnitId = $businessUnitId;
    }

    public function collection(Collection $rows)
    {
        $indexes = [
            'codigo' => null, 'descripcion' => null, 'eurocode' => null, 'nags' => null, 'precio' => null,
        ];
        
        $readingProducts = false;

        foreach ($rows as $row) {
            $rowValues = $row->toArray();
            $rowString = strtolower(implode(' ', array_filter($rowValues)));
            
            // RADAR de Columnas (Busca coincidencias para activar la lectura)
            if (!$readingProducts && 
                (strpos($rowString, 'cod') !== false || strpos($rowString, 'material') !== false) && 
                (strpos($rowString, 'prec') !== false || strpos($rowString, 'neto') !== false)) {
                
                foreach ($rowValues as $index => $value) {
                    if (!$value) continue;
                    $val = strtolower(trim($value));
                    
                    if (strpos($val, 'cod') !== false || strpos($val, 'mat') !== false) $indexes['codigo'] = $index;
                    if (strpos($val, 'descrip') !== false) $indexes['descripcion'] = $index;
                    if (strpos($val, 'euro') !== false) $indexes['eurocode'] = $index;
                    if (strpos($val, 'nags') !== false) $indexes['nags'] = $index;
                    if (strpos($val, 'prec') !== false || strpos($val, 'neto') !== false) $indexes['precio'] = $index;
                }
                $readingProducts = true;
                continue;
            }

            // Si no encontró las columnas o la fila está vacía, sigue de largo
            if (!$readingProducts || $indexes['codigo'] === null || $indexes['precio'] === null) continue;

            $codigo = isset($row[$indexes['codigo']]) ? trim($row[$indexes['codigo']]) : null;
            $precioRaw = isset($row[$indexes['precio']]) ? $row[$indexes['precio']] : null;

            // Limpieza básica de fila
            if (!$codigo || strtolower($codigo) === 'codigo' || strtolower($codigo) === 'código') continue;
            
            // Convertimos el precio a número puro
            $precioLimpio = floatval(preg_replace('/[^0-9.]/', '', str_replace(',', '.', (string)$precioRaw)));

            if ($precioLimpio <= 0) continue;

            $eurocode = ($indexes['eurocode'] !== null && isset($row[$indexes['eurocode']])) ? trim($row[$indexes['eurocode']]) : null;
            $nags = ($indexes['nags'] !== null && isset($row[$indexes['nags']])) ? trim($row[$indexes['nags']]) : null;
            $descripcion = isset($row[$indexes['descripcion']]) ? trim($row[$indexes['descripcion']]) : 'Sin descripción';

            // 1. Guardamos o actualizamos el producto
            $product = Product::updateOrCreate(
                [
                    'manufacturer_code' => $codigo,
                    'provider_id' => $this->providerId,
                ],
                [
                    'description' => $descripcion,
                    'eurocode' => $eurocode,
                    'nags' => $nags,
                    'type' => 'product',
                    'business_unit_id' => $this->businessUnitId,
                    'iva_id' => 1, 
                    'accounting_account_id' => 1, 
                    'last_price_update' => Carbon::now(),
                ]
            );

            // 2. Guardamos o actualizamos el precio en la lista específica
            ProductPrice::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'price_list_id' => $this->priceListId,
                ],
                [
                    'price' => $precioLimpio,
                ]
            );
        }
    }
}