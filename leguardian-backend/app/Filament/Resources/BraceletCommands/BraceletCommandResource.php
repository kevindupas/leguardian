<?php

namespace App\Filament\Resources\BraceletCommands;

use App\Filament\Resources\BraceletCommands\Pages\CreateBraceletCommand;
use App\Filament\Resources\BraceletCommands\Pages\EditBraceletCommand;
use App\Filament\Resources\BraceletCommands\Pages\ListBraceletCommands;
use App\Filament\Resources\BraceletCommands\Schemas\BraceletCommandForm;
use App\Filament\Resources\BraceletCommands\Tables\BraceletCommandsTable;
use App\Models\BraceletCommand;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class BraceletCommandResource extends Resource
{
    protected static ?string $model = BraceletCommand::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCog6Tooth;

    public static function form(Schema $schema): Schema
    {
        return BraceletCommandForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return BraceletCommandsTable::configure($table);
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
            'index' => ListBraceletCommands::route('/'),
            'create' => CreateBraceletCommand::route('/create'),
            'edit' => EditBraceletCommand::route('/{record}/edit'),
        ];
    }
}
