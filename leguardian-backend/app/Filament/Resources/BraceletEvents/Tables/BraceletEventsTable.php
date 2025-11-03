<?php

namespace App\Filament\Resources\BraceletEvents\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Table;

class BraceletEventsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('bracelet.name')
                    ->label('Bracelet')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('bracelet.guardian.name')
                    ->label('Responsable')
                    ->searchable()
                    ->sortable(),
                BadgeColumn::make('event_type')
                    ->label('Type')
                    ->colors([
                        'success' => 'arrived',
                        'danger' => 'lost',
                        'warning' => 'danger',
                    ])
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'arrived' => 'Arrivé',
                        'lost' => 'Perdu',
                        'danger' => 'Danger',
                        default => $state,
                    }),
                TextColumn::make('battery_level')
                    ->label('Batterie')
                    ->suffix('%'),
                BadgeColumn::make('resolved')
                    ->label('Résolu')
                    ->colors([
                        'success' => true,
                        'danger' => false,
                    ])
                    ->formatStateUsing(fn ($state) => $state ? 'Oui' : 'Non'),
                TextColumn::make('created_at')
                    ->label('Date')
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
