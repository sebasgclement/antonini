<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\ProductsImport;
use App\Models\Provider;
use App\Models\PriceList; // <-- AGREGAMOS ESTO

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('infoauto:sync-brands')->dailyAt('03:00');

Artisan::command('cristales:importar {archivo} {lista_id}', function ($archivo, $lista_id) {
    $this->info("Iniciando la magia... Leyendo el archivo: {$archivo}");

    // Ahora busca el nombre de archivo que vos le pases
    $file = storage_path('app/' . $archivo);

    if (!file_exists($file)) {
        $this->error("¡Pausa! No encontré el archivo '{$archivo}' en la carpeta storage/app/");
        return;
    }

    // Buscamos la lista de precios por el ID que le pases
    $priceList = App\Models\PriceList::find($lista_id);
    
    if (!$priceList) {
        $this->error("La lista de precios con el ID {$lista_id} no existe en la base de datos.");
        return;
    }

    try {
        // Sacamos el proveedor directamente de la lista de precios
        $providerId = $priceList->provider_id;

        Excel::import(new App\Imports\ProductsImport($providerId, $priceList->id), $file);
        $this->info('¡Golazo! Todos los cristales fueron importados a la lista: ' . $priceList->name);
    } catch (\Exception $e) {
        $this->error('Hubo un error al procesar el Excel: ' . $e->getMessage());
    }
})->purpose('Importa cualquier catálogo de cristales indicando el archivo y el ID de la lista');