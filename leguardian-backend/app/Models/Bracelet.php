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
        'emergency_mode',
        'last_imu_data',
        'last_network_data',
        'last_imu_update',
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
        'emergency_mode' => 'boolean',
        'last_imu_data' => 'array',
        'last_network_data' => 'array',
        'last_imu_update' => 'datetime',
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
                    ->withPivot('role', 'can_edit', 'can_view_location', 'can_view_events', 'can_send_commands', 'shared_at', 'accepted_at', 'notification_preferences')
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

    public function trackingHistory()
    {
        return $this->hasMany(BraceletTrackingHistory::class);
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

    public function telemetryData()
    {
        return $this->hasMany(BraceletTelemetry::class);
    }

    public function updateTelemetry(array $telemetryData): void
    {
        // Parse timestamp
        $timestamp = $telemetryData['timestamp'] ?? now();
        if (is_string($timestamp)) {
            $timestamp = \Carbon\Carbon::parse($timestamp);
        }

        // Create telemetry record
        $this->telemetryData()->create([
            'timestamp' => $timestamp,
            'latitude' => $telemetryData['gps']['latitude'] ?? null,
            'longitude' => $telemetryData['gps']['longitude'] ?? null,
            'altitude' => $telemetryData['gps']['altitude'] ?? null,
            'satellites' => $telemetryData['gps']['satellites'] ?? null,
            'gps_date' => $telemetryData['gps']['date'] ?? null,
            'gps_time' => $telemetryData['gps']['time'] ?? null,
            'signal_csq' => $telemetryData['network']['signal_csq'] ?? null,
            'rsrp' => $telemetryData['network']['rsrp'] ?? null,
            'rsrq' => $telemetryData['network']['rsrq'] ?? null,
            'network_type' => $telemetryData['network']['type'] ?? null,
            'accel_x' => $telemetryData['imu']['accel']['x'] ?? null,
            'accel_y' => $telemetryData['imu']['accel']['y'] ?? null,
            'accel_z' => $telemetryData['imu']['accel']['z'] ?? null,
            'gyro_x' => $telemetryData['imu']['gyro']['x'] ?? null,
            'gyro_y' => $telemetryData['imu']['gyro']['y'] ?? null,
            'gyro_z' => $telemetryData['imu']['gyro']['z'] ?? null,
            'imu_temperature' => $telemetryData['imu']['temperature'] ?? null,
            'emergency_mode' => $telemetryData['emergency_mode'] ?? false,
        ]);

        // Build update data
        $updateData = [
            'status' => 'online',
            'last_ping_at' => $timestamp,
        ];

        // Update last known location on bracelet record
        if (isset($telemetryData['gps']['latitude']) && isset($telemetryData['gps']['longitude'])) {
            $updateData['last_latitude'] = $telemetryData['gps']['latitude'];
            $updateData['last_longitude'] = $telemetryData['gps']['longitude'];
            $updateData['last_accuracy'] = $telemetryData['gps']['altitude'] ?? null;
            $updateData['last_location_update'] = $timestamp;
        }

        // Update emergency mode status
        if (isset($telemetryData['emergency_mode'])) {
            $updateData['emergency_mode'] = $telemetryData['emergency_mode'];
        }

        // Update battery level if provided
        if (isset($telemetryData['battery_level'])) {
            $updateData['battery_level'] = $telemetryData['battery_level'];
        }

        // Perform single update with all data
        $this->update($updateData);
    }
}
