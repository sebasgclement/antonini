<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountingRole
{
    public function handle(Request $request, Closure $next): Response
    {
        // Verificamos si el usuario está logueado y si su rol es 'admin_contable'
        // Esto usa la columna 'role' que vimos que ya tenés en tu tabla 'users'
        if (auth()->check() && auth()->user()->role === 'admin_contable') {
            return $next($request);
        }

        // Si no es contable, le rebotamos la petición con un 403 (Prohibido)
        return response()->json([
            'error' => 'Acceso denegado. Se requieren permisos de administración contable.'
        ], 403);
    }
}