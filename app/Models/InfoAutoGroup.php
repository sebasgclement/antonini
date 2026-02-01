<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InfoAutoGroup extends Model
{
    use HasFactory;

    protected $table = 'info_auto_groups';

    // Esto permite guardar cualquier dato sin errores de asignación masiva
    protected $guarded = [];

    public function brand()
    {
        return $this->belongsTo(InfoAutoBrand::class);
    }
    
    public function models()
    {
        return $this->hasMany(InfoAutoModel::class, 'group_id');
    }
}