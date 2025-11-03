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
use Filament\Tables\Columns\ImageColumn;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;

class RegisteredBraceletsResource extends Resource
{
    protected static ?string $model = Bracelet::class;

    protected static ?string $label = 'Bracelets Enregistrés';

    protected static ?string $pluralLabel = 'Bracelets Enregistrés';

    protected static ?int $navigationSort = 6;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-check-circle';

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
                Select::make('guardian_id')
                    ->label('Utilisateur (Guardian)')
                    ->relationship('guardian', 'name')
                    ->searchable()
                    ->required(),
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
            ->modifyQueryUsing(fn($query) => $query->paired())
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
                TextColumn::make('guardian.name')
                    ->label('Utilisateur')
                    ->searchable()
                    ->sortable(),
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
                TextColumn::make('paired_at')
                    ->label('Appareillé le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
                TextColumn::make('firmware_version')
                    ->label('Firmware'),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Statut')
                    ->options([
                        'active' => 'Actif',
                        'inactive' => 'Inactif',
                        'emergency' => 'Urgence',
                    ]),
                SelectFilter::make('guardian_id')
                    ->label('Utilisateur')
                    ->relationship('guardian', 'name'),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->defaultSort('paired_at', 'desc')
            ->paginated([10, 25, 50]);
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\Bracelets\Pages\ListRegisteredBracelets::route('/'),
            'create' => \App\Filament\Resources\Bracelets\Pages\CreateRegisteredBracelet::route('/create'),
            'edit' => \App\Filament\Resources\Bracelets\Pages\EditRegisteredBracelet::route('/{record}/edit'),
        ];
    }
}
