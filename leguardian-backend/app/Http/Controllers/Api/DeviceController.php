<?php

namespace App\Http\Controllers\Api;

use App\Events\BraceletUpdated;
use App\Http\Controllers\Controller;
use App\Models\Bracelet;
use App\Models\BraceletEvent;
use App\Models\BraceletCommand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create update event
        BraceletEvent::create([
            'bracelet_id' => $bracelet->id,
            'event_type' => 'danger',
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'accuracy' => $request->accuracy,
            'battery_level' => $bracelet->battery_level,
        ]);

        // Update last location and ping
        $updateData = [
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
            \Log::error('Heartbeat - Bracelet not found', [
                'header_x_bracelet_id' => $request->header('X-Bracelet-ID'),
                'all_headers' => $request->headers->all(),
            ]);
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

        // Update heartbeat data
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

        // Don't store heartbeat as event - just update location
        // This avoids cluttering the timeline with too many heartbeat points

        \Log::info('Heartbeat updated', [
            'bracelet_id' => $bracelet->id,
            'battery' => $updateData['battery_level'],
            'location_updated' => isset($updateData['last_latitude']),
        ]);

        // Broadcast update to connected clients
        BraceletUpdated::dispatch($bracelet, $updateData);
        \Log::info('BraceletUpdated::dispatch called from heartbeat', [
            'bracelet_id' => $bracelet->id,
        ]);

        return response()->json([
            'success' => true,
            'next_ping' => 120, // 2 minutes - periodic location transmission
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
