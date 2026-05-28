<?php

namespace App\Imports;

use App\Models\{Product, ProductPrice};
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class ProductsImport implements ToCollection, WithCustomCsvSettings, WithChunkReading
{
    protected $providerId;
    protected $priceListId;
    protected $businessUnitId;
    protected $ivaId;
    protected $accountingAccountId;
    protected $category;

    protected $headersFound = false;
    protected $colCodigo    = null;
    protected $colDesc      = null;
    protected $colPrecio    = null;

    public function __construct($providerId, $priceListId, $businessUnitId, $ivaId, $accountingAccountId, $category = null)
    {
        $this->providerId           = $providerId;
        $this->priceListId          = $priceListId;
        $this->businessUnitId       = $businessUnitId;
        $this->ivaId                = $ivaId;
        $this->accountingAccountId  = $accountingAccountId;
        $this->category             = $category;
    }

    public function getCsvSettings(): array
    {
        return ['delimiter' => ';'];
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function collection(Collection $rows)
    {
        $now   = Carbon::now();
        $batch = [];

        foreach ($rows as $row) {
            $rowData = $row->toArray();

            if (!$this->headersFound) {
                $this->escanearCabeceras($rowData);
                continue;
            }

            if ($this->colCodigo === null || $this->colPrecio === null) continue;

            $codigo = trim((string)($rowData[$this->colCodigo] ?? ''));
            if (empty($codigo)) continue;

            $precioRaw  = trim((string)($rowData[$this->colPrecio] ?? '0'));
            $limpio     = preg_replace('/[^\d,]/', '', $precioRaw);
            $precio     = floatval(str_replace(',', '.', $limpio));
            if ($precio <= 0) continue;

            $batch[$codigo] = [
                'desc'  => trim((string)($rowData[$this->colDesc] ?? '')) ?: 'Producto importado',
                'price' => $precio,
            ];
        }

        if (empty($batch)) return;

        $codigos = array_keys($batch);

        // 1 sola query para saber qué productos ya existen
        $existentes = Product::whereIn('manufacturer_code', $codigos)
            ->where('provider_id', $this->providerId)
            ->pluck('id', 'manufacturer_code');

        $nuevos    = [];
        $isList1   = ($this->priceListId == 1);

        foreach ($batch as $codigo => $data) {
            if ($existentes->has($codigo)) continue;

            $nuevos[] = [
                'manufacturer_code'    => $codigo,
                'provider_id'          => $this->providerId,
                'description'          => $data['desc'],
                'type'                 => 'product',
                'sale_price'           => $isList1 ? $data['price'] : 0,
                'last_price_update'    => $isList1 ? $now : null,
                'business_unit_id'     => $this->businessUnitId,
                'iva_id'               => $this->ivaId,
                'accounting_account_id'=> $this->accountingAccountId,
                'category'             => $this->category,
                'stock_official'       => 0,
                'stock_internal'       => 0,
                'created_at'           => $now,
                'updated_at'           => $now,
            ];
        }

        // Bulk insert productos nuevos (1 query)
        if (!empty($nuevos)) {
            foreach (array_chunk($nuevos, 200) as $chunk) {
                Product::insert($chunk);
            }
        }

        // Actualizar productos existentes que necesitan precio (lista 1 únicamente)
        if ($isList1 && $existentes->isNotEmpty()) {
            foreach ($existentes as $codigo => $id) {
                if (!isset($batch[$codigo])) continue;
                Product::where('id', $id)->update([
                    'sale_price'        => $batch[$codigo]['price'],
                    'last_price_update' => $now,
                    'updated_at'        => $now,
                ]);
            }
        }

        // Obtener IDs definitivos (nuevos + existentes) en 1 query
        $todosIds = Product::whereIn('manufacturer_code', $codigos)
            ->where('provider_id', $this->providerId)
            ->pluck('id', 'manufacturer_code');

        // Bulk upsert precios (1 query)
        $precios = [];
        foreach ($batch as $codigo => $data) {
            if (!$todosIds->has($codigo)) continue;
            $precios[] = [
                'product_id'   => $todosIds[$codigo],
                'price_list_id'=> $this->priceListId,
                'price'        => $data['price'],
                'created_at'   => $now,
                'updated_at'   => $now,
            ];
        }

        if (!empty($precios)) {
            foreach (array_chunk($precios, 200) as $chunk) {
                ProductPrice::upsert($chunk, ['product_id', 'price_list_id'], ['price', 'updated_at']);
            }
        }
    }

    private function escanearCabeceras(array $row): void
    {
        $tempCodigo = $tempDesc = $tempPrecio = null;

        foreach ($row as $index => $cell) {
            if (empty($cell)) continue;
            $texto = strtolower(trim((string)$cell));
            $texto = str_replace(
                ['á','é','í','ó','ú','ä','ë','ï','ö','ü'],
                ['a','e','i','o','u','a','e','i','o','u'],
                $texto
            );

            if ($tempCodigo === null && (str_contains($texto, 'codigo') || str_contains($texto, 'cod') || str_contains($texto, 'articulo'))) {
                $tempCodigo = $index;
            } elseif ($tempDesc === null && (str_contains($texto, 'descrip') || str_contains($texto, 'detalle') || str_contains($texto, 'producto'))) {
                $tempDesc = $index;
            } elseif ($tempPrecio === null && (str_contains($texto, 'precio') || str_contains($texto, 'importe') || str_contains($texto, 'venta') || str_contains($texto, 'neto'))) {
                $tempPrecio = $index;
            }
        }

        if ($tempCodigo !== null && $tempPrecio !== null) {
            $this->colCodigo    = $tempCodigo;
            $this->colPrecio    = $tempPrecio;
            $this->colDesc      = $tempDesc ?? $tempCodigo;
            $this->headersFound = true;
        }
    }
}
