<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MqttService;
use App\Models\Device;
use Illuminate\Support\Facades\Log;

class MqttListenCommand extends Command
{
    protected $signature = 'mqtt:listen';
    protected $description = 'Listen for MQTT messages from bracelets';

    public function handle()
    {
        $mqtt = new MqttService();

        if (!$mqtt->connect()) {
            $this->error('Failed to connect to MQTT broker');
            return 1;
        }

        $this->info('Connected to MQTT broker');

        // Subscribe to all bracelet telemetry topics
        $mqtt->subscribe('bracelets/+/telemetry', function ($topic, $message) {
            $this->processTelemetry($topic, $message);
        });

        // Keep listening
        $this->info('Listening for MQTT messages (Ctrl+C to exit)...');

        try {
            while (true) {
                $mqtt->getClient()->loop(true, 1);
            }
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
        } finally {
            $mqtt->disconnect();
        }

        return 0;
    }

    private function processTelemetry(string $topic, string $message): void
    {
        try {
            // Extract bracelet_id from topic: bracelets/{bracelet_id}/telemetry
            $parts = explode('/', $topic);
            $braceletId = $parts[1] ?? null;

            if (!$braceletId) {
                Log::warning('Invalid MQTT topic format: ' . $topic);
                return;
            }

            // Find device by unique code
            $device = Device::where('unique_code', $braceletId)->first();
            if (!$device) {
                Log::warning('Device not found: ' . $braceletId);
                return;
            }

            // Parse JSON message
            $data = json_decode($message, true);
            if (!$data) {
                Log::warning('Invalid JSON received: ' . $message);
                return;
            }

            // Store telemetry (create new record or update)
            $device->updateTelemetry($data);

            Log::info('Telemetry received from ' . $braceletId);
        } catch (\Exception $e) {
            Log::error('Error processing MQTT telemetry: ' . $e->getMessage());
        }
    }
}
