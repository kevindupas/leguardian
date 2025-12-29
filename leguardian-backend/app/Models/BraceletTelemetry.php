<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BraceletTelemetry extends Model
{
    use HasFactory;

    protected $table = 'bracelet_telemetry';

    protected $fillable = [
        'bracelet_id',
        'timestamp',
        'latitude',
        'longitude',
        'altitude',
        'satellites',
        'gps_date',
        'gps_time',
        'signal_csq',
        'rsrp',
        'rsrq',
        'network_type',
        'accel_x',
        'accel_y',
        'accel_z',
        'gyro_x',
        'gyro_y',
        'gyro_z',
        'imu_temperature',
        'emergency_mode',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
        'altitude' => 'float',
        'satellites' => 'integer',
        'signal_csq' => 'integer',
        'accel_x' => 'float',
        'accel_y' => 'float',
        'accel_z' => 'float',
        'gyro_x' => 'float',
        'gyro_y' => 'float',
        'gyro_z' => 'float',
        'imu_temperature' => 'float',
        'emergency_mode' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function bracelet()
    {
        return $this->belongsTo(Bracelet::class);
    }
}
