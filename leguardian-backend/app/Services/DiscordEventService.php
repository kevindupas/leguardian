<?php

namespace App\Services;

class DiscordEventService
{
    protected string $webhookDeviceOnline;
    protected string $webhookBraceletRegistered;
    protected string $webhookApiErrors;
    protected string $webhookDailyStats;

    public function __construct()
    {
        $this->webhookDeviceOnline = env('DISCORD_WEBHOOK_DEVICE_ONLINE', '');
        $this->webhookBraceletRegistered = env('DISCORD_WEBHOOK_BRACELET_REGISTERED', '');
        $this->webhookApiErrors = env('DISCORD_WEBHOOK_API_ERRORS', '');
        $this->webhookDailyStats = env('DISCORD_WEBHOOK_DAILY_STATS', '');
    }

    /**
     * Send an event notification to Discord
     */
    public function sendEvent(string $title, string $description, array $fields = [], int $color = 0x00FF00): void
    {
        if (!$this->webhookUrl) {
            return;
        }

        try {
            $payload = [
                'embeds' => [
                    [
                        'title' => $title,
                        'description' => $description,
                        'color' => $color,
                        'fields' => $fields,
                        'timestamp' => now()->format('c'),
                    ],
                ],
                'username' => 'Le Guardian Events',
                'avatar_url' => 'https://cdn.discordapp.com/embed/avatars/1.png',
            ];

            $this->sendToDiscord($payload);
        } catch (\Exception $e) {
            error_log('Failed to send Discord event: ' . $e->getMessage());
        }
    }

    /**
     * Notify when a bracelet is registered by a user
     */
    public function notifyBraceletRegistered(array $braceletData, array $userData): void
    {
        if (!$this->webhookBraceletRegistered) {
            return;
        }

        $fields = [
            [
                'name' => '👤 Utilisateur',
                'value' => $userData['name'] ?? 'N/A',
                'inline' => true,
            ],
            [
                'name' => '⌚ Alias du bracelet',
                'value' => $braceletData['alias'] ?? 'Sans alias',
                'inline' => true,
            ],
            [
                'name' => '🔑 Code unique',
                'value' => '```' . $braceletData['unique_code'] . '```',
                'inline' => false,
            ],
        ];

        $payload = [
            'embeds' => [
                [
                    'title' => '✅ Nouveau bracelet enregistré',
                    'description' => 'Un utilisateur a enregistré un nouveau bracelet',
                    'color' => 0x00FF00, // Green
                    'fields' => $fields,
                    'timestamp' => now()->format('c'),
                ],
            ],
            'username' => 'Le Guardian Events',
            'avatar_url' => 'https://cdn.discordapp.com/embed/avatars/1.png',
        ];

        $this->sendToDiscord($this->webhookBraceletRegistered, $payload);
    }

    /**
     * Notify when a device comes online (first boot)
     */
    public function notifyDeviceOnline(string $uniqueCode, string $status, int $batteryLevel): void
    {
        if (!$this->webhookDeviceOnline) {
            return;
        }

        $fields = [
            [
                'name' => '🔑 Code unique',
                'value' => '```' . $uniqueCode . '```',
                'inline' => false,
            ],
            [
                'name' => '📍 Statut',
                'value' => $status,
                'inline' => true,
            ],
            [
                'name' => '🔋 Batterie',
                'value' => $batteryLevel . '%',
                'inline' => true,
            ],
        ];

        $payload = [
            'embeds' => [
                [
                    'title' => '⚙️ Nouvel appareil en ligne',
                    'description' => 'Un bracelet vient de faire son enregistrement initial (premier démarrage)',
                    'color' => 0x9C27B0, // Purple
                    'fields' => $fields,
                    'timestamp' => now()->format('c'),
                ],
            ],
            'username' => 'Le Guardian Events',
            'avatar_url' => 'https://cdn.discordapp.com/embed/avatars/1.png',
        ];

        $this->sendToDiscord($this->webhookDeviceOnline, $payload);
    }

    /**
     * Notify API error with details
     */
    public function notifyApiError(string $errorType, string $message, string $endpoint = '', array $additionalInfo = []): void
    {
        if (!$this->webhookApiErrors) {
            return;
        }

        $fields = [
            [
                'name' => '🔗 Endpoint',
                'value' => $endpoint ?: 'Unknown',
                'inline' => true,
            ],
            [
                'name' => '📝 Type',
                'value' => $errorType,
                'inline' => true,
            ],
            [
                'name' => '💬 Message',
                'value' => substr($message, 0, 300),
                'inline' => false,
            ],
        ];

        // Add additional info if provided
        if (!empty($additionalInfo)) {
            foreach ($additionalInfo as $key => $value) {
                if (is_array($value) || is_object($value)) {
                    $value = json_encode($value, JSON_UNESCAPED_SLASHES);
                }
                if (strlen($value) > 100) {
                    $value = substr($value, 0, 100) . '...';
                }
                $fields[] = [
                    'name' => $key,
                    'value' => $value,
                    'inline' => false,
                ];
            }
        }

        $payload = [
            'embeds' => [
                [
                    'title' => '⚠️ API Error: ' . $errorType,
                    'description' => $message,
                    'color' => 0xFF6B6B, // Red-orange
                    'fields' => $fields,
                    'timestamp' => now()->format('c'),
                ],
            ],
            'username' => 'Le Guardian API Monitor',
            'avatar_url' => 'https://cdn.discordapp.com/embed/avatars/1.png',
        ];

        $this->sendToDiscord($this->webhookApiErrors, $payload);
    }

    /**
     * Send daily statistics summary
     */
    public function sendDailyStats(array $stats): void
    {
        if (!$this->webhookDailyStats) {
            return;
        }

        // Default stats structure
        $defaultStats = [
            'active_users' => 0,
            'total_bracelets' => 0,
            'new_registrations' => 0,
            'events_today' => 0,
            'commands_sent' => 0,
            'bracelets_emergency' => 0,
            'geofence_alerts' => 0,
            'battery_hours_avg' => 0,
        ];

        $stats = array_merge($defaultStats, $stats);

        // Build description as a formatted list
        $description = "👥 Active Users: `" . $stats['active_users'] . "`\n\n"
            . "⌚ Total Bracelets: `" . $stats['total_bracelets'] . "`\n\n"
            . "✨ New Registrations: `" . $stats['new_registrations'] . "`\n\n"
            . "📊 Events Today: `" . $stats['events_today'] . "`\n\n"
            . "🎯 Commands Sent: `" . $stats['commands_sent'] . "`\n\n"
            . "🚨 Bracelets in Emergency: `" . $stats['bracelets_emergency'] . "`\n\n"
            . "🗺️ Geofence Alerts: `" . $stats['geofence_alerts'] . "`\n\n"
            . "🔋 Avg Battery Hours: `" . $stats['battery_hours_avg'] . "h`";

        $payload = [
            'embeds' => [
                [
                    'title' => '📈 Daily Statistics Report',
                    'description' => $description,
                    'color' => 0x00D4FF, // Cyan
                    'timestamp' => now()->format('c'),
                ],
            ],
            'username' => 'Le Guardian Analytics',
            'avatar_url' => 'https://cdn.discordapp.com/embed/avatars/2.png',
        ];

        $this->sendToDiscord($this->webhookDailyStats, $payload);
    }

    /**
     * Send payload to Discord webhook
     */
    protected function sendToDiscord(string $webhookUrl, array $payload): void
    {
        $ch = curl_init($webhookUrl);
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);

        curl_exec($ch);
        curl_close($ch);
    }
}
