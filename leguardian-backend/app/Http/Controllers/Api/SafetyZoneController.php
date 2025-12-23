<?php

namespace App\Http\Controllers\Api;

use App\Models\SafetyZone;
use App\Models\Bracelet;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class SafetyZoneController extends Controller
{
    /**
     * Get all safety zones for a bracelet
     */
    public function index(Bracelet $bracelet): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Verify guardian owns the bracelet
        if ($bracelet->guardian_id !== $guardian->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $zones = $bracelet->safetyZones()->get();
        return response()->json($zones);
    }

    /**
     * Create a new safety zone
     */
    public function store(Request $request, Bracelet $bracelet): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Verify guardian owns the bracelet
        if ($bracelet->guardian_id !== $guardian->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Validate input
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:50',
            'coordinates' => 'required|array|min:3',
            'coordinates.*' => 'required|array',
            'coordinates.*.latitude' => 'required|numeric|between:-90,90',
            'coordinates.*.longitude' => 'required|numeric|between:-180,180',
            'notify_on_entry' => 'boolean',
            'notify_on_exit' => 'boolean',
            'type' => 'nullable|string|in:polygon,circle',
        ]);

        // Create the zone
        $zone = $bracelet->safetyZones()->create([
            'name' => $validated['name'],
            'icon' => $validated['icon'] ?? null,
            'coordinates' => $validated['coordinates'],
            'notify_on_entry' => $validated['notify_on_entry'] ?? true,
            'notify_on_exit' => $validated['notify_on_exit'] ?? true,
            'created_by_guardian_id' => $guardian->id,
            'type' => $validated['type'] ?? 'polygon',
        ]);

        return response()->json($zone, 201);
    }

    /**
     * Get a specific safety zone
     */
    public function show(Bracelet $bracelet, SafetyZone $zone): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Verify guardian owns the bracelet
        if ($bracelet->guardian_id !== $guardian->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Verify zone belongs to bracelet
        if ($zone->bracelet_id !== $bracelet->id) {
            return response()->json(['error' => 'Not Found'], 404);
        }

        return response()->json($zone);
    }

    /**
     * Update a safety zone
     */
    public function update(Request $request, Bracelet $bracelet, SafetyZone $zone): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Verify guardian owns the bracelet
        if ($bracelet->guardian_id !== $guardian->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Verify zone belongs to bracelet
        if ($zone->bracelet_id !== $bracelet->id) {
            return response()->json(['error' => 'Not Found'], 404);
        }

        // Validate input
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'icon' => 'nullable|string|max:50',
            'coordinates' => 'sometimes|array|min:3',
            'coordinates.*' => 'required_with:coordinates|array',
            'coordinates.*.latitude' => 'required_with:coordinates|numeric|between:-90,90',
            'coordinates.*.longitude' => 'required_with:coordinates|numeric|between:-180,180',
            'notify_on_entry' => 'sometimes|boolean',
            'notify_on_exit' => 'sometimes|boolean',
            'type' => 'nullable|string|in:polygon,circle',
        ]);

        $zone->update($validated);

        return response()->json($zone);
    }

    /**
     * Delete a safety zone
     */
    public function destroy(Bracelet $bracelet, SafetyZone $zone): JsonResponse
    {
        $guardian = auth()->guard('sanctum')->user();

        // Verify guardian owns the bracelet
        if ($bracelet->guardian_id !== $guardian->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Verify zone belongs to bracelet
        if ($zone->bracelet_id !== $bracelet->id) {
            return response()->json(['error' => 'Not Found'], 404);
        }

        $zone->delete();

        return response()->json(null, 204);
    }
}
