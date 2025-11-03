<?php

namespace App\Filament\Resources\BraceletCommands\Pages;

use App\Filament\Resources\BraceletCommands\BraceletCommandResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListBraceletCommands extends ListRecords
{
    protected static string $resource = BraceletCommandResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
