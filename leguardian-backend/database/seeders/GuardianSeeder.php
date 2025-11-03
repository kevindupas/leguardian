<?php

namespace Database\Seeders;

use App\Models\Guardian;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class GuardianSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $guardians = [
            [
                'name' => 'Parent Test',
                'email' => 'parent@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+33612345678',
            ],
            [
                'name' => 'Marie Dupont',
                'email' => 'marie.dupont@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+33623456789',
            ],
            [
                'name' => 'Jean Martin',
                'email' => 'jean.martin@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+33634567890',
            ],
            [
                'name' => 'Sophie Bernard',
                'email' => 'sophie.bernard@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+33645678901',
            ],
            [
                'name' => 'Pierre Leclerc',
                'email' => 'pierre.leclerc@example.com',
                'password' => Hash::make('password123'),
                'phone' => '+33656789012',
            ],
        ];

        foreach ($guardians as $guardian) {
            Guardian::firstOrCreate(
                ['email' => $guardian['email']],
                $guardian
            );
        }
    }
}
