<?php

namespace App\Filament\Resources\BraceletEvents;

use App\Filament\Resources\BraceletEvents\Pages\CreateBraceletEvent;
use App\Filament\Resources\BraceletEvents\Pages\EditBraceletEvent;
use App\Filament\Resources\BraceletEvents\Pages\ListBraceletEvents;
use App\Filament\Resources\BraceletEvents\Schemas\BraceletEventForm;
use App\Filament\Resources\BraceletEvents\Tables\BraceletEventsTable;
use App\Models\BraceletEvent;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class BraceletEventResource extends Resource
{
    protected static ?string $model = BraceletEvent::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBell;

    public static function form(Schema $schema): Schema
    {
        return BraceletEventForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return BraceletEventsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListBraceletEvents::route('/'),
            'create' => CreateBraceletEvent::route('/create'),
            'edit' => EditBraceletEvent::route('/{record}/edit'),
        ];
    }
}
