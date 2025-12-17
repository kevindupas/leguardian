<?php

namespace App\Services;

use App\Models\Guardian;
use App\Models\Bracelet;
use App\Models\SafetyZone;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushNotificationService
{
    private $expoApiUrl = 'https://exp.host/--/api/v2/push/send';

    /**
     * Send geofence entry alert to guardian
     */
    public function sendGeofenceEntryAlert(Guardian $guardian, Bracelet $bracelet, SafetyZone $zone)
    {
        return $this->sendGeofenceAlert($guardian, $bracelet, $zone, 'entry');
    }

    /**
     * Send geofence exit alert to guardian
     */
    public function sendGeofenceExitAlert(Guardian $guardian, Bracelet $bracelet, SafetyZone $zone)
    {
        return $this->sendGeofenceAlert($guardian, $bracelet, $zone, 'exit');
    }

    /**
     * Send generic geofence alert
     */
    private function sendGeofenceAlert(Guardian $guardian, Bracelet $bracelet, SafetyZone $zone, $type)
    {
        if (!$guardian->expo_push_token) {
            Log::warning("Guardian {$guardian->id} has no expo push token");
            return false;
        }

        $title = $type === 'entry' ? 'Entrée Zone' : 'Sortie Zone';
        $message = $type === 'entry'
            ? "{$bracelet->alias} est entré(e) dans {$zone->name}"
            : "{$bracelet->alias} a quitté {$zone->name}";

        $payload = [
            'to' => $guardian->expo_push_token,
            'sound' => 'default',
            'title' => $title,
            'body' => $message,
            'data' => [
                'type' => "zone_{$type}",
                'bracelet_id' => (string) $bracelet->id,
                'zone_id' => (string) $zone->id,
                'zone_name' => $zone->name,
                'latitude' => (string) $bracelet->last_latitude,
                'longitude' => (string) $bracelet->last_longitude,
            ],
            'channelId' => 'safety-alerts',
            'badge' => 1,
            'priority' => 'high',
        ];

        try {
            $response = Http::timeout(5)->post($this->expoApiUrl, $payload);

            if (!$response->successful()) {
                Log::error("Expo push notification failed", [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'guardian_id' => $guardian->id,
                ]);
                return false;
            }

            Log::info("Expo push notification sent", [
                'guardian_id' => $guardian->id,
                'bracelet_id' => $bracelet->id,
                'zone_id' => $zone->id,
                'type' => $type,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Expo push notification exception: " . $e->getMessage(), [
                'guardian_id' => $guardian->id,
                'bracelet_id' => $bracelet->id,
            ]);
            return false;
        }
    }

    /**
     * Send emergency alert
     */
    public function sendEmergencyAlert(Guardian $guardian, Bracelet $bracelet, $message = null)
    {
        if (!$guardian->expo_push_token) {
            return false;
        }

        $body = $message ?? "{$bracelet->alias} a déclenché une alerte d'urgence!";

        $payload = [
            'to' => $guardian->expo_push_token,
            'sound' => 'default',
            'title' => '🚨 ALERTE D\'URGENCE',
            'body' => $body,
            'data' => [
                'type' => 'emergency',
                'bracelet_id' => (string) $bracelet->id,
                'latitude' => (string) $bracelet->last_latitude,
                'longitude' => (string) $bracelet->last_longitude,
            ],
            'badge' => 1,
            'priority' => 'high',
        ];

        try {
            Http::timeout(5)->post($this->expoApiUrl, $payload);
            return true;
        } catch (\Exception $e) {
            Log::error("Emergency alert failed: " . $e->getMessage());
            return false;
        }
    }
}
