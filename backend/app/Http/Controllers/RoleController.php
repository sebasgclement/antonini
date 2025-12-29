<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role; // Usamos tu modelo personalizado

class RoleController extends Controller
{
    /**
     * Listar roles (con buscador y paginación)
     */
    public function index(Request $request)
    {
        $query = Role::query();

        // Buscador
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
        }

        // Ordenar y paginar
        $roles = $query->orderBy('id', 'asc')->paginate(10);

        return response()->json($roles);
    }

    /**
     * Crear un nuevo rol
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|unique:roles,name|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $role = Role::create([
            'name' => $request->name,
            'description' => $request->description
        ]);

        return response()->json([
            'message' => 'Rol creado correctamente',
            'data' => $role
        ]);
    }

    /**
     * Mostrar un rol específico (para editar)
     */
    public function show($id)
    {
        $role = Role::findOrFail($id);
        return response()->json($role);
    }

    /**
     * Actualizar rol
     */
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'description' => 'nullable|string|max:500',
        ]);

        $role->update([
            'name' => $request->name,
            'description' => $request->description
        ]);

        return response()->json([
            'message' => 'Rol actualizado correctamente',
            'data' => $role
        ]);
    }

    /**
     * Eliminar rol
     */
    public function destroy($id)
    {
        $role = Role::findOrFail($id);

        // Protección básica para no borrar admin si fuera necesario
        if (strtolower($role->name) === 'admin') {
             return response()->json(['message' => 'No se puede eliminar el rol Admin'], 403);
        }

        $role->delete();

        return response()->json(['message' => 'Rol eliminado correctamente']);
    }
}