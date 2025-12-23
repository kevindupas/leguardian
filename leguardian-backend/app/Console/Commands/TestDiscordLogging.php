<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TestDiscordLogging extends Command
{
    protected $signature = 'discord:test';
    protected $description = 'Test Discord logging by sending sample messages';

    public function handle()
    {
        $this->info('Testing Discord logging...');

        // Test info
        Log::info('🧪 This is a test INFO message from Le Guardian', [
            'timestamp' => now(),
            'test_type' => 'info',
        ]);
        $this->line('✓ Info message sent to Discord');

        // Test warning
        Log::warning('⚠️ This is a test WARNING message from Le Guardian', [
            'timestamp' => now(),
            'test_type' => 'warning',
        ]);
        $this->line('✓ Warning message sent to Discord');

        // Test error
        Log::error('❌ This is a test ERROR message from Le Guardian', [
            'timestamp' => now(),
            'test_type' => 'error',
        ]);
        $this->line('✓ Error message sent to Discord');

        $this->info('All test messages sent! Check your Discord server.');
    }
}
