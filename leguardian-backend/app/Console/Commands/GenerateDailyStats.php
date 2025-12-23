<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Guardian;
use App\Models\Bracelet;
use App\Models\BraceletEvent;
use App\Models\BraceletCommand;
use App\Services\DiscordEventService;

class GenerateDailyStats extends Command
{
    protected $signature = 'discord:daily-stats';
    protected $description = 'Generate and send daily statistics to Discord';

    public function handle()
    {
        $this->info('📊 Generating daily statistics...');

        // Calculate stats
        // Active users = guardians with bracelets
        $activeUsers = Guardian::whereHas('bracelets')->count();
        $totalBracelets = Bracelet::count();
        $newRegistrations = Bracelet::where('created_at', '>=', now()->startOfDay())->count();
        $eventsToday = BraceletEvent::where('created_at', '>=', now()->startOfDay())->count();

        // Total commands sent to bracelets today
        $commandsSent = BraceletCommand::where('created_at', '>=', now()->startOfDay())->count();

        // Bracelets in emergency mode
        $braceletsInEmergency = Bracelet::where('status', 'emergency')->count();

        // Geofence alerts today (using arrived/lost events as geofence triggers)
        $geofenceAlerts = BraceletEvent::where('created_at', '>=', now()->startOfDay())
            ->whereIn('event_type', ['arrived', 'lost'])
            ->count();

        // Calculate average battery life in hours (assuming 1% per hour consumption)
        $avgBattery = Bracelet::where('is_paired', true)
            ->avg('battery_level') ?? 0;
        $batteryHours = round($avgBattery * 1); // 1% = 1 hour (simplified estimate)

        $stats = [
            'active_users' => $activeUsers,
            'total_bracelets' => $totalBracelets,
            'new_registrations' => $newRegistrations,
            'events_today' => $eventsToday,
            'commands_sent' => $commandsSent,
            'bracelets_emergency' => $braceletsInEmergency,
            'geofence_alerts' => $geofenceAlerts,
            'battery_hours_avg' => $batteryHours,
        ];

        $this->info('Stats collected:');
        $this->table(['Metric', 'Value'], [
            ['Active Users', $stats['active_users']],
            ['Total Bracelets', $stats['total_bracelets']],
            ['New Registrations', $stats['new_registrations']],
            ['Events Today', $stats['events_today']],
            ['Commands Sent', $stats['commands_sent']],
            ['Bracelets in Emergency', $stats['bracelets_emergency']],
            ['Geofence Alerts', $stats['geofence_alerts']],
            ['Avg Battery Hours', $stats['battery_hours_avg'] . 'h'],
        ]);

        // Send to Discord
        $discordService = new DiscordEventService();
        $discordService->sendDailyStats($stats);

        $this->info('✅ Daily stats sent to Discord!');
    }
}
