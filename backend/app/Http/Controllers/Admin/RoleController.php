<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        return response()->json(['ok' => true, 'data' => Role::all()]);
    }

    public function store(Request $req)
    {
        $data = $req->validate([
            'name' => 'required|string|unique:roles,name',
            'description' => 'nullable|string',
        ]);

        $role = Role::create($data);

        return response()->json(['ok' => true, 'data' => $role], 201);
    }

    public function show(Role $role)
    {
        return response()->json(['ok' => true, 'data' => $role]);
    }

    public function update(Request $req, Role $role)
    {
        $data = $req->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
            'description' => 'nullable|string',
        ]);

        $role->update($data);

        return response()->json(['ok' => true, 'data' => $role]);
    }

    public function destroy(Role $role)
    {
        $role->delete();

        return response()->json(['ok' => true]);
    }
}
