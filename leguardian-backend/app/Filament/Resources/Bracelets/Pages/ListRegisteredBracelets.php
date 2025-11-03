<?php

namespace App\Filament\Resources\Bracelets\Pages;

use App\Filament\Resources\Bracelets\RegisteredBraceletsResource;
use Filament\Pages\Page;
use Filament\Resources\Pages\ListRecords;

class ListRegisteredBracelets extends ListRecords
{
    protected static string $resource = RegisteredBraceletsResource::class;

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\CreateAction::make()
                ->label('Ajouter un bracelet enregistré'),
        ];
    }
}
