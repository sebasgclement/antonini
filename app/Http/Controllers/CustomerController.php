<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use App\Http\Requests\CustomerStoreRequest;
use App\Http\Requests\CustomerUpdateRequest;

class CustomerController extends Controller
{
    // GET /api/customers?search=&page=
    public function index(Request $request)
    {
        $term = (string) $request->query('search', '');

        $rows = Customer::query()
            ->when($term, function ($q) use ($term) {
                $q->where(function ($qq) use ($term) {
                    $qq->where('first_name','like',"%$term%")
                       ->orWhere('last_name','like',"%$term%")
                       ->orWhere('email','like',"%$term%")
                       ->orWhere('doc_number','like',"%$term%")
                       ->orWhere('cuit','like',"%$term%")
                       ->orWhere('phone','like',"%$term%")
                       ->orWhere('alt_phone','like',"%$term%")
                       ->orWhere('city','like',"%$term%");
                });
            })
            ->latest()
            ->paginate(10);

        return response()->json(['ok' => true, 'data' => $rows]);
    }

    // POST /api/customers  (antes register)
    public function store(CustomerStoreRequest $req)
    {
        $c = Customer::create($req->validated());
        return response()->json(['ok'=>true, 'data'=>$c], 201);
    }

    // GET /api/customers/{id}
    public function show(Customer $customer)
    {
        return response()->json(['ok'=>true, 'data'=>$customer]);
    }

    // PUT /api/customers/{id}
    public function update(CustomerUpdateRequest $req, Customer $customer)
    {
        $customer->update($req->validated());
        return response()->json(['ok'=>true, 'data'=>$customer]);
    }

    // DELETE /api/customers/{id}
    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->json(['ok'=>true]);
    }
}
