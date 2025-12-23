<?php

namespace App\Logging;

use Monolog\Handler\AbstractProcessingHandler;
use Monolog\LogRecord;
use Psr\Log\LogLevel;

class DiscordHandler extends AbstractProcessingHandler
{
    protected array $webhooks = [];

    public function __construct(
        $level = LogLevel::DEBUG,
        $bubble = true,
        array $webhooks = []
    ) {
        parent::__construct($level, $bubble);
        $this->webhooks = $webhooks;
    }

    protected function write(LogRecord $record): void
    {
        $levelName = $record->level->getName();
        $webhook = $this->getWebhookForLevel($levelName);

        if (!$webhook) {
            return;
        }

        try {
            $payload = $this->formatPayload($record);
            $this->sendToDiscord($webhook, $payload);
        } catch (\Exception $e) {
            // Silencieusement échouer pour ne pas casser l'app
            error_log('Failed to send Discord log: ' . $e->getMessage());
        }
    }

    protected function sendToDiscord(string $webhook, array $payload): void
    {
        $ch = curl_init($webhook);
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

    protected function getWebhookForLevel(string $level): ?string
    {
        return match (strtoupper($level)) {
            'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY' => $this->webhooks['error'] ?? null,
            'WARNING' => $this->webhooks['warning'] ?? null,
            'NOTICE', 'INFO', 'DEBUG' => $this->webhooks['info'] ?? null,
            default => null,
        };
    }

    protected function formatPayload(LogRecord $record): array
    {
        $color = $this->getColorForLevel($record->level->getName());
        $context = $record->context;
        $extra = $record->extra;

        // Construire la description
        $description = $record->message;
        if (!empty($context)) {
            $description .= "\n\n**Context:**\n";
            foreach ($context as $key => $value) {
                if (is_array($value) || is_object($value)) {
                    $value = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
                }
                $description .= "`{$key}`: {$value}\n";
            }
        }

        // Truncate si trop long
        if (strlen($description) > 2000) {
            $description = substr($description, 0, 1990) . '...\n[Truncated]';
        }

        // Déterminer le titre basé sur le niveau
        $title = match (strtoupper($record->level->getName())) {
            'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY' => '🔴 ' . strtoupper($record->level->getName()),
            'WARNING' => '🟠 WARNING',
            default => '🔵 INFO',
        };

        // Construire l'embed
        $embed = [
            'title' => $title,
            'description' => $description,
            'color' => $color,
            'timestamp' => $record->datetime->format('c'),
        ];

        // Ajouter les détails du fichier si disponibles
        if (isset($extra['file'], $extra['line'])) {
            $embed['fields'] = [
                [
                    'name' => 'File',
                    'value' => "```\n{$extra['file']}:{$extra['line']}\n```",
                    'inline' => false,
                ],
            ];
        }

        // Ajouter exception si présente
        if (isset($context['exception']) && $context['exception'] instanceof \Throwable) {
            $exception = $context['exception'];
            $exceptionClass = get_class($exception);
            $embed['fields'][] = [
                'name' => 'Exception',
                'value' => "```\n{$exceptionClass}\n{$exception->getMessage()}\n```",
                'inline' => false,
            ];
        }

        return [
            'embeds' => [$embed],
            'username' => 'Le Guardian Logger',
            'avatar_url' => 'https://cdn.discordapp.com/embed/avatars/0.png',
        ];
    }

    protected function getColorForLevel(string $level): int
    {
        return match (strtoupper($level)) {
            'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY' => 0xFF0000, // Red
            'WARNING' => 0xFFA500, // Orange
            default => 0x0099FF, // Blue
        };
    }
}
