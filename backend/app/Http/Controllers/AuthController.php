<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $req)
    {
        $data = $req->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json([
                'ok' => false,
                'message' => 'Credenciales inválidas',
            ], 401);
        }

        
        $token = $user->createToken('api')->plainTextToken;

        
        $user->loadMissing(['roles:id,name']);

        return response()->json([
            'ok'    => true,
            'user'  => $user,
            'token' => $token,
        ], 200);
    }

    public function me(Request $req)
    {
        $user = $req->user()->loadMissing('roles:id,name');
        return response()->json(['ok' => true, 'user' => $user]);
    }

    public function logout(Request $req)
    {
        // Si venís con token Bearer:
        if ($req->user() && $req->user()->currentAccessToken()) {
            $req->user()->currentAccessToken()->delete();
        }

        // Si venís con cookie de sesión (opcional):
        if ($req->hasSession()) {
            auth()->guard('web')->logout();
            $req->session()->invalidate();
            $req->session()->regenerateToken();
        }

        return response()->json(['ok' => true]);
    }

    public function changePassword(Request $req)
{
    $req->validate([
        'current_password' => ['required'],
        'new_password' => ['required', 'min:6'],
    ]);

    $user = $req->user();

    // 🔐 Verificar la contraseña actual
    if (!Hash::check($req->current_password, $user->password)) {
        return response()->json([
            'ok' => false,
            'message' => 'La contraseña actual no es correcta.',
        ], 422);
    }

    // 🔄 Actualizar
    $user->password = Hash::make($req->new_password);
    $user->save();

    return response()->json([
        'ok' => true,
        'message' => 'Contraseña actualizada correctamente ✅',
    ]);
}

}
