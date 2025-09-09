<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;

class CustomerController extends Controller
{
    public function register(Request $req) {
        $data = $req->validate([
            'first_name'=>'required|string|max:80',
            'last_name' =>'required|string|max:80',
            'doc_type'  =>'nullable|string|max:10',
            'doc_number'=>'nullable|string|max:20',
            'cuit'      =>'nullable|string|max:20',
            'email'     =>'nullable|email',
            'phone'     =>'nullable|string|max:40',
            'alt_phone' =>'nullable|string|max:40',
            'city'      =>'nullable|string|max:80',
            'address'   =>'nullable|string|max:160',
            'notes'     =>'nullable|string',
        ]);

        $c = Customer::create($data);
        return response()->json(['ok'=>true,'customer'=>$c], 201);
    }
}
