<?php

namespace App\Filament\Widgets;

use App\Models\Bracelet;
use App\Models\Guardian;
use App\Models\BraceletEvent;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class DashboardStatsWidget extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Administrateurs', User::count())
                ->description('Admin users')
                ->descriptionIcon('heroicon-m-lock-closed')
                ->color('info')
                ->icon('heroicon-o-shield-check'),

            Stat::make('Responsables', Guardian::count())
                ->description('Parents/Guardians')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('success')
                ->icon('heroicon-o-users'),

            Stat::make('Bracelets', Bracelet::count())
                ->description('Total devices')
                ->descriptionIcon('heroicon-m-sparkles')
                ->color('warning')
                ->icon('heroicon-o-sparkles'),

            Stat::make('Actifs', Bracelet::where('status', 'active')->count())
                ->description('Active devices')
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success')
                ->icon('heroicon-o-check-circle'),

            Stat::make('En Urgence', Bracelet::where('status', 'emergency')->count())
                ->description('Emergency status')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color('danger')
                ->icon('heroicon-o-exclamation-triangle'),

            Stat::make('Inactifs', Bracelet::where('status', 'inactive')->count())
                ->description('Inactive devices')
                ->descriptionIcon('heroicon-m-x-circle')
                ->color('gray')
                ->icon('heroicon-o-x-circle'),

            Stat::make('Événements', BraceletEvent::count())
                ->description('Total events')
                ->descriptionIcon('heroicon-m-bell')
                ->color('info')
                ->icon('heroicon-o-bell'),

            Stat::make('Non Résolus', BraceletEvent::where('resolved', false)->count())
                ->description('Unresolved events')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning')
                ->icon('heroicon-o-clock'),

            Stat::make('Batterie Moyenne', round(Bracelet::average('battery_level'), 1) . '%')
                ->description('Average battery level')
                ->descriptionIcon('heroicon-m-bolt')
                ->color(Bracelet::average('battery_level') > 50 ? 'success' : 'danger')
                ->icon('heroicon-o-bolt'),
        ];
    }
}
