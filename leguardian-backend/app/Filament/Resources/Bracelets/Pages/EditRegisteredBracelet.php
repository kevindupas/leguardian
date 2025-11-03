<?php

namespace App\Filament\Resources\Bracelets\Pages;

use App\Filament\Resources\Bracelets\RegisteredBraceletsResource;
use Filament\Resources\Pages\EditRecord;

class EditRegisteredBracelet extends EditRecord
{
    protected static string $resource = RegisteredBraceletsResource::class;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        // Les bracelets enregistrés doivent avoir un guardian
        $data['is_paired'] = true;
        if (!isset($data['paired_at']) || !$data['paired_at']) {
            $data['paired_at'] = now();
        }

        return $data;
    }
}
