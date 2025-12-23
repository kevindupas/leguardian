<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DiscordEventService;

class TestDiscordEvents extends Command
{
    protected $signature = 'discord:test-events';
    protected $description = 'Test all Discord event notifications';

    public function handle()
    {
        $this->info('Testing Discord event notifications...');
        $this->newLine();

        $discordService = new DiscordEventService();

        // Test 1: Bracelet registration
        $this->info('1️⃣  Testing bracelet registration event...');
        $discordService->notifyBraceletRegistered(
            [
                'unique_code' => 'TEST-BRACELET-123',
                'alias' => 'Mon Bracelet de Test',
            ],
            [
                'name' => 'Jean Dupont',
                'email' => 'jean@example.com',
            ]
        );
        $this->line('   ✓ Sent to Discord');
        $this->newLine();

        // Test 2: Device registration (auto-register)
        $this->info('2️⃣  Testing device auto-registration event...');
        $discordService->sendEvent(
            '⚙️ Nouvel appareil en ligne',
            'Un bracelet vient de faire son enregistrement initial (premier démarrage)',
            [
                [
                    'name' => '🔑 Code unique',
                    'value' => '```TEST-DEVICE-456```',
                    'inline' => false,
                ],
                [
                    'name' => '📍 Statut',
                    'value' => 'active',
                    'inline' => true,
                ],
                [
                    'name' => '🔋 Batterie',
                    'value' => '100%',
                    'inline' => true,
                ],
            ],
            0x9C27B0 // Purple
        );
        $this->line('   ✓ Sent to Discord');
        $this->newLine();

        // Test 3: Custom event with different color
        $this->info('3️⃣  Testing custom event...');
        $discordService->sendEvent(
            '🎉 Événement personnalisé',
            'Ceci est un exemple d\'événement personnalisé',
            [
                [
                    'name' => 'Test',
                    'value' => 'Ceci est un test',
                    'inline' => true,
                ],
                [
                    'name' => 'Timestamp',
                    'value' => now()->format('Y-m-d H:i:s'),
                    'inline' => true,
                ],
            ],
            0x00FF00 // Green
        );
        $this->line('   ✓ Sent to Discord');
        $this->newLine();

        $this->info('✅ All event tests sent! Check your Discord server.');
    }
}
