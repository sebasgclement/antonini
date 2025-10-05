<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use App\Http\Requests\CustomerStoreRequest;
use App\Http\Requests\CustomerUpdateRequest;
use Illuminate\Support\Facades\Storage;

class CustomerController extends Controller
{
    // GET /api/customers?search=&page=  o /api/customers?dni=12345678
    public function index(Request $request)
    {
        // 🔹 Búsqueda directa por DNI
        if ($request->filled('dni')) {
            $dni = trim($request->query('dni'));
            $customer = Customer::where('doc_number', $dni)->first();

            return response()->json([
                'ok' => true,
                'data' => $customer ? [$customer] : []
            ]);
        }

        // 🔹 Búsqueda general
        $term = (string) $request->query('search', '');

        $rows = Customer::query()
            ->when($term, function ($q) use ($term) {
                $q->where(function ($qq) use ($term) {
                    $qq->where('first_name', 'like', "%$term%")
                       ->orWhere('last_name', 'like', "%$term%")
                       ->orWhere('email', 'like', "%$term%")
                       ->orWhere('doc_number', 'like', "%$term%")
                       ->orWhere('cuit', 'like', "%$term%")
                       ->orWhere('phone', 'like', "%$term%")
                       ->orWhere('alt_phone', 'like', "%$term%")
                       ->orWhere('city', 'like', "%$term%");
                });
            })
            ->latest()
            ->paginate(10);

        return response()->json(['ok' => true, 'data' => $rows]);
    }

    // POST /api/customers
    public function store(CustomerStoreRequest $req)
    {
        $data = $req->validated();

        // 🖼️ Guardar archivos si existen
        if ($req->hasFile('dni_front')) {
            $data['dni_front'] = $req->file('dni_front')->store('dni', 'public');
        }
        if ($req->hasFile('dni_back')) {
            $data['dni_back'] = $req->file('dni_back')->store('dni', 'public');
        }

        $c = Customer::create($data);

        return response()->json(['ok' => true, 'data' => $c], 201);
    }

    // GET /api/customers/{id}
    public function show(Customer $customer)
    {
        // 🔹 Incluir URLs absolutas de las imágenes
        $customer->dni_front_url = $customer->dni_front ? asset('storage/' . $customer->dni_front) : null;
        $customer->dni_back_url  = $customer->dni_back  ? asset('storage/' . $customer->dni_back)  : null;

        return response()->json(['ok' => true, 'data' => $customer]);
    }

    // PUT /api/customers/{id}
    public function update(CustomerUpdateRequest $req, Customer $customer)
    {
        $data = $req->validated();

        // 🗑️ Eliminar imágenes si se pidió
        if ($req->has('delete_dni_front')) {
            Storage::disk('public')->delete($customer->dni_front);
            $customer->dni_front = null;
        }
        if ($req->has('delete_dni_back')) {
            Storage::disk('public')->delete($customer->dni_back);
            $customer->dni_back = null;
        }

        // 🖼️ Subir nuevas imágenes si se enviaron
        if ($req->hasFile('dni_front')) {
            // eliminar la anterior si existe
            if ($customer->dni_front) {
                Storage::disk('public')->delete($customer->dni_front);
            }
            $data['dni_front'] = $req->file('dni_front')->store('dni', 'public');
        }

        if ($req->hasFile('dni_back')) {
            if ($customer->dni_back) {
                Storage::disk('public')->delete($customer->dni_back);
            }
            $data['dni_back'] = $req->file('dni_back')->store('dni', 'public');
        }

        $customer->update($data);

        return response()->json(['ok' => true, 'data' => $customer]);
    }


    // DELETE /api/customers/{id}
    public function destroy(Customer $customer)
    {
        // 🧹 Eliminar imágenes asociadas si existen
        if ($customer->dni_front) {
            Storage::disk('public')->delete($customer->dni_front);
        }
        if ($customer->dni_back) {
            Storage::disk('public')->delete($customer->dni_back);
        }

        $customer->delete();

        return response()->json(['ok' => true]);
    }
}
