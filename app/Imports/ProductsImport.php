<?php

namespace App\Imports;

use App\Models\{Product, ProductPrice, PriceList};
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Row;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class ProductsImport implements OnEachRow, WithCustomCsvSettings, WithChunkReading
{
    protected $providerId;
    protected $priceListId;
    protected $businessUnitId;
    protected $ivaId;
    protected $accountingAccountId;
    protected $category;
    protected $listCreated = false;

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
        // 1. Aseguramos la existencia de la lista de precios (Salvavidas por si no existe en la DB)
        if (!$this->listCreated) {
            Schema::disableForeignKeyConstraints();
            PriceList::updateOrCreate(
                ['id' => $this->priceListId],
                ['name' => 'Lista de Precios ' . $this->priceListId]
            );
            $this->listCreated = true;
        }

        $rowData = $row->toArray();

        // 2. Si todavía no encontramos las cabeceras, escaneamos esta fila
        if (!$this->headersFound) {
            $this->escanearCabeceras($rowData);
            return;
        }

        // 3. Procesamiento de datos seguro
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

        // 4. PREPARAMOS LOS DATOS BASE DEL PRODUCTO
        $updateData = [
            'description' => $descripcion ?: 'Producto importado',
            'type' => 'product', 
            'business_unit_id' => $this->businessUnitId,
            'iva_id' => $this->ivaId,
            'accounting_account_id' => $this->accountingAccountId,
            'category' => $this->category,
        ];

        // REGLA DE ORO: Solo pisamos el precio principal de venta general si es la Lista 1
        if ($this->priceListId == 1) {
            $updateData['sale_price'] = $precioFinal;
            $updateData['last_price_update'] = Carbon::now();
        }

        // Guardamos o actualizamos el producto
        $product = Product::updateOrCreate(
            ['manufacturer_code' => $codigo, 'provider_id' => $this->providerId],
            $updateData
        );

        // 5. GUARDAMOS EL PRECIO MULTILISTA
        // Esto siempre se ejecuta y asocia el precio a la lista correspondiente (1, 2, 3, etc.)
        ProductPrice::updateOrCreate(
            ['product_id' => $product->id, 'price_list_id' => $this->priceListId],
            ['price' => $precioFinal]
        );
    }

    /**
     * Función que actúa como "humano" buscando las columnas
     */
    private function escanearCabeceras(array $row)
    {
        $tempCodigo = null;
        $tempDesc   = null;
        $tempPrecio = null;

        foreach ($row as $index => $cell) {
            if (empty($cell)) continue;

            // Limpiamos la celda: pasamos a minúsculas y quitamos tildes para no fallar
            $texto = strtolower(trim((string)$cell));
            $texto = str_replace(
                ['á', 'é', 'í', 'ó', 'ú', 'ä', 'ë', 'ï', 'ö', 'ü'], 
                ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u'], 
                $texto
            );

            // Buscamos sinónimos
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

        // Si encontró "código" y "precio", asume que ES la cabecera
        if ($tempCodigo !== null && $tempPrecio !== null) {
            $this->colCodigo = $tempCodigo;
            $this->colPrecio = $tempPrecio;
            $this->colDesc   = $tempDesc !== null ? $tempDesc : $tempCodigo;
            
            $this->headersFound = true; 
        }
    }
}