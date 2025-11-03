<?php

namespace App\Filament\Resources\BraceletEvents\Pages;

use App\Filament\Resources\BraceletEvents\BraceletEventResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditBraceletEvent extends EditRecord
{
    protected static string $resource = BraceletEventResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
