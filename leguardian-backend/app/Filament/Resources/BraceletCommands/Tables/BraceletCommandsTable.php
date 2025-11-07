<?php

namespace App\Filament\Resources\BraceletCommands\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Table;

class BraceletCommandsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('bracelet.name')
                    ->label('Bracelet')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('command_type')
                    ->label('Command Type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'vibrate_short' => 'blue',
                        'vibrate_medium' => 'cyan',
                        'vibrate_sos' => 'red',
                        default => 'gray',
                    })
                    ->searchable()
                    ->sortable(),
                BadgeColumn::make('status')
                    ->label('Status')
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'warning',
                        'executed' => 'success',
                        'failed' => 'danger',
                        default => 'gray',
                    })
                    ->searchable()
                    ->sortable(),
                TextColumn::make('led_color')
                    ->label('LED Color')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('led_pattern')
                    ->label('LED Pattern')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('executed_at')
                    ->label('Executed At')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->label('Created At')
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
