<?php

namespace App\Filament\Resources\Bracelets\Pages;

use App\Filament\Resources\Bracelets\AvailableBraceletsResource;
use Filament\Pages\Page;
use Filament\Resources\Pages\ListRecords;

class ListAvailableBracelets extends ListRecords
{
    protected static string $resource = AvailableBraceletsResource::class;

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\CreateAction::make()
                ->label('Ajouter un bracelet'),
        ];
    }
}
