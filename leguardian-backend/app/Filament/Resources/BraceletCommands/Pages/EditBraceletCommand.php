<?php

namespace App\Filament\Resources\BraceletCommands\Pages;

use App\Filament\Resources\BraceletCommands\BraceletCommandResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditBraceletCommand extends EditRecord
{
    protected static string $resource = BraceletCommandResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
