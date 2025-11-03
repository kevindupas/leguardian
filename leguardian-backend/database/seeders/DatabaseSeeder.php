<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed admins first (for Filament access)
        $this->call([
            AdminSeeder::class,
        ]);

        // Then seed guardians (parents)
        $this->call([
            GuardianSeeder::class,
        ]);

        // Finally seed bracelets and events
        $this->call([
            BraceletSeeder::class,
        ]);
    }
}
