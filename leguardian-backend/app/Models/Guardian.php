<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Guardian extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'expo_push_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Old one-to-many relationship (bracelets owned by this guardian)
     * Kept for backward compatibility
     */
    public function bracelets()
    {
        return $this->hasMany(Bracelet::class);
    }

    /**
     * All bracelets accessible to this guardian (owned + shared)
     */
    public function allAccessibleBracelets()
    {
        return $this->belongsToMany(Bracelet::class, 'bracelet_guardian')
                    ->withPivot('role', 'can_edit', 'can_view_location', 'can_view_events', 'can_send_commands', 'shared_at', 'accepted_at')
                    ->withTimestamps();
    }

    /**
     * Bracelets owned by this guardian
     */
    public function ownedBracelets()
    {
        return $this->belongsToMany(Bracelet::class, 'bracelet_guardian')
                    ->wherePivot('role', 'owner')
                    ->withPivot('role', 'can_edit', 'can_view_location', 'can_view_events', 'can_send_commands', 'shared_at', 'accepted_at')
                    ->withTimestamps();
    }

    /**
     * Bracelets shared with this guardian
     */
    public function sharedBracelets()
    {
        return $this->belongsToMany(Bracelet::class, 'bracelet_guardian')
                    ->wherePivot('role', 'shared')
                    ->whereNotNull('accepted_at')
                    ->withPivot('role', 'can_edit', 'can_view_location', 'can_view_events', 'can_send_commands', 'shared_at', 'accepted_at')
                    ->withTimestamps();
    }

    /**
     * Pending sharing invitations
     */
    public function pendingBraceletInvitations()
    {
        return $this->belongsToMany(Bracelet::class, 'bracelet_guardian')
                    ->wherePivot('role', 'shared')
                    ->whereNull('accepted_at')
                    ->withPivot('role', 'can_edit', 'can_view_location', 'can_view_events', 'can_send_commands', 'shared_at', 'accepted_at')
                    ->withTimestamps();
    }
}
