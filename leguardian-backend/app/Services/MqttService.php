<?php

namespace App\Services;

use PhpMqtt\Client\MqttClient;
use Illuminate\Support\Facades\Log;

class MqttService
{
    protected MqttClient $client;
    protected bool $connected = false;

    public function __construct()
    {
        $this->client = new MqttClient(
            config('mqtt.host'),
            config('mqtt.port'),
            config('mqtt.client_id') ?? 'leguardian-backend'
        );
    }

    public function connect(): bool
    {
        try {
            if (!$this->client->isConnected()) {
                $this->client->connect();
            }
            $this->connected = true;
            return true;
        } catch (\Exception $e) {
            Log::error('MQTT Connection failed: ' . $e->getMessage());
            $this->connected = false;
            return false;
        }
    }

    public function disconnect(): void
    {
        try {
            if ($this->connected && $this->client->isConnected()) {
                $this->client->disconnect();
            }
        } catch (\Exception $e) {
            Log::error('MQTT Disconnect failed: ' . $e->getMessage());
        }
        $this->connected = false;
    }

    public function publish(string $topic, string $message, int $qos = 0): bool
    {
        try {
            if (!$this->client->isConnected()) {
                $this->connect();
            }
            $this->client->publish($topic, $message, $qos, false, false);
            return true;
        } catch (\Exception $e) {
            Log::error('MQTT Publish failed on topic ' . $topic . ': ' . $e->getMessage());
            return false;
        }
    }

    public function subscribe(string $topic, callable $callback, int $qos = 0): void
    {
        try {
            $this->client->subscribe($topic, $callback, $qos);
        } catch (\Exception $e) {
            Log::error('MQTT Subscribe failed on topic ' . $topic . ': ' . $e->getMessage());
        }
    }

    public function isConnected(): bool
    {
        try {
            return $this->client->isConnected();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getClient(): MqttClient
    {
        return $this->client;
    }
}
