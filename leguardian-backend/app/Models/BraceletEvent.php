<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BraceletEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'bracelet_id',
        'event_type',
        'latitude',
        'longitude',
        'accuracy',
        'battery_level',
        'resolved',
        'resolved_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'accuracy' => 'integer',
        'battery_level' => 'integer',
        'resolved' => 'boolean',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    // Relations
    public function bracelet()
    {
        return $this->belongsTo(Bracelet::class);
    }

    // Scopes
    public function scopeUnresolved($query)
    {
        return $query->where('resolved', false);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('event_type', $type);
    }

    public function scopeRecent($query)
    {
        return $query->orderByDesc('created_at');
    }
}
