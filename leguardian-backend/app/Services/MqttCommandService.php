<?php

namespace App\Services;

use App\Models\Bracelet;
use App\Models\BraceletCommand;
use Illuminate\Support\Facades\Log;
use PhpMqtt\Client\MqttClient;

class MqttCommandService
{
    protected MqttClient $client;

    public function __construct()
    {
        $this->client = new MqttClient(
            config('mqtt.host'),
            config('mqtt.port'),
            config('mqtt.client_id') ?? 'leguardian-backend'
        );
    }

    /**
     * Envoyer une commande au bracelet via MQTT
     */
    public function sendCommand(BraceletCommand $command): bool
    {
        try {
            $bracelet = $command->bracelet;

            if (!$bracelet) {
                Log::error('Bracelet not found for command ID: ' . $command->id);
                return false;
            }

            // Construire le payload de la commande
            $payload = $this->buildCommandPayload($command);

            // Se connecter si nécessaire
            if (!$this->client->isConnected()) {
                $this->client->connect();
            }

            // Publier la commande sur le topic du bracelet
            $topic = "bracelets/{$bracelet->unique_code}/commands";
            $this->client->publish($topic, json_encode($payload), 0, false, false);

            // Mettre à jour le statut de la commande
            $command->update(['status' => 'sent']);

            Log::info('Command sent to bracelet', [
                'command_id' => $command->id,
                'bracelet_id' => $bracelet->id,
                'command_type' => $command->command_type,
                'topic' => $topic,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Error sending command to bracelet: ' . $e->getMessage(), [
                'command_id' => $command->id,
            ]);

            return false;
        } finally {
            if ($this->client->isConnected()) {
                $this->client->disconnect();
            }
        }
    }

    /**
     * Construire le payload JSON pour la commande
     */
    private function buildCommandPayload(BraceletCommand $command): array
    {
        $basePayload = [
            'command_id' => $command->id,
            'command_type' => $command->command_type,
            'timestamp' => now()->toIso8601String(),
        ];

        // Ajouter des paramètres spécifiques selon le type de commande
        switch ($command->command_type) {
            case 'vibrate_short':
                $basePayload['duration'] = 100;  // milliseconds
                break;

            case 'vibrate_medium':
                $basePayload['duration'] = 300;
                break;

            case 'vibrate_sos':
                $basePayload['pattern'] = 'sos';  // SOS morse code pattern
                break;

            case 'led_on':
                $basePayload['color'] = $command->led_color ?? 'blue';
                $basePayload['pattern'] = $command->led_pattern ?? 'solid';
                break;

            case 'led_off':
                $basePayload['immediate'] = true;
                break;

            case 'enable_emergency_mode':
                $basePayload['auto_send_interval'] = 10000;  // 10 seconds
                break;

            case 'disable_emergency_mode':
                $basePayload['auto_send_interval'] = 60000;  // 60 seconds
                break;

            case 'update_firmware':
                $basePayload['firmware_url'] = $command->metadata['firmware_url'] ?? null;
                $basePayload['firmware_version'] = $command->metadata['firmware_version'] ?? null;
                break;

            case 'sync_time':
                $basePayload['unix_timestamp'] = now()->timestamp;
                $basePayload['timezone'] = config('app.timezone');
                break;

            case 'configure_gps':
                $basePayload['gps_update_interval'] = $command->metadata['interval'] ?? 60;
                break;

            default:
                // Commande générique
                break;
        }

        return $basePayload;
    }

    /**
     * Récupérer toutes les commandes en attente pour un bracelet
     */
    public function getPendingCommands(Bracelet $bracelet): array
    {
        return $bracelet->commands()
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Marquer une commande comme exécutée
     */
    public function markAsExecuted(BraceletCommand $command): bool
    {
        try {
            $command->update([
                'status' => 'executed',
                'executed_at' => now(),
            ]);

            Log::info('Command marked as executed', [
                'command_id' => $command->id,
                'bracelet_id' => $command->bracelet_id,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Error marking command as executed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Marquer une commande comme échouée
     */
    public function markAsFailed(BraceletCommand $command, string $reason = ''): bool
    {
        try {
            $command->update([
                'status' => 'failed',
                'executed_at' => now(),
                'metadata' => array_merge(
                    $command->metadata ?? [],
                    ['error_reason' => $reason]
                ),
            ]);

            Log::warning('Command marked as failed', [
                'command_id' => $command->id,
                'bracelet_id' => $command->bracelet_id,
                'reason' => $reason,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Error marking command as failed: ' . $e->getMessage());
            return false;
        }
    }
}
