<?php

namespace App\Filament\Resources\BraceletCommands\Schemas;

use App\Models\Bracelet;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\DateTimePickerField;
use Filament\Schemas\Schema;

class BraceletCommandForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('bracelet_id')
                    ->label('Bracelet')
                    ->options(Bracelet::pluck('name', 'id'))
                    ->required(),
                Select::make('command_type')
                    ->label('Command Type')
                    ->options([
                        'vibrate_short' => 'Vibrate Short',
                        'vibrate_medium' => 'Vibrate Medium',
                        'vibrate_sos' => 'Vibrate SOS',
                    ])
                    ->required(),
                Select::make('status')
                    ->label('Status')
                    ->options([
                        'pending' => 'Pending',
                        'executed' => 'Executed',
                        'failed' => 'Failed',
                    ])
                    ->default('pending')
                    ->required(),
                TextInput::make('led_color')
                    ->label('LED Color')
                    ->helperText('e.g., red, blue, green, yellow'),
                TextInput::make('led_pattern')
                    ->label('LED Pattern')
                    ->helperText('e.g., blink, solid, pulse'),
                DateTimePickerField::make('executed_at')
                    ->label('Executed At'),
            ]);
    }
}
