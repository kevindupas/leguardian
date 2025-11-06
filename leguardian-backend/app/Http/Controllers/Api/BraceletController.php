<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bracelet;
use App\Models\BraceletEvent;
use App\Models\BraceletCommand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BraceletController extends Controller
{
    /**
     * Get all bracelets for authenticated user with last location
     */
    public function index(Request $request)
    {
        $bracelets = $request->user()->bracelets()
            ->with('events')
            ->get()
            ->map(function ($bracelet) {
                $data = $bracelet->toArray();

                // Add last location if available
                if ($bracelet->last_latitude && $bracelet->last_longitude) {
                    $data['last_location'] = [
                        'latitude' => (float) $bracelet->last_latitude,
                        'longitude' => (float) $bracelet->last_longitude,
                        'accuracy' => (int) $bracelet->last_accuracy,
                        'updated_at' => $bracelet->last_location_update,
                    ];
                }

                return $data;
            });

        return response()->json([
            'bracelets' => $bracelets,
        ]);
    }

    /**
     * Get single bracelet with last location
     */
    public function show(Request $request, Bracelet $bracelet)
    {
        // Check if user owns this bracelet
        if ($bracelet->guardian_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Load relationships
        $bracelet->load('events', 'commands');

        // Create response with last location
        $response = [
            'bracelet' => $bracelet,
        ];

        // Add last location if available
        if ($bracelet->last_latitude && $bracelet->last_longitude) {
            $response['last_location'] = [
                'latitude' => (float) $bracelet->last_latitude,
                'longitude' => (float) $bracelet->last_longitude,
                'accuracy' => (int) $bracelet->last_accuracy,
                'updated_at' => $bracelet->last_location_update,
            ];
        }

        return response()->json($response);
    }

    /**
     * Get available unpaired bracelets
     */
    public function getAvailableBracelets(Request $request)
    {
        $bracelets = Bracelet::unpaired()->get();

        return response()->json([
            'bracelets' => $bracelets,
        ]);
    }

    /**
     * Register a bracelet (pair to guardian)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'unique_code' => 'required|string|exists:bracelets,unique_code',
            'alias' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $bracelet = Bracelet::where('unique_code', $request->unique_code)->first();

        // Check if already paired to another guardian
        if ($bracelet->is_paired && $bracelet->guardian_id !== $request->user()->id) {
            return response()->json(['message' => 'Ce bracelet est déjà enregistré par quelqu\'un d\'autre'], 422);
        }

        // Check if already paired to same guardian
        if ($bracelet->guardian_id === $request->user()->id && $bracelet->is_paired) {
            return response()->json(['message' => 'Ce bracelet est déjà enregistré à votre compte'], 422);
        }

        $updateData = [
            'guardian_id' => $request->user()->id,
            'is_paired' => true,
            'paired_at' => now(),
            'status' => 'active',
        ];

        // Add alias if provided
        if ($request->has('alias') && $request->alias) {
            $updateData['alias'] = $request->alias;
        }

        $bracelet->update($updateData);
        $bracelet->refresh();

        return response()->json([
            'bracelet' => $bracelet,
            'message' => 'Bracelet enregistré avec succès',
        ]);
    }

    /**
     * Update bracelet
     */
    public function update(Request $request, Bracelet $bracelet)
    {
        // Check authorization
        if ($bracelet->guardian_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'alias' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->has('alias')) {
            $bracelet->update(['alias' => $request->input('alias')]);
            $bracelet->refresh();
        }

        return response()->json([
            'bracelet' => $bracelet,
        ]);
    }

    /**
     * Get bracelet events
     */
    public function getEvents(Request $request, Bracelet $bracelet)
    {
        // Check authorization
        if ($bracelet->guardian_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = $bracelet->events()->recent();

        if ($request->has('type')) {
            $query->byType($request->type);
        }

        $events = $query->paginate(20);

        return response()->json($events);
    }

    /**
     * Send vibration command to bracelet
     */
    public function vibrate(Request $request, Bracelet $bracelet)
    {
        // Check authorization
        if ($bracelet->guardian_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'pattern' => 'required|in:short,medium,sos',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $commandType = match ($request->pattern) {
            'short' => 'vibrate_short',
            'medium' => 'vibrate_medium',
            'sos' => 'vibrate_sos',
        };

        $command = BraceletCommand::create([
            'bracelet_id' => $bracelet->id,
            'command_type' => $commandType,
            'status' => 'pending',
        ]);

        return response()->json([
            'command_id' => $command->id,
            'success' => true,
        ]);
    }

    /**
     * Resolve emergency (stop tracking)
     */
    public function resolveEmergency(Request $request, Bracelet $bracelet)
    {
        // Check authorization
        if ($bracelet->guardian_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bracelet->update(['status' => 'active']);

        return response()->json([
            'success' => true,
            'message' => 'Emergency resolved',
        ]);
    }

    /**
     * Get all events for authenticated user's bracelets
     */
    public function getAllEvents(Request $request)
    {
        $bracelets = $request->user()->bracelets()->pluck('id');

        $events = BraceletEvent::whereIn('bracelet_id', $bracelets)
            ->with('bracelet')
            ->recent()
            ->paginate(20);

        return response()->json($events);
    }

    /**
     * Get unresolved events for authenticated user's bracelets
     */
    public function getUnresolvedEvents(Request $request)
    {
        $bracelets = $request->user()->bracelets()->pluck('id');

        $events = BraceletEvent::whereIn('bracelet_id', $bracelets)
            ->unresolved()
            ->with('bracelet')
            ->recent()
            ->get();

        return response()->json([
            'events' => $events,
        ]);
    }

    /**
     * Resolve an event
     */
    public function resolveEvent(Request $request, BraceletEvent $event)
    {
        // Check authorization by verifying user owns the bracelet
        $bracelet = $event->bracelet;
        if ($bracelet->guardian_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event->update([
            'resolved' => true,
            'resolved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event resolved',
        ]);
    }

    /**
     * Send response to event (ping/vibrate)
     */
    public function respondToEvent(Request $request, Bracelet $bracelet)
    {
        // Check authorization
        if ($bracelet->guardian_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'event_id' => 'nullable|integer|exists:bracelet_events,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Send vibration command as response
        $command = BraceletCommand::create([
            'bracelet_id' => $bracelet->id,
            'command_type' => 'vibrate_short',
            'status' => 'pending',
        ]);

        // Mark event as resolved if provided
        if ($request->has('event_id') && $request->event_id) {
            BraceletEvent::find($request->event_id)->update([
                'resolved' => true,
                'resolved_at' => now(),
            ]);
        }

        return response()->json([
            'command_id' => $command->id,
            'success' => true,
            'message' => 'Response sent to bracelet',
        ]);
    }
}
