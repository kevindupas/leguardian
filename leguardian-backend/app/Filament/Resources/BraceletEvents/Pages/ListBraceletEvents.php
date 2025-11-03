<?php

namespace App\Filament\Resources\BraceletEvents\Pages;

use App\Filament\Resources\BraceletEvents\BraceletEventResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListBraceletEvents extends ListRecords
{
    protected static string $resource = BraceletEventResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
