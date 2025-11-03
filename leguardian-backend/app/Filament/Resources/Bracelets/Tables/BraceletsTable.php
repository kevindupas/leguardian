<?php

namespace App\Filament\Resources\Bracelets\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Table;

class BraceletsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('unique_code')
                    ->label('Code')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('name')
                    ->label('Nom')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('guardian.name')
                    ->label('Responsable')
                    ->searchable()
                    ->sortable(),
                BadgeColumn::make('status')
                    ->label('État')
                    ->colors([
                        'success' => 'active',
                        'warning' => 'emergency',
                        'gray' => 'inactive',
                    ])
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'active' => 'Actif',
                        'emergency' => 'Urgence',
                        'inactive' => 'Inactif',
                        default => $state,
                    }),
                TextColumn::make('battery_level')
                    ->label('Batterie')
                    ->suffix('%'),
                TextColumn::make('last_ping_at')
                    ->label('Dernier signal')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
