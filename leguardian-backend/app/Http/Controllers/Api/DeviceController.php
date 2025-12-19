<?php

namespace App\Http\Controllers\Api;

use App\Events\BraceletUpdated;
use App\Http\Controllers\Controller;
use App\Models\Bracelet;
use App\Models\BraceletEvent;
use App\Models\BraceletCommand;
use App\Models\BraceletTrackingHistory;
use App\Services\ExpoPushNotificationService;
use App\Helpers\GeofencingHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DeviceController extends Controller
{
    /**
     * Create new bracelet (for testing/GUI)
     * POST /api/devices/create
     */
    public function create(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'unique_code' => 'required|string|unique:bracelets,unique_code',
            'name' => 'required|string',
            'status' => 'nullable|string|in:active,inactive,lost,emergency',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $bracelet = Bracelet::create([
            'unique_code' => $request->unique_code,
            'name' => $request->name,
            'status' => $request->status ?? 'active',
            'battery_level' => 100,
        ]);

        return response()->json([
            'id' => $bracelet->id,
            'unique_code' => $bracelet->unique_code,
            'name' => $bracelet->name,
            'status' => $bracelet->status,
        ], 201);
    }

    /**
     * Authenticate device by unique code
     * POST /api/devices/auth
     */
    public function authenticate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'unique_code' => 'required|string|exists:bracelets,unique_code',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $bracelet = Bracelet::where('unique_code', $request->unique_code)->first();

        // TODO: Generate and return API token for device
        // For now, return bracelet ID
        return response()->json([
            'bracelet_id' => $bracelet->id,
            'commands_endpoint' => '/api/devices/commands',
        ], 200);
    }

    /**
     * Auto-register bracelet on first boot
     * POST /api/devices/register
     * Called by ESP32 when it first boots up
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'unique_code' => 'required|string|unique:bracelets,unique_code',
        ]);

        if ($validator->fails()) {
            // If unique_code already exists, return the existing bracelet
            $bracelet = Bracelet::where('unique_code', $request->unique_code)->first();
            if ($bracelet) {
                return response()->json([
                    'id' => $bracelet->id,
                    'unique_code' => $bracelet->unique_code,
                    'status' => $bracelet->status,
                    'already_registered' => true,
                ], 200);
            }

            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create new bracelet without guardian association
        $bracelet = Bracelet::create([
            'unique_code' => $request->unique_code,
            'name' => 'Bracelet ' . $request->unique_code,
            'status' => 'active',
            'battery_level' => 100,
            // guardian_id is NOT set - bracelet is not associated yet
        ]);

        Log::info('Bracelet auto-registered on first boot', [
            'bracelet_id' => $bracelet->id,
            'unique_code' => $bracelet->unique_code,
        ]);

        return response()->json([
            'id' => $bracelet->id,
            'unique_code' => $bracelet->unique_code,
            'status' => $bracelet->status,
            'already_registered' => false,
        ], 201);
    }

    /**
     * Check if bracelet is associated with a user
     * GET /api/devices/check-association
     */
    public function checkAssociation(Request $request)
    {
        $bracelet = $this->getBraceletFromRequest($request);

        if (!$bracelet) {
            return response()->json(['associated' => false, 'message' => 'Bracelet not found'], 404);
        }

        // A bracelet is considered associated if it has a guardian (user)
        $associated = $bracelet->guardian_id !== null;

        return response()->json([
            'associated' => $associated,
            'bracelet_id' => $bracelet->id,
            'status' => $bracelet->status,
        ], 200);
    }

    /**
     * Button pressed - "Je suis bien arrivé" (arrived)
     * POST /api/devices/button/arrived
     */
    public function buttonArrived(Request $request)
    {
        $bracelet = $this->getBraceletFromRequest($request);
        if (!$bracelet) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'battery_level' => 'required|integer|min:0|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create event
        BraceletEvent::create([
            'bracelet_id' => $bracelet->id,
            'event_type' => 'arrived',
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'battery_level' => $request->battery_level,
        ]);

        // Update bracelet
        $updateData = [
            'battery_level' => $request->battery_level,
            'last_ping_at' => now(),
        ];

        // Store last location if provided
        if ($request->has('latitude') && $request->latitude) {
            $updateData['last_latitude'] = $request->latitude;
            $updateData['last_longitude'] = $request->longitude;
            $updateData['last_accuracy'] = $request->accuracy ?? null;
            $updateData['last_location_update'] = now();
        }

        $bracelet->update($updateData);


        // Broadcast update to connected clients
        BraceletUpdated::dispatch($bracelet, $updateData);

        return response()->json(['success' => true]);
    }

    /**
     * Button pressed - "Je suis perdu" (lost)
     * POST /api/devices/button/lost
     */
    public function buttonLost(Request $request)
    {
        $bracelet = $this->getBraceletFromRequest($request);
        if (!$bracelet) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'battery_level' => 'required|integer|min:0|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create event
        BraceletEvent::create([
            'bracelet_id' => $bracelet->id,
            'event_type' => 'lost',
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'accuracy' => $request->accuracy,
            'battery_level' => $request->battery_level,
        ]);

        // Update bracelet to 'lost' status
        $updateData = [
            'status' => 'lost',
            'battery_level' => $request->battery_level,
            'last_ping_at' => now(),
            'last_latitude' => $request->latitude,
            'last_longitude' => $request->longitude,
            'last_accuracy' => $request->accuracy ?? null,
            'last_location_update' => now(),
        ];

        $bracelet->update($updateData);

        // Broadcast update to connected clients
        BraceletUpdated::dispatch($bracelet, $updateData);

        return response()->json([
            'success' => true,
            'tracking_enabled' => true,
        ]);
    }

    /**
     * Button pressed - "Je me sens en danger" (danger)
     * POST /api/devices/button/danger
     */
    public function buttonDanger(Request $request)
    {
        $bracelet = $this->getBraceletFromRequest($request);
        if (!$bracelet) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'battery_level' => 'required|integer|min:0|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create event
        BraceletEvent::create([
            'bracelet_id' => $bracelet->id,
            'event_type' => 'danger',
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'accuracy' => $request->accuracy,
            'battery_level' => $request->battery_level,
        ]);

        // Update bracelet to 'emergency' status
        $updateData = [
            'status' => 'emergency',
            'battery_level' => $request->battery_level,
            'last_ping_at' => now(),
            'last_latitude' => $request->latitude,
            'last_longitude' => $request->longitude,
            'last_accuracy' => $request->accuracy ?? null,
            'last_location_update' => now(),
        ];

        $bracelet->update($updateData);

        // Broadcast update to connected clients
        BraceletUpdated::dispatch($bracelet, $updateData);

        return response()->json([
            'success' => true,
            'emergency_mode' => true,
        ]);
    }

    /**
     * Update location while in danger mode
     * POST /api/devices/danger/update
     */
    public function dangerUpdate(Request $request)
    {
        $bracelet = $this->getBraceletFromRequest($request);
        if (!$bracelet) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'timestamp' => 'nullable|string',
            'emergency_mode' => 'nullable|boolean',
            'battery_level' => 'nullable|integer|min:0|max:100',
            'gps' => 'nullable|array',
            'gps.latitude' => 'nullable|numeric|between:-90,90',
            'gps.longitude' => 'nullable|numeric|between:-180,180',
            'gps.altitude' => 'nullable|numeric',
            'gps.satellites' => 'nullable|integer',
            'network' => 'nullable|array',
            'imu' => 'nullable|array',
            // Legacy fields for backward compatibility
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'accuracy' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Extract latitude/longitude from gps object or direct fields
        $latitude = $request->input('gps.latitude') ?? $request->latitude;
        $longitude = $request->input('gps.longitude') ?? $request->longitude;
        $accuracy = $request->input('gps.accuracy') ?? $request->accuracy;

        if (!$latitude || !$longitude) {
            return response()->json(['errors' => ['location' => ['Location data is required for danger updates']]], 422);
        }

        // Create danger event
        BraceletEvent::create([
            'bracelet_id' => $bracelet->id,
            'event_type' => 'danger',
            'latitude' => $latitude,
            'longitude' => $longitude,
            'accuracy' => $accuracy,
            'battery_level' => $request->battery_level ?? $bracelet->battery_level,
        ]);

        // Update bracelet status and location
        $updateData = [
            'status' => 'emergency',
            'emergency_mode' => true,
            'last_ping_at' => now(),
            'last_latitude' => $latitude,
            'last_longitude' => $longitude,
            'last_accuracy' => $accuracy ?? null,
            'last_location_update' => now(),
        ];

        // Store battery if provided
        if ($request->has('battery_level') && $request->battery_level !== null) {
            $updateData['battery_level'] = $request->battery_level;
        }

        // Store sensor data if provided
        if ($request->has('imu') && $request->imu) {
            $updateData['last_imu_data'] = json_encode($request->imu);
            $updateData['last_imu_update'] = now();
        }

        if ($request->has('network') && $request->network) {
            $updateData['last_network_data'] = json_encode($request->network);
        }

        $bracelet->update($updateData);

        Log::info('Emergency/Danger update received', [
            'bracelet_id' => $bracelet->id,
            'latitude' => $latitude,
            'longitude' => $longitude,
        ]);

        // Broadcast update to connected clients
        BraceletUpdated::dispatch($bracelet, $updateData);

        return response()->json([
            'success' => true,
            'status' => 'emergency',
            'continue_tracking' => true,
        ]);
    }

    /**
     * Poll for commands
     * GET /api/devices/commands
     */
    public function getCommands(Request $request)
    {
        $bracelet = $this->getBraceletFromRequest($request);
        if (!$bracelet) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Get pending command
        $command = $bracelet->commands()
            ->where('status', 'pending')
            ->first();

        if (!$command) {
            return response()->json(['command' => null]);
        }

        $response = [
            'command' => $command->command_type,
            'command_id' => $command->id,
        ];

        // Include LED data if present
        if ($command->led_color) {
            $response['led_color'] = $command->led_color;
        }
        if ($command->led_pattern) {
            $response['led_pattern'] = $command->led_pattern;
        }

        return response()->json($response);
    }

    /**
     * Acknowledge command execution
     * POST /api/devices/commands/{id}/ack
     */
    public function acknowledgeCommand(Request $request, $commandId)
    {
        $bracelet = $this->getBraceletFromRequest($request);
        if (!$bracelet) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $command = BraceletCommand::where('bracelet_id', $bracelet->id)
            ->where('id', $commandId)
            ->first();

        if (!$command) {
            return response()->json(['message' => 'Command not found'], 404);
        }

        $command->update([
            'status' => 'executed',
            'executed_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Heartbeat ping
     * POST /api/devices/heartbeat
     */
    public function heartbeat(Request $request)
    {
        $bracelet = $this->getBraceletFromRequest($request);
        if (!$bracelet) {
            Log::error('Heartbeat - Bracelet not found', [
                'header_x_bracelet_id' => $request->header('X-Bracelet-ID'),
                'all_headers' => $request->headers->all(),
            ]);
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'battery_level' => 'nullable|integer|min:0|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'emergency_mode' => 'nullable|boolean',
            'timestamp' => 'nullable|string',
            'gps' => 'nullable|array',
            'network' => 'nullable|array',
            'imu' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Update heartbeat data
        $updateData = [
            'last_ping_at' => now(),
        ];

        // Only update battery if provided
        if ($request->has('battery_level') && $request->battery_level !== null) {
            $updateData['battery_level'] = $request->battery_level;
        }

        // Store last location if provided
        if ($request->has('latitude') && $request->latitude) {
            $updateData['last_latitude'] = $request->latitude;
            $updateData['last_longitude'] = $request->longitude;
            $updateData['last_accuracy'] = $request->accuracy ?? null;
            $updateData['last_location_update'] = now();
        }

        // Store sensor data if provided
        if ($request->has('imu') && $request->imu) {
            $updateData['last_imu_data'] = json_encode($request->imu);
            $updateData['last_imu_update'] = now();
        }

        if ($request->has('network') && $request->network) {
            $updateData['last_network_data'] = json_encode($request->network);
        }

        if ($request->has('emergency_mode')) {
            $updateData['emergency_mode'] = $request->boolean('emergency_mode');
        }

        $bracelet->update($updateData);

        // Store complete tracking history with all sensor data
        if ($request->has('gps') && $request->gps) {
            $gpsData = $request->gps;

            // Parse device_timestamp from various formats
            $deviceTimestamp = null;
            if ($request->timestamp) {
                try {
                    // Try ISO 8601 format first (YYYY-MM-DDTHH:MM:SSZ)
                    if (strpos($request->timestamp, 'T') !== false) {
                        $deviceTimestamp = \Carbon\Carbon::parse($request->timestamp);
                    } else if (is_numeric($request->timestamp)) {
                        // If it's a number, assume seconds since epoch (Unix timestamp)
                        $deviceTimestamp = \Carbon\Carbon::createFromTimestamp($request->timestamp);
                    } else {
                        // Try to parse as-is
                        $deviceTimestamp = \Carbon\Carbon::parse($request->timestamp);
                    }
                } catch (\Exception $e) {
                    // If parsing fails, use server time
                    $deviceTimestamp = now();
                }
            }

            BraceletTrackingHistory::create([
                'bracelet_id' => $bracelet->id,
                // GPS data
                'latitude' => $gpsData['latitude'] ?? null,
                'longitude' => $gpsData['longitude'] ?? null,
                'altitude' => $gpsData['altitude'] ?? null,
                'accuracy' => $gpsData['accuracy'] ?? null,
                'satellites' => $gpsData['satellites'] ?? null,
                // Timestamps
                'timestamp' => $request->timestamp,
                'device_timestamp' => $deviceTimestamp ?? now(),
                // Full sensor data
                'emergency_mode' => $request->boolean('emergency_mode'),
                'network_data' => $request->has('network') ? $request->network : null,
                'imu_data' => $request->has('imu') ? $request->imu : null,
                'battery_level' => $request->battery_level ?? null,
            ]);
        }

        // Don't store heartbeat as event - just update location
        // This avoids cluttering the timeline with too many heartbeat points

        // NEW: Check geofencing if location is provided
        if ($request->has('latitude') && $request->latitude && $request->has('longitude') && $request->longitude) {
            $this->checkGeofencingViolations(
                $bracelet,
                (float)$request->latitude,
                (float)$request->longitude
            );
        }

        Log::info('Heartbeat updated', [
            'bracelet_id' => $bracelet->id,
            'battery' => $updateData['battery_level'] ?? $bracelet->battery_level,
            'location_updated' => isset($updateData['last_latitude']),
        ]);

        // Broadcast update to connected clients (silently catch errors - non-critical)
        try {
            BraceletUpdated::dispatch($bracelet, $updateData);
        } catch (\Exception $e) {
            Log::warning('Broadcast error (non-critical)', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'next_ping' => 120, // 2 minutes - periodic location transmission
        ]);
    }

    /**
     * Check if bracelet has entered or exited any safety zones
     */
    private function checkGeofencingViolations(Bracelet $bracelet, float $latitude, float $longitude)
    {
        $zones = $bracelet->safetyZones;

        if ($zones->isEmpty()) {
            return;
        }

        $pushService = new ExpoPushNotificationService();

        foreach ($zones as $zone) {
            $isInside = GeofencingHelper::isPointInPolygon($latitude, $longitude, $zone->coordinates);

            // Get previous state from cache
            $cacheKey = "bracelet_{$bracelet->id}_zone_{$zone->id}_inside";
            $wasInside = Cache::get($cacheKey, false);

            // Entry detection
            if ($isInside && !$wasInside && $zone->notify_on_entry) {
                $this->createGeofenceEvent($bracelet, $zone, 'entry', $latitude, $longitude);

                // Send notifications to all guardians with access
                $guardians = $bracelet->guardian ? [$bracelet->guardian] : [];
                foreach ($guardians as $guardian) {
                    $pushService->sendGeofenceEntryAlert($guardian, $bracelet, $zone);
                }

                Log::info("Zone entry detected", [
                    'bracelet_id' => $bracelet->id,
                    'zone_id' => $zone->id,
                    'zone_name' => $zone->name,
                ]);
            }

            // Exit detection
            if (!$isInside && $wasInside && $zone->notify_on_exit) {
                $this->createGeofenceEvent($bracelet, $zone, 'exit', $latitude, $longitude);

                // Send notifications to all guardians with access
                $guardians = $bracelet->guardian ? [$bracelet->guardian] : [];
                foreach ($guardians as $guardian) {
                    $pushService->sendGeofenceExitAlert($guardian, $bracelet, $zone);
                }

                Log::info("Zone exit detected", [
                    'bracelet_id' => $bracelet->id,
                    'zone_id' => $zone->id,
                    'zone_name' => $zone->name,
                ]);
            }

            // Update cache with current state (expires in 1 hour)
            Cache::put($cacheKey, $isInside, 3600);
        }
    }

    /**
     * Create a geofence event
     */
    private function createGeofenceEvent(Bracelet $bracelet, $zone, string $type, float $latitude, float $longitude)
    {
        BraceletEvent::create([
            'bracelet_id' => $bracelet->id,
            'event_type' => "zone_{$type}",
            'latitude' => $latitude,
            'longitude' => $longitude,
            'battery_level' => $bracelet->battery_level,
            'metadata' => json_encode([
                'zone_id' => $zone->id,
                'zone_name' => $zone->name,
            ]),
        ]);
    }

    /**
     * Reset bracelet status to active
     * POST /api/devices/reset-status
     */
    public function resetStatus(Request $request)
    {
        $bracelet = $this->getBraceletFromRequest($request);
        if (!$bracelet) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Only allow reset if currently in lost or emergency status
        if (!in_array($bracelet->status, ['lost', 'emergency'])) {
            return response()->json([
                'message' => 'Bracelet can only be reset from lost or emergency status',
                'current_status' => $bracelet->status,
            ], 422);
        }

        $updateData = [
            'status' => 'active',
            'last_ping_at' => now(),
        ];

        $bracelet->update($updateData);

        // Broadcast update to connected clients
        BraceletUpdated::dispatch($bracelet, $updateData);

        return response()->json([
            'success' => true,
            'status' => $bracelet->status,
            'message' => 'Bracelet status reset to active',
        ]);
    }

    /**
     * Helper: Get bracelet from request headers
     */
    private function getBraceletFromRequest(Request $request)
    {
        // TODO: Implement device token authentication
        // For now, use unique_code from header
        $uniqueCode = $request->header('X-Bracelet-ID');

        if (!$uniqueCode) {
            return null;
        }

        return Bracelet::where('unique_code', $uniqueCode)->first();
    }
}
