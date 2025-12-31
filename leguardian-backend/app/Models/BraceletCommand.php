<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BraceletCommand extends Model
{
    use HasFactory;

    protected $fillable = [
        'bracelet_id',
        'command_type',
        'status',
        'executed_at',
        'led_color',
        'led_pattern',
        'metadata',
    ];

    protected $casts = [
        'executed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'metadata' => 'array',
    ];

    // Relations
    public function bracelet()
    {
        return $this->belongsTo(Bracelet::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeExecuted($query)
    {
        return $query->where('status', 'executed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }
}
