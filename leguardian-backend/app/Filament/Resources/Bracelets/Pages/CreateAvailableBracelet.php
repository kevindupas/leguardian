<?php

namespace App\Filament\Resources\Bracelets\Pages;

use App\Filament\Resources\Bracelets\AvailableBraceletsResource;
use Filament\Resources\Pages\CreateRecord;

class CreateAvailableBracelet extends CreateRecord
{
    protected static string $resource = AvailableBraceletsResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // Assurer que les bracelets disponibles n'ont pas de guardian
        $data['guardian_id'] = null;
        $data['is_paired'] = false;
        $data['paired_at'] = null;

        return $data;
    }
}
