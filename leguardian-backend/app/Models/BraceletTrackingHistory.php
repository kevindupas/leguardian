<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BraceletTrackingHistory extends Model
{
    use HasFactory;

    protected $table = 'bracelet_tracking_history';

    protected $fillable = [
        'bracelet_id',
        'latitude',
        'longitude',
        'altitude',
        'accuracy',
        'satellites',
        'speed',
        'device_timestamp',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'altitude' => 'decimal:2',
        'accuracy' => 'integer',
        'satellites' => 'integer',
        'speed' => 'decimal:2',
        'device_timestamp' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relations
    public function bracelet()
    {
        return $this->belongsTo(Bracelet::class);
    }

    // Scopes
    public function scopeForBracelet($query, $braceletId)
    {
        return $query->where('bracelet_id', $braceletId);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeWithValidLocation($query)
    {
        return $query->whereNotNull('latitude')->whereNotNull('longitude');
    }

    public function scopeOrderedByTime($query)
    {
        return $query->orderByDesc('device_timestamp')->orderByDesc('created_at');
    }
}
