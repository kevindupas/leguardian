<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BraceletLocationHistory extends Model
{
    protected $table = 'bracelet_location_history';

    protected $fillable = [
        'bracelet_id',
        'location_data',
        'source_type',
        'recorded_at',
    ];

    protected $casts = [
        'location_data' => 'array',
        'recorded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the bracelet that owns this location history
     */
    public function bracelet(): BelongsTo
    {
        return $this->belongsTo(Bracelet::class);
    }

    /**
     * Scope to get recent locations (within last X hours)
     */
    public function scopeRecent($query, $hours = 24)
    {
        return $query->where('recorded_at', '>=', now()->subHours($hours));
    }

    /**
     * Scope to get last N locations
     */
    public function scopeLimit($query, $limit = 30)
    {
        return $query->latest('recorded_at')->limit($limit);
    }
}
