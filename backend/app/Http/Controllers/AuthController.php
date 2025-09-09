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

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'ok' => false,
                'message' => 'Credenciales inválidas',
            ], 401);
        }

        
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'ok'    => true,
            'user'  => $user,
            'token' => $token,
        ], 200);
    }

    public function logout(Request $req)
    {
        
        $req->user()->currentAccessToken()->delete();

        return response()->json(['ok' => true]);
    }
}
