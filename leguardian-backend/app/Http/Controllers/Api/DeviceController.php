<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bracelet;
use App\Models\BraceletEvent;
use App\Models\BraceletCommand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DeviceController extends Controller
{
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
        $bracelet->update([
            'battery_level' => $request->battery_level,
            'last_ping_at' => now(),
        ]);

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
        $bracelet->update([
            'status' => 'lost',
            'battery_level' => $request->battery_level,
            'last_ping_at' => now(),
        ]);

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
        $bracelet->update([
            'status' => 'emergency',
            'battery_level' => $request->battery_level,
            'last_ping_at' => now(),
        ]);

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

        $bracelet->update(['last_ping_at' => now()]);

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

        return response()->json([
            'command' => $command->command_type,
            'command_id' => $command->id,
        ]);
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

        $bracelet->update([
            'battery_level' => $request->battery_level,
            'last_ping_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'next_ping' => 300, // 5 minutes
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
