<?php

namespace App\Policies;

use App\Models\Bracelet;
use App\Models\Guardian;

class BraceletPolicy
{
    /**
     * Determine if the guardian can view the bracelet
     */
    public function view(Guardian $guardian, Bracelet $bracelet): bool
    {
        return $bracelet->hasGuardian($guardian);
    }

    /**
     * Determine if the guardian can view the bracelet's location
     */
    public function viewLocation(Guardian $guardian, Bracelet $bracelet): bool
    {
        return $bracelet->canGuardian($guardian, 'can_view_location');
    }

    /**
     * Determine if the guardian can view the bracelet's events
     */
    public function viewEvents(Guardian $guardian, Bracelet $bracelet): bool
    {
        return $bracelet->canGuardian($guardian, 'can_view_events');
    }

    /**
     * Determine if the guardian can update the bracelet (edit name/settings)
     */
    public function update(Guardian $guardian, Bracelet $bracelet): bool
    {
        return $bracelet->canGuardian($guardian, 'can_edit');
    }

    /**
     * Determine if the guardian can send commands to the bracelet (vibrate, LED, etc)
     */
    public function sendCommand(Guardian $guardian, Bracelet $bracelet): bool
    {
        return $bracelet->canGuardian($guardian, 'can_send_commands');
    }

    /**
     * Determine if the guardian can delete the bracelet (owner only)
     */
    public function delete(Guardian $guardian, Bracelet $bracelet): bool
    {
        $owner = $bracelet->guardians()->wherePivot('role', 'owner')->first();
        return $owner && $owner->id === $guardian->id;
    }

    /**
     * Determine if the guardian can manage sharing for this bracelet (owner only)
     */
    public function manageSharing(Guardian $guardian, Bracelet $bracelet): bool
    {
        return $this->delete($guardian, $bracelet);
    }
}
