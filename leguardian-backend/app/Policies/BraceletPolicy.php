<?php

namespace App\Policies;

use App\Models\Bracelet;
use App\Models\Guardian;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BraceletPolicy
{
    /**
     * Get the Guardian from the authenticated user (could be Guardian or User model)
     */
    private function getGuardian($authenticatedUser): ?Guardian
    {
        if ($authenticatedUser instanceof Guardian) {
            return $authenticatedUser;
        }

        if ($authenticatedUser instanceof User) {
            // If it's a User, they don't have bracelet access
            return null;
        }

        return null;
    }

    /**
     * Determine if the guardian can view the bracelet
     */
    public function view($user, Bracelet $bracelet): bool
    {
        $guardian = $this->getGuardian($user);
        if (!$guardian) {
            return false;
        }

        return $bracelet->hasGuardian($guardian);
    }

    /**
     * Determine if the guardian can view the bracelet's location
     */
    public function viewLocation($user, Bracelet $bracelet): bool
    {
        $guardian = $this->getGuardian($user);
        if (!$guardian) {
            return false;
        }

        return $bracelet->canGuardian($guardian, 'can_view_location');
    }

    /**
     * Determine if the guardian can view the bracelet's events
     */
    public function viewEvents($user, Bracelet $bracelet): bool
    {
        $guardian = $this->getGuardian($user);
        if (!$guardian) {
            return false;
        }

        return $bracelet->canGuardian($guardian, 'can_view_events');
    }

    /**
     * Determine if the guardian can update the bracelet (edit name/settings)
     */
    public function update($user, Bracelet $bracelet): bool
    {
        $guardian = $this->getGuardian($user);
        if (!$guardian) {
            return false;
        }

        return $bracelet->canGuardian($guardian, 'can_edit');
    }

    /**
     * Determine if the guardian can send commands to the bracelet (vibrate, LED, etc)
     */
    public function sendCommand($user, Bracelet $bracelet): bool
    {
        $guardian = $this->getGuardian($user);
        if (!$guardian) {
            return false;
        }

        return $bracelet->canGuardian($guardian, 'can_send_commands');
    }

    /**
     * Determine if the guardian can delete the bracelet (owner only)
     */
    public function delete($user, Bracelet $bracelet): bool
    {
        $guardian = $this->getGuardian($user);
        if (!$guardian) {
            return false;
        }

        $owner = $bracelet->guardians()->wherePivot('role', 'owner')->first();
        return $owner && $owner->id === $guardian->id;
    }

    /**
     * Determine if the guardian can manage sharing for this bracelet (owner only)
     */
    public function manageSharing($user, Bracelet $bracelet): bool
    {
        return $this->delete($user, $bracelet);
    }
}
