<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// 🔥 ESTA ES LA CLAVE DEL 403
// El nombre 'admin-notifications' debe coincidir con el del Frontend
Broadcast::channel('admin-notifications', function ($user) {
    // Si el usuario está logueado (Auth::check()), $user existe.
    // Retornamos TRUE para dejarlo pasar sí o sí y probar.
    return true; 
    
    // Más adelante podés poner: return $user->isAdmin;
});