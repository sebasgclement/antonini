<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReceptionStoreRequest;
use App\Models\Reception;
use Illuminate\Http\Request;

class ReceptionController extends Controller
{
    // POST /api/receptions
    public function store(ReceptionStoreRequest $request)
    {
        $u  = $request->user();                 // usuario autenticado
        $c  = $request->input('customer', []);  // { id?, name?, email?, phone? }
        $v  = $request->input('vehicle',  []);  // { brand, model, year?, plate?, vin?, color?, km?, fuel_level? }
        $ch = $request->input('checklist', []); // { spare?, jack?, docs? }

        $rec = Reception::create([
            'received_by'   => $u?->id,
            'customer_id'   => $c['id']    ?? null,
            'customer_name' => $c['name']  ?? null,
            'customer_email'=> $c['email'] ?? null,
            'customer_phone'=> $c['phone'] ?? null,

            'brand' => $v['brand'],
            'model' => $v['model'],
            'year'  => $v['year']  ?? null,
            'plate' => $v['plate'] ?? null,
            'vin'   => $v['vin']   ?? null,
            'color' => $v['color'] ?? null,
            'km'    => $v['km']    ?? null,
            'fuel_level' => $v['fuel_level'] ?? null,

            'check_spare' => (bool)($ch['spare'] ?? true),
            'check_jack'  => (bool)($ch['jack']  ?? true),
            'check_docs'  => (bool)($ch['docs']  ?? true),

            'notes'  => (string)($request->input('notes') ?? ''),
            'status' => 'received',
        ]);

        return response()->json(['ok' => true, 'data' => $rec], 201);
    }

    // (Opcional) GET /api/receptions para listar
    public function index(Request $request)
    {
        $list = Reception::with(['user:id,name', 'customer:id']) // trae mín. relaciones
            ->latest()
            ->paginate(10);

        return response()->json(['ok' => true, 'data' => $list]);
    }
}
