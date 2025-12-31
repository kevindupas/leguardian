<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MqttService;
use App\Models\Bracelet;
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

            // Find bracelet by unique code, or create it if it doesn't exist
            $bracelet = Bracelet::where('unique_code', $braceletId)->first();
            if (!$bracelet) {
                $bracelet = $this->registerNewBracelet($braceletId);
                if (!$bracelet) {
                    Log::warning('Failed to register new bracelet: ' . $braceletId);
                    return;
                }
            }

            // Parse JSON message
            $data = json_decode($message, true);
            if (!$data) {
                Log::warning('Invalid JSON received: ' . $message);
                return;
            }

            // Store telemetry (create new record or update)
            $bracelet->updateTelemetry($data);

            Log::info('Telemetry received from ' . $braceletId);
        } catch (\Exception $e) {
            Log::error('Error processing MQTT telemetry: ' . $e->getMessage());
        }
    }

    private function registerNewBracelet(string $uniqueCode): ?Bracelet
    {
        try {
            $bracelet = Bracelet::create([
                'unique_code' => $uniqueCode,
                'name' => 'Bracelet ' . $uniqueCode,
                'status' => 'offline',
                'is_paired' => false,
                'battery_level' => 0,
            ]);

            Log::info('New bracelet auto-registered: ' . $uniqueCode . ' (ID: ' . $bracelet->id . ')');
            return $bracelet;
        } catch (\Exception $e) {
            Log::error('Error registering bracelet ' . $uniqueCode . ': ' . $e->getMessage());
            return null;
        }
    }
}
