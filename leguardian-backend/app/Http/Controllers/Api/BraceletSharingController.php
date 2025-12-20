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

    /**
     * Get notification preferences for a shared guardian
     */
    public function getNotificationPermissions(Bracelet $bracelet, Guardian $targetGuardian): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Only the owner or the target guardian can view notification preferences
        if ($guardian->id !== $bracelet->guardian_id && $guardian->id !== $targetGuardian->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get the relationship
        $relation = $bracelet->guardians()
            ->where('guardians.id', $targetGuardian->id)
            ->first();

        if (!$relation) {
            return response()->json(['error' => 'Guardian not found for this bracelet'], 404);
        }

        // Get notification preferences or return default
        \Log::info('getNotificationPermissions - Raw pivot data', [
            'notification_preferences' => $relation->pivot->notification_preferences,
            'pivot_attributes' => $relation->pivot->getAttributes(),
            'pivot_class' => get_class($relation->pivot),
        ]);

        $preferences = $relation->pivot->notification_preferences ?? [
            'enabled' => true,
            'types' => [
                'zone_entry' => true,
                'zone_exit' => true,
                'emergency' => true,
                'low_battery' => false,
            ],
            'schedule' => [
                'enabled' => false,
                'daily_config' => [
                    0 => [['start_hour' => 8, 'end_hour' => 18]],
                    1 => [['start_hour' => 8, 'end_hour' => 18]],
                    2 => [['start_hour' => 8, 'end_hour' => 18]],
                    3 => [['start_hour' => 8, 'end_hour' => 18]],
                    4 => [['start_hour' => 8, 'end_hour' => 18]],
                    5 => [['start_hour' => 8, 'end_hour' => 18]],
                    6 => [['start_hour' => 8, 'end_hour' => 18]],
                ],
                'allowed_days' => [0, 1, 2, 3, 4, 5, 6],
            ],
        ];

        // If preferences exist but use legacy format, convert to daily_config
        if (is_array($preferences) && isset($preferences['schedule'])) {
            $schedule = $preferences['schedule'];

            // Convert from legacy (start_hour/end_hour) or time_blocks to daily_config
            if (!isset($schedule['daily_config'])) {
                $timeBlocks = $schedule['time_blocks'] ?? [];
                if (empty($timeBlocks) && isset($schedule['start_hour'], $schedule['end_hour'])) {
                    $timeBlocks = [['start_hour' => $schedule['start_hour'], 'end_hour' => $schedule['end_hour']]];
                }

                // Create daily_config from time blocks
                $dailyConfig = [];
                for ($i = 0; $i < 7; $i++) {
                    if (in_array($i, $schedule['allowed_days'] ?? [])) {
                        $dailyConfig[$i] = $timeBlocks ?: [];
                    } else {
                        $dailyConfig[$i] = [];
                    }
                }
                $preferences['schedule']['daily_config'] = $dailyConfig;
            }
        }

        \Log::info('getNotificationPermissions - Final response', [
            'preferences' => $preferences,
        ]);

        return response()->json($preferences);
    }

    /**
     * Update notification preferences for a shared guardian
     */
    public function updateNotificationPermissions(Request $request, Bracelet $bracelet, Guardian $targetGuardian): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        \Log::info('updateNotificationPermissions called', [
            'bracelet_id' => $bracelet->id,
            'target_guardian_id' => $targetGuardian->id,
            'current_user_id' => $guardian->id,
            'bracelet_guardian_id' => $bracelet->guardian_id,
        ]);

        // Only the owner can update notification preferences for others
        if ($guardian->id !== $bracelet->guardian_id && $guardian->id !== $targetGuardian->id) {
            \Log::warning('Unauthorized update attempt', [
                'bracelet_id' => $bracelet->id,
                'target_guardian_id' => $targetGuardian->id,
                'current_user_id' => $guardian->id,
            ]);
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Validate the notification preferences
        // Support legacy (start_hour/end_hour), time_blocks, and new daily_config format
        $validated = $request->validate([
            'enabled' => 'boolean|required',
            'types' => 'array|required',
            'types.zone_entry' => 'boolean|required',
            'types.zone_exit' => 'boolean|required',
            'types.emergency' => 'boolean|required',
            'types.low_battery' => 'boolean|required',
            'schedule' => 'array|required',
            'schedule.enabled' => 'boolean|required',
            // Legacy format
            'schedule.start_hour' => 'integer|min:0|max:23|nullable',
            'schedule.end_hour' => 'integer|min:0|max:23|nullable',
            // Global time blocks
            'schedule.time_blocks' => 'array|nullable',
            'schedule.time_blocks.*.start_hour' => 'integer|min:0|max:23|required',
            'schedule.time_blocks.*.end_hour' => 'integer|min:0|max:23|required',
            // New per-day config format
            'schedule.daily_config' => 'array|nullable',
            'schedule.daily_config.*' => 'array',
            'schedule.daily_config.*.*.start_hour' => 'integer|min:0|max:23|required',
            'schedule.daily_config.*.*.end_hour' => 'integer|min:0|max:23|required',
            'schedule.allowed_days' => 'array|required',
        ]);

        // Get the relationship
        $relation = $bracelet->guardians()
            ->where('guardians.id', $targetGuardian->id)
            ->first();

        if (!$relation) {
            \Log::error('Guardian not found in bracelet_guardian', [
                'bracelet_id' => $bracelet->id,
                'guardian_id' => $targetGuardian->id,
            ]);
            return response()->json(['error' => 'Guardian not found for this bracelet'], 404);
        }

        // Ensure daily_config is stored as an object, not array
        if (isset($validated['schedule']['daily_config'])) {
            $validated['schedule']['daily_config'] = (object)$validated['schedule']['daily_config'];
        }

        // Update notification preferences
        $updated = $bracelet->guardians()->updateExistingPivot($targetGuardian->id, [
            'notification_preferences' => $validated,
        ]);

        \Log::info('Updated notification preferences', [
            'bracelet_id' => $bracelet->id,
            'guardian_id' => $targetGuardian->id,
            'updated_rows' => $updated,
            'preferences' => $validated,
        ]);

        return response()->json([
            'message' => 'Notification preferences updated successfully',
            'data' => $validated,
        ]);
    }
}
