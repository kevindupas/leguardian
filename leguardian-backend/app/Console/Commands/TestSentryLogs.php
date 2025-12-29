<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TestSentryLogs extends Command
{
    protected $signature = 'sentry:test-logs';
    protected $description = 'Test Sentry log channel with various log levels';

    public function handle()
    {
        $this->info('🧪 Testing Sentry Log Channel...');
        $this->newLine();

        // Test info log
        $this->line('1️⃣  Sending INFO log...');
        Log::info('Test info message from Le Guardian', [
            'source' => 'test-sentry-logs',
            'timestamp' => now()->toDateTimeString(),
        ]);
        $this->line('   ✓ INFO log sent');
        $this->newLine();

        // Test warning log
        $this->line('2️⃣  Sending WARNING log...');
        Log::warning('Test warning message - potential issue detected', [
            'user_id' => 42,
            'bracelet_id' => 'BRACELET001',
            'issue' => 'Low battery warning',
        ]);
        $this->line('   ✓ WARNING log sent');
        $this->newLine();

        // Test error log
        $this->line('3️⃣  Sending ERROR log...');
        Log::error('Test error message - something went wrong', [
            'error_code' => 500,
            'endpoint' => '/api/bracelets/register',
            'user_email' => 'test@leguardian.com',
        ]);
        $this->line('   ✓ ERROR log sent');
        $this->newLine();

        // Test debug log
        $this->line('4️⃣  Sending DEBUG log...');
        Log::debug('Test debug message - detailed debugging info', [
            'query' => 'SELECT * FROM bracelets WHERE status = "active"',
            'execution_time' => '45ms',
        ]);
        $this->line('   ✓ DEBUG log sent');
        $this->newLine();

        // Test direct Sentry channel
        $this->line('5️⃣  Sending directly to Sentry channel...');
        Log::channel('sentry_logs')->error('Direct Sentry log - this only goes to Sentry', [
            'direct_channel' => true,
            'test_type' => 'channel_specific',
        ]);
        $this->line('   ✓ Direct Sentry log sent');
        $this->newLine();

        $this->info('✅ All test logs sent!');
        $this->line('Check your Sentry dashboard to see the logs:');
        $this->line('   https://sentry.io/');
        $this->newLine();
    }
}
