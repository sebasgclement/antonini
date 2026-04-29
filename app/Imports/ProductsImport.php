<?php

namespace App\Imports;

use App\Models\{Product, ProductPrice, PriceList};
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Row;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Carbon\Carbon;

class ProductsImport implements OnEachRow, WithCustomCsvSettings, WithChunkReading
{
    protected $providerId;
    protected $priceListId;
    protected $businessUnitId;
    protected $ivaId;
    protected $accountingAccountId;
    protected $category;

    // Variables para el buscador inteligente
    protected $headersFound = false;
    protected $colCodigo = null;
    protected $colDesc = null;
    protected $colPrecio = null;

    public function __construct($providerId, $priceListId, $businessUnitId, $ivaId, $accountingAccountId, $category = null)
    {
        $this->providerId = $providerId;
        $this->priceListId = $priceListId;
        $this->businessUnitId = $businessUnitId;
        $this->ivaId = $ivaId;
        $this->accountingAccountId = $accountingAccountId;
        $this->category = $category;
    }

    public function getCsvSettings(): array
    {
        return ['delimiter' => ';'];
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function onRow(Row $row)
    {
        $rowData = $row->toArray();

        // 1. Escaneamos cabeceras
        if (!$this->headersFound) {
            $this->escanearCabeceras($rowData);
            return;
        }

        // 2. Procesamiento seguro
        if ($this->colCodigo === null || $this->colPrecio === null) {
            return;
        }

        $codigo      = trim((string)($rowData[$this->colCodigo] ?? ''));
        $descripcion = trim((string)($rowData[$this->colDesc] ?? ''));
        $precioRaw   = trim((string)($rowData[$this->colPrecio] ?? '0'));

        if (empty($codigo)) {
            return;
        }

        // LIMPIEZA DE PRECIO
        $limpio = preg_replace('/[^\d,]/', '', $precioRaw);
        $precioFinal = floatval(str_replace(',', '.', $limpio));

        if ($precioFinal <= 0) return;

        // 3. PREPARAMOS DATOS BASE (Configuración por lote del formulario)
        $updateData = [
            'description' => $descripcion ?: 'Producto importado',
            'type' => 'product',
            'business_unit_id' => $this->businessUnitId,
            'iva_id' => $this->ivaId,
            'accounting_account_id' => $this->accountingAccountId,
            'category' => $this->category,
        ];

        // 4. LÓGICA INTELIGENTE DE PRECIOS
        // Buscamos si el producto ya existe
        $productoExistente = Product::where('manufacturer_code', $codigo)
                                    ->where('provider_id', $this->providerId)
                                    ->first();

        if (!$productoExistente) {
            // Si es un producto NUEVO y estamos importando la Lista 1, le ponemos el precio base.
            // Si es la Lista 2 (Federación), el precio base general queda en 0 (porque no lo conocemos)
            // pero se guardará correctamente en la tabla de listas.
            $updateData['sale_price'] = ($this->priceListId == 1) ? $precioFinal : 0;
            if ($this->priceListId == 1) {
                $updateData['last_price_update'] = Carbon::now();
            }
        } else {
            // Si el producto YA EXISTE, SOLO pisamos su precio principal si es la Lista 1
            if ($this->priceListId == 1) {
                $updateData['sale_price'] = $precioFinal;
                $updateData['last_price_update'] = Carbon::now();
            }
        }

        // Guardamos el producto principal
        $product = Product::updateOrCreate(
            ['manufacturer_code' => $codigo, 'provider_id' => $this->providerId],
            $updateData
        );

        // Guardamos el precio en la tabla Multilistas (Esto funciona siempre, sea la lista 1, 2, 3 o 100)
        ProductPrice::updateOrCreate(
            ['product_id' => $product->id, 'price_list_id' => $this->priceListId],
            ['price' => $precioFinal]
        );
    }

    /**
     * Buscador de columnas
     */
    private function escanearCabeceras(array $row)
    {
        $tempCodigo = null;
        $tempDesc   = null;
        $tempPrecio = null;

        foreach ($row as $index => $cell) {
            if (empty($cell)) continue;

            $texto = strtolower(trim((string)$cell));
            $texto = str_replace(
                ['á', 'é', 'í', 'ó', 'ú', 'ä', 'ë', 'ï', 'ö', 'ü'], 
                ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u'], 
                $texto
            );

            if ($tempCodigo === null && (str_contains($texto, 'codigo') || str_contains($texto, 'cod') || str_contains($texto, 'articulo'))) {
                $tempCodigo = $index;
            } 
            elseif ($tempDesc === null && (str_contains($texto, 'descrip') || str_contains($texto, 'detalle') || str_contains($texto, 'producto'))) {
                $tempDesc = $index;
            } 
            elseif ($tempPrecio === null && (str_contains($texto, 'precio') || str_contains($texto, 'importe') || str_contains($texto, 'venta') || str_contains($texto, 'neto'))) {
                $tempPrecio = $index;
            }
        }

        if ($tempCodigo !== null && $tempPrecio !== null) {
            $this->colCodigo = $tempCodigo;
            $this->colPrecio = $tempPrecio;
            $this->colDesc   = $tempDesc !== null ? $tempDesc : $tempCodigo;
            
            $this->headersFound = true; 
        }
    }
}