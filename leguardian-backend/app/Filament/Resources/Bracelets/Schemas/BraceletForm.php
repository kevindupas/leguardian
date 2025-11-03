<?php

namespace App\Filament\Resources\Bracelets\Schemas;

use App\Models\Guardian;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Placeholder;
use Filament\Schemas\Schema;

class BraceletForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('guardian_id')
                    ->label('Responsable')
                    ->options(Guardian::pluck('name', 'id'))
                    ->required()
                    ->searchable(),
                TextInput::make('unique_code')
                    ->label('Code Unique')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(255),
                TextInput::make('name')
                    ->label('Nom du Bracelet')
                    ->required()
                    ->maxLength(255),
                Select::make('status')
                    ->label('État')
                    ->options([
                        'active' => 'Actif',
                        'inactive' => 'Inactif',
                        'emergency' => 'Urgence',
                    ])
                    ->required(),
                TextInput::make('battery_level')
                    ->label('Niveau de Batterie (%)')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(100),
                TextInput::make('firmware_version')
                    ->label('Version Firmware')
                    ->maxLength(255),
                Placeholder::make('last_ping_at')
                    ->label('Dernier Signal')
                    ->content(fn ($record) => $record?->last_ping_at?->diffForHumans() ?? 'Jamais'),
            ]);
    }
}
