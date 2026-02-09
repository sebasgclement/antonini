<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InfoAutoLog extends Model
{
    use HasFactory;

    // Estos son los campos que permitimos llenar automáticamente
    protected $fillable = [
        'endpoint',     // Qué URL se pidió
        'method',       // GET, POST, etc.
        'status_code',  // 200 (OK), 403 (Error), etc.
    ];
}