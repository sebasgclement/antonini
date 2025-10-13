<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        // 🔹 Devuelve todos los roles directamente
        return Role::orderBy('id', 'asc')->get();
    }

    public function store(Request $req)
    {
        $data = $req->validate([
            'name' => 'required|string|unique:roles,name',
            'description' => 'nullable|string',
        ]);

        // 🔹 Devuelve el rol recién creado
        return Role::create($data);
    }

    public function show(Role $role)
    {
        // 🔹 Devuelve el rol directamente
        return $role;
    }

    public function update(Request $req, Role $role)
    {
        $data = $req->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
            'description' => 'nullable|string',
        ]);

        $role->update($data);

        // 🔹 Devuelve el rol actualizado
        return $role;
    }

    public function destroy(Role $role)
    {
        $role->delete();

        return response()->json(['ok' => true]);
    }
}
