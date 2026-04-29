<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\ProductsImport;
use Illuminate\Support\Facades\Log;

class ImportController extends Controller
{
    public function import(Request $request)
    {
        
        set_time_limit(900);
        ini_set('memory_limit', '1024M');
        
        $request->validate([
            'archivo' => 'required|file',
            'provider_id' => 'required|exists:providers,id',
            'price_list_id' => 'required',
            'business_unit_id' => 'required|exists:business_units,id',
            'iva_id' => 'required|exists:ivas,id',
            'accounting_account_id' => 'required|exists:accounting_accounts,id',
            'category' => 'nullable|string'
        ]);

        try {
            $providerId = $request->input('provider_id');
            $priceListId = $request->input('price_list_id');
            $businessUnitId = $request->input('business_unit_id');
            $ivaId = $request->input('iva_id');
            $accountingAccountId = $request->input('accounting_account_id');
            $category = $request->input('category');

            
            Excel::import(
                new ProductsImport(
                    $providerId, 
                    $priceListId, 
                    $businessUnitId, 
                    $ivaId, 
                    $accountingAccountId, 
                    $category
                ), 
                $request->file('archivo')
            );

            return response()->json(['message' => '¡Importación completada con éxito!'], 200);

        } catch (\Exception $e) {
            Log::error("Error importando Excel: " . $e->getMessage());
            return response()->json(['error' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}