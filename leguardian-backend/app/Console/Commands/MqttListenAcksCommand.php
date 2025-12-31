<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MqttService;
use App\Models\BraceletCommand;
use App\Models\Bracelet;
use Illuminate\Support\Facades\Log;

class MqttListenAcksCommand extends Command
{
    protected $signature = 'mqtt:listen-acks';
    protected $description = 'Listen for ACK messages from bracelets confirming command execution';

    public function handle()
    {
        $mqtt = new MqttService();

        if (!$mqtt->connect()) {
            $this->error('Failed to connect to MQTT broker');
            return 1;
        }

        $this->info('Connected to MQTT broker');

        // Subscribe to all bracelet ACK topics
        $mqtt->subscribe('bracelets/+/ack', function ($topic, $message) {
            $this->processAck($topic, $message);
        });

        // Keep listening
        $this->info('Listening for ACK messages (Ctrl+C to exit)...');

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

    private function processAck(string $topic, string $message): void
    {
        try {
            // Extract bracelet_id from topic: bracelets/{bracelet_id}/ack
            $parts = explode('/', $topic);
            $braceletId = $parts[1] ?? null;

            if (!$braceletId) {
                Log::warning('Invalid MQTT ACK topic format: ' . $topic);
                return;
            }

            // Find bracelet by unique code
            $bracelet = Bracelet::where('unique_code', $braceletId)->first();
            if (!$bracelet) {
                Log::warning('Bracelet not found for ACK: ' . $braceletId);
                return;
            }

            // Parse JSON message
            $ackData = json_decode($message, true);
            if (!$ackData) {
                Log::warning('Invalid JSON received in ACK: ' . $message);
                return;
            }

            // Traiter l'ACK
            $this->processAckData($bracelet, $ackData);

        } catch (\Exception $e) {
            Log::error('Error processing MQTT ACK: ' . $e->getMessage());
        }
    }

    private function processAckData(Bracelet $bracelet, array $ackData): void
    {
        $commandId = $ackData['command_id'] ?? null;
        $status = $ackData['status'] ?? null;
        $error = $ackData['error'] ?? null;

        if (!$commandId) {
            Log::warning('ACK received without command_id', [
                'bracelet_id' => $bracelet->id,
                'ack_data' => $ackData,
            ]);
            return;
        }

        // Trouver la commande
        $command = BraceletCommand::find($commandId);
        if (!$command) {
            Log::warning('Command not found for ACK', [
                'command_id' => $commandId,
                'bracelet_id' => $bracelet->id,
            ]);
            return;
        }

        // Mettre à jour le statut de la commande
        if ($status === 'executed') {
            $command->update([
                'status' => 'executed',
                'executed_at' => now(),
            ]);

            Log::info('Command executed on bracelet', [
                'command_id' => $commandId,
                'bracelet_id' => $bracelet->id,
                'command_type' => $command->command_type,
            ]);
        } elseif ($status === 'failed') {
            $command->update([
                'status' => 'failed',
                'executed_at' => now(),
            ]);

            Log::error('Command execution failed on bracelet', [
                'command_id' => $commandId,
                'bracelet_id' => $bracelet->id,
                'command_type' => $command->command_type,
                'error' => $error,
            ]);
        }
    }
}
