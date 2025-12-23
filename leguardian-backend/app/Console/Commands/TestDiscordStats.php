<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DiscordEventService;

class TestDiscordStats extends Command
{
    protected $signature = 'discord:test-stats';
    protected $description = 'Test API errors and daily stats Discord notifications';

    public function handle()
    {
        $this->info('🧪 Testing API Errors and Daily Stats...');
        $this->newLine();

        $discordService = new DiscordEventService();

        // ========== API ERRORS TESTS ==========
        $this->info('⚠️ API ERRORS TESTS');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $this->info('1️⃣  Testing VALIDATION error...');
        $discordService->notifyApiError(
            'Validation Error',
            'Invalid bracelet code format provided',
            'POST /api/bracelets/register',
            [
                'field' => 'unique_code',
                'validation_rule' => 'required|string|exists:bracelets',
            ]
        );
        $this->line('   ✓ Sent to #api-errors');
        $this->newLine();

        $this->info('2️⃣  Testing AUTHENTICATION error...');
        $discordService->notifyApiError(
            'Authentication Error',
            'Invalid or expired authentication token',
            'GET /api/bracelets',
            [
                'status_code' => '401',
                'error_code' => 'UNAUTHENTICATED',
            ]
        );
        $this->line('   ✓ Sent to #api-errors');
        $this->newLine();

        $this->info('3️⃣  Testing DATABASE error...');
        $discordService->notifyApiError(
            'Database Error',
            'Could not update bracelet status due to database constraint',
            'PATCH /api/bracelets/123',
            [
                'error_code' => 'FOREIGN_KEY_CONSTRAINT',
                'table' => 'bracelets',
            ]
        );
        $this->line('   ✓ Sent to #api-errors');
        $this->newLine();

        // ========== DAILY STATS TEST ==========
        $this->info('📊 DAILY STATS TEST');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        $this->info('4️⃣  Sending daily statistics...');
        $discordService->sendDailyStats([
            'active_users' => 42,
            'total_bracelets' => 127,
            'new_registrations' => 8,
            'events_today' => 243,
            'commands_sent' => 15,
            'bracelets_emergency' => 2,
            'geofence_alerts' => 5,
            'battery_hours_avg' => 76,
        ]);
        $this->line('   ✓ Sent to #daily-stats');
        $this->newLine();

        // ========== SUMMARY ==========
        $this->info('✅ ALL TESTS COMPLETED');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->line('');
        $this->table(['Channel', 'Type', 'Status'], [
            ['#api-errors', 'Validation Error', '✓'],
            ['#api-errors', 'Authentication Error', '✓'],
            ['#api-errors', 'Database Error', '✓'],
            ['#daily-stats', 'Daily Statistics', '✓'],
        ]);
        $this->newLine();
        $this->info('Check your Discord server for all messages! 🎉');
    }
}
