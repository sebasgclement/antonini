<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'mail_address', 'imap_password'];

    protected $hidden = ['password', 'remember_token', 'imap_password'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'imap_password'     => 'encrypted',
        ];
    }

    
    public function roles()
    {
        
        return $this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'seller_id');
    }

    public function isAdmin(): bool
    {
        return $this->id === 1 || $this->roles()->whereRaw('LOWER(name) = ?', ['admin'])->exists();
    }

}
