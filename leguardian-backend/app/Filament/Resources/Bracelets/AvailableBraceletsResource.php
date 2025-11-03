<?php

namespace App\Filament\Resources\Bracelets;

use App\Models\Bracelet;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;

class AvailableBraceletsResource extends Resource
{
    protected static ?string $model = Bracelet::class;

    protected static ?string $label = 'Bracelets Non Appareillés';

    protected static ?string $pluralLabel = 'Bracelets Non Appareillés';

    protected static ?int $navigationSort = 5;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-inbox-stack';

    public static function getNavigationGroup(): ?string
    {
        return 'Gestion des Bracelets';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->schema([
                TextInput::make('name')
                    ->label('Nom')
                    ->required(),
                TextInput::make('unique_code')
                    ->label('Code Unique')
                    ->required()
                    ->unique(ignoreRecord: true),
                Select::make('status')
                    ->label('Statut')
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
                    ->label('Version du Firmware'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn($query) => $query->unpaired())
            ->columns([
                TextColumn::make('name')
                    ->label('Nom')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('unique_code')
                    ->label('Code Unique')
                    ->searchable()
                    ->sortable()
                    ->copyable(),
                BadgeColumn::make('status')
                    ->label('Statut')
                    ->colors([
                        'success' => 'active',
                        'warning' => 'emergency',
                        'secondary' => 'inactive',
                    ])
                    ->formatStateUsing(fn($state) => match ($state) {
                        'active' => '✓ Actif',
                        'emergency' => '⚠ Urgence',
                        'inactive' => 'Inactif',
                        default => $state,
                    }),
                TextColumn::make('battery_level')
                    ->label('Batterie (%)')
                    ->sortable(),
                TextColumn::make('firmware_version')
                    ->label('Firmware'),
                TextColumn::make('created_at')
                    ->label('Créé le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Statut')
                    ->options([
                        'active' => 'Actif',
                        'inactive' => 'Inactif',
                        'emergency' => 'Urgence',
                    ]),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->defaultSort('created_at', 'desc')
            ->paginated([10, 25, 50]);
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\Bracelets\Pages\ListAvailableBracelets::route('/'),
            'create' => \App\Filament\Resources\Bracelets\Pages\CreateAvailableBracelet::route('/create'),
            'edit' => \App\Filament\Resources\Bracelets\Pages\EditAvailableBracelet::route('/{record}/edit'),
        ];
    }
}
