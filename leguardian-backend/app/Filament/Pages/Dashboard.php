<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\DashboardStatsWidget;
use BackedEnum;
use Filament\Pages\Dashboard as BaseDashboard;
use Filament\Support\Icons\Heroicon;

class Dashboard extends BaseDashboard
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedHome;

    public function getWidgets(): array
    {
        return [
            DashboardStatsWidget::class,
        ];
    }
}
