<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Services\DiscordEventService;

class TestDiscordComplete extends Command
{
    protected $signature = 'discord:test-complete';
    protected $description = 'Complete test of all Discord integrations (logging + events)';

    public function handle()
    {
        $this->info('🚀 Testing complete Discord integration...');
        $this->newLine();

        // ========== LOGGING TESTS ==========
        $this->info('📋 LOGGING TESTS');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $this->info('1️⃣  Testing ERROR log...');
        Log::error('Test ERROR message from discord:test-complete', [
            'test' => true,
            'type' => 'error',
            'timestamp' => now(),
        ]);
        $this->line('   ✓ Sent to #errors');
        $this->newLine();

        $this->info('2️⃣  Testing WARNING log...');
        Log::warning('Test WARNING message from discord:test-complete', [
            'test' => true,
            'type' => 'warning',
            'timestamp' => now(),
        ]);
        $this->line('   ✓ Sent to #warnings');
        $this->newLine();

        $this->info('3️⃣  Testing INFO log...');
        Log::info('Test INFO message from discord:test-complete', [
            'test' => true,
            'type' => 'info',
            'timestamp' => now(),
        ]);
        $this->line('   ✓ Sent to #infos');
        $this->newLine();

        // ========== EVENT TESTS ==========
        $this->info('🎯 EVENT TESTS');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $discordService = new DiscordEventService();

        $this->info('4️⃣  Testing DEVICE ONLINE event...');
        $discordService->notifyDeviceOnline(
            'TEST-DEVICE-789',
            'active',
            100
        );
        $this->line('   ✓ Sent to #devices-online');
        $this->newLine();

        $this->info('5️⃣  Testing BRACELET REGISTERED event...');
        $discordService->notifyBraceletRegistered(
            [
                'unique_code' => 'TEST-BRACELET-789',
                'alias' => 'Test Bracelet Complete',
            ],
            [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]
        );
        $this->line('   ✓ Sent to #bracelets-registered');
        $this->newLine();

        // ========== SUMMARY ==========
        $this->info('✅ COMPLETE TEST FINISHED');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->line('');
        $this->table(['Channel', 'Type', 'Status'], [
            ['#errors', 'ERROR Log', '✓'],
            ['#warnings', 'WARNING Log', '✓'],
            ['#infos', 'INFO Log', '✓'],
            ['#devices-online', 'Device Online Event', '✓'],
            ['#bracelets-registered', 'Bracelet Registered Event', '✓'],
        ]);
        $this->newLine();
        $this->info('Check your Discord server for all messages! 🎉');
    }
}
