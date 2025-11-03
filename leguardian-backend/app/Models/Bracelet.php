<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Bracelet extends Model
{
    use HasFactory;

    protected $fillable = [
        'guardian_id',
        'unique_code',
        'name',
        'alias',
        'status',
        'battery_level',
        'last_ping_at',
        'firmware_version',
        'paired_at',
        'is_paired',
    ];

    protected $casts = [
        'battery_level' => 'integer',
        'last_ping_at' => 'datetime',
        'paired_at' => 'datetime',
        'is_paired' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relations
    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function events()
    {
        return $this->hasMany(BraceletEvent::class);
    }

    public function commands()
    {
        return $this->hasMany(BraceletCommand::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInEmergency($query)
    {
        return $query->where('status', 'emergency');
    }

    public function scopePaired($query)
    {
        return $query->where('is_paired', true)->whereNotNull('guardian_id');
    }

    public function scopeUnpaired($query)
    {
        return $query->where('is_paired', false)->whereNull('guardian_id');
    }
}
