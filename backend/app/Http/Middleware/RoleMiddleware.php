<?php

namespace App\Http\Middleware;

use Closure;

class RoleMiddleware
{
    public function handle($request, Closure $next, ...$roles)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['ok' => false, 'message' => 'No autenticado'], 401);
        }

        $userRoleNames = $user->roles()->pluck('name')->map(fn($n) => mb_strtolower($n))->all();

        
        foreach ($roles as $r) {
            if (in_array(mb_strtolower($r), $userRoleNames, true)) {
                return $next($request);
            }
        }

        return response()->json(['ok' => false, 'message' => 'No autorizado'], 403);
    }
}
