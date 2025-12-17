<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
        'last_latitude',
        'last_longitude',
        'last_accuracy',
        'last_location_update',
    ];

    protected $casts = [
        'battery_level' => 'integer',
        'last_ping_at' => 'datetime',
        'paired_at' => 'datetime',
        'is_paired' => 'boolean',
        'last_latitude' => 'float',
        'last_longitude' => 'float',
        'last_accuracy' => 'integer',
        'last_location_update' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relations

    /**
     * Old one-to-many relationship (kept for backward compatibility)
     * Will be deprecated once migration is complete
     */
    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    /**
     * New many-to-many relationship with permissions
     */
    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(Guardian::class, 'bracelet_guardian')
                    ->withPivot('role', 'can_edit', 'can_view_location', 'can_view_events', 'can_send_commands', 'shared_at', 'accepted_at')
                    ->withTimestamps();
    }

    /**
     * Get the owner of the bracelet
     */
    public function owner()
    {
        return $this->guardians()->wherePivot('role', 'owner')->first();
    }

    /**
     * Check if guardian has access to this bracelet
     */
    public function hasGuardian(Guardian $guardian)
    {
        return $this->guardians()->where('guardians.id', $guardian->id)->exists();
    }

    /**
     * Check if guardian can perform a specific action
     */
    public function canGuardian(Guardian $guardian, string $permission)
    {
        $relation = $this->guardians()
            ->where('guardians.id', $guardian->id)
            ->first();

        if (!$relation) {
            return false;
        }

        return (bool)$relation->pivot->{$permission};
    }

    public function events()
    {
        return $this->hasMany(BraceletEvent::class);
    }

    public function commands()
    {
        return $this->hasMany(BraceletCommand::class);
    }

    public function safetyZones()
    {
        return $this->hasMany(SafetyZone::class);
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
