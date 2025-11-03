<?php

namespace App\Filament\Resources\Bracelets\Pages;

use App\Filament\Resources\Bracelets\RegisteredBraceletsResource;
use Filament\Resources\Pages\CreateRecord;

class CreateRegisteredBracelet extends CreateRecord
{
    protected static string $resource = RegisteredBraceletsResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // Les bracelets enregistrés doivent avoir un guardian
        $data['is_paired'] = true;
        $data['paired_at'] = now();

        return $data;
    }
}
