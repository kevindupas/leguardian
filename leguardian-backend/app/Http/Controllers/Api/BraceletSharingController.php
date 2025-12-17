<?php

namespace App\Http\Controllers\Api;

use App\Models\Bracelet;
use App\Models\Guardian;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class BraceletSharingController extends Controller
{
    /**
     * Get all guardians with whom this bracelet is shared
     * GET /api/mobile/bracelets/{id}/shared-guardians
     */
    public function index(Bracelet $bracelet): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Only owner can view sharing list
        if (!$bracelet->canGuardian($guardian, 'can_edit')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $shared = $bracelet->guardians()
            ->where('guardians.id', '!=', $guardian->id)
            ->get()
            ->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'email' => $g->email,
                'role' => $g->pivot->role,
                'permissions' => [
                    'can_edit' => (bool)$g->pivot->can_edit,
                    'can_view_location' => (bool)$g->pivot->can_view_location,
                    'can_view_events' => (bool)$g->pivot->can_view_events,
                    'can_send_commands' => (bool)$g->pivot->can_send_commands,
                ],
                'shared_at' => $g->pivot->shared_at,
                'accepted_at' => $g->pivot->accepted_at,
            ]);

        return response()->json($shared);
    }

    /**
     * Share bracelet with another guardian by email
     * POST /api/mobile/bracelets/{id}/share
     */
    public function share(Request $request, Bracelet $bracelet): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Only owner can share
        if (!$bracelet->canGuardian($guardian, 'can_edit')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'email' => 'required|email|exists:guardians,email',
            'can_edit' => 'boolean|nullable',
            'can_view_location' => 'boolean|nullable',
            'can_view_events' => 'boolean|nullable',
            'can_send_commands' => 'boolean|nullable',
        ]);

        $targetGuardian = Guardian::where('email', $validated['email'])->first();

        // Can't share with self
        if ($targetGuardian->id === $guardian->id) {
            return response()->json(['error' => 'Cannot share with yourself'], 422);
        }

        // Check if already shared
        $existing = $bracelet->guardians()->where('guardians.id', $targetGuardian->id)->first();
        if ($existing) {
            return response()->json(['error' => 'Bracelet already shared with this guardian'], 422);
        }

        // Create sharing relationship
        $bracelet->guardians()->attach($targetGuardian->id, [
            'role' => 'shared',
            'can_edit' => $validated['can_edit'] ?? false,
            'can_view_location' => $validated['can_view_location'] ?? true,
            'can_view_events' => $validated['can_view_events'] ?? true,
            'can_send_commands' => $validated['can_send_commands'] ?? false,
            'shared_at' => now(),
            // Leave accepted_at as NULL until guardian accepts
        ]);

        return response()->json([
            'message' => 'Bracelet shared successfully',
            'shared_with' => $targetGuardian->email,
        ], 201);
    }

    /**
     * Update permissions for a shared bracelet
     * PUT /api/mobile/bracelets/{id}/shared-guardians/{guardian_id}
     */
    public function updatePermissions(Request $request, Bracelet $bracelet, Guardian $targetGuardian): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Only owner can update permissions
        if (!$bracelet->canGuardian($guardian, 'can_edit')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'can_edit' => 'boolean|nullable',
            'can_view_location' => 'boolean|nullable',
            'can_view_events' => 'boolean|nullable',
            'can_send_commands' => 'boolean|nullable',
        ]);

        // Get the pivot record
        $pivot = $bracelet->guardians()
            ->where('guardians.id', $targetGuardian->id)
            ->first();

        if (!$pivot) {
            return response()->json(['error' => 'Bracelet not shared with this guardian'], 404);
        }

        // Update permissions
        $bracelet->guardians()->updateExistingPivot($targetGuardian->id, $validated);

        return response()->json(['message' => 'Permissions updated']);
    }

    /**
     * Revoke access to a shared bracelet
     * DELETE /api/mobile/bracelets/{id}/shared-guardians/{guardian_id}
     */
    public function revoke(Bracelet $bracelet, Guardian $targetGuardian): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Only owner can revoke
        if (!$bracelet->canGuardian($guardian, 'can_edit')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Verify the target is actually shared
        if (!$bracelet->guardians()->where('guardians.id', $targetGuardian->id)->exists()) {
            return response()->json(['error' => 'Bracelet not shared with this guardian'], 404);
        }

        // Detach the guardian
        $bracelet->guardians()->detach($targetGuardian->id);

        return response()->json(['message' => 'Access revoked']);
    }

    /**
     * Get pending invitations for the current guardian
     * GET /api/mobile/sharing-invitations
     */
    public function invitations(Request $request): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        $pending = $guardian->pendingBraceletInvitations()
            ->get()
            ->map(fn($b) => [
                'bracelet_id' => $b->id,
                'bracelet_name' => $b->name,
                'bracelet_alias' => $b->alias,
                'shared_by' => $b->guardians()
                    ->wherePivot('role', 'owner')
                    ->first()?->name,
                'permissions' => [
                    'can_edit' => (bool)$b->pivot->can_edit,
                    'can_view_location' => (bool)$b->pivot->can_view_location,
                    'can_view_events' => (bool)$b->pivot->can_view_events,
                    'can_send_commands' => (bool)$b->pivot->can_send_commands,
                ],
                'shared_at' => $b->pivot->shared_at,
            ]);

        return response()->json($pending);
    }

    /**
     * Accept a bracelet sharing invitation
     * POST /api/mobile/sharing-invitations/{bracelet_id}/accept
     */
    public function accept(Request $request, Bracelet $bracelet): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Check if this is a pending invitation for the guardian
        $pivot = $bracelet->guardians()
            ->where('guardians.id', $guardian->id)
            ->wherePivot('role', 'shared')
            ->wherePivot('accepted_at', null)
            ->first();

        if (!$pivot) {
            return response()->json(['error' => 'No pending invitation for this bracelet'], 404);
        }

        // Mark as accepted
        $bracelet->guardians()->updateExistingPivot($guardian->id, [
            'accepted_at' => now(),
        ]);

        return response()->json(['message' => 'Invitation accepted']);
    }

    /**
     * Decline a bracelet sharing invitation
     * POST /api/mobile/sharing-invitations/{bracelet_id}/decline
     */
    public function decline(Request $request, Bracelet $bracelet): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Check if this is a pending invitation
        if (!$bracelet->guardians()->where('guardians.id', $guardian->id)->wherePivot('accepted_at', null)->exists()) {
            return response()->json(['error' => 'No pending invitation for this bracelet'], 404);
        }

        // Remove the relationship
        $bracelet->guardians()->detach($guardian->id);

        return response()->json(['message' => 'Invitation declined']);
    }
}
