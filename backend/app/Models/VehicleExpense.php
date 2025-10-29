<?php
// app/Models/VehicleExpense.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleExpense extends Model
{
    protected $fillable = ['vehicle_id','description','amount','date','status'];

    protected $casts = [
        'date' => 'date',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
