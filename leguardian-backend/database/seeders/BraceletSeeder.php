<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Guardian;
use App\Models\Bracelet;
use App\Models\BraceletEvent;

class BraceletSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all guardians
        $guardians = Guardian::all();

        if ($guardians->isEmpty()) {
            $this->command->warn('No guardians found. Run GuardianSeeder first.');
            return;
        }

        // Create paired bracelets (assigned to guardians)
        $pairedBraceletsData = [
            [
                'unique_code' => 'BRACELET001',
                'name' => 'Mathéo\'s Bracelet',
                'status' => 'active',
                'battery_level' => 85,
                'firmware_version' => '1.2.0',
            ],
            [
                'unique_code' => 'BRACELET002',
                'name' => 'Sophie\'s Bracelet',
                'status' => 'active',
                'battery_level' => 72,
                'firmware_version' => '1.2.0',
            ],
            [
                'unique_code' => 'BRACELET003',
                'name' => 'Alice\'s Bracelet',
                'status' => 'active',
                'battery_level' => 91,
                'firmware_version' => '1.2.0',
            ],
            [
                'unique_code' => 'BRACELET004',
                'name' => 'Thomas\'s Bracelet',
                'status' => 'emergency',
                'battery_level' => 15,
                'firmware_version' => '1.1.5',
            ],
            [
                'unique_code' => 'BRACELET005',
                'name' => 'Emma\'s Bracelet',
                'status' => 'inactive',
                'battery_level' => 5,
                'firmware_version' => '1.0.0',
            ],
        ];

        // Distribute paired bracelets among guardians
        foreach ($pairedBraceletsData as $idx => $data) {
            $guardian = $guardians[$idx % $guardians->count()];

            $bracelet = Bracelet::firstOrCreate(
                ['unique_code' => $data['unique_code']],
                array_merge($data, [
                    'guardian_id' => $guardian->id,
                    'is_paired' => true,
                    'paired_at' => now(),
                ])
            );

            // Create varied events for each bracelet
            $this->createEventsForBracelet($bracelet);
        }

        // Create unpaired bracelets (available for registration)
        $unpairedBraceletsData = [
            [
                'unique_code' => 'AVAIL001',
                'name' => 'Available Bracelet 1',
                'status' => 'inactive',
                'battery_level' => 100,
                'firmware_version' => '1.2.0',
            ],
            [
                'unique_code' => 'AVAIL002',
                'name' => 'Available Bracelet 2',
                'status' => 'inactive',
                'battery_level' => 95,
                'firmware_version' => '1.2.0',
            ],
            [
                'unique_code' => 'AVAIL003',
                'name' => 'Available Bracelet 3',
                'status' => 'inactive',
                'battery_level' => 88,
                'firmware_version' => '1.2.0',
            ],
            [
                'unique_code' => 'AVAIL004',
                'name' => 'Available Bracelet 4',
                'status' => 'inactive',
                'battery_level' => 92,
                'firmware_version' => '1.2.0',
            ],
        ];

        // Create unpaired bracelets
        foreach ($unpairedBraceletsData as $data) {
            Bracelet::firstOrCreate(
                ['unique_code' => $data['unique_code']],
                array_merge($data, [
                    'guardian_id' => null,
                    'is_paired' => false,
                ])
            );
        }
    }

    private function createEventsForBracelet(Bracelet $bracelet): void
    {
        $eventPatterns = [
            ['type' => 'arrived', 'lat' => 48.8566, 'lng' => 2.3522, 'resolved' => true, 'daysAgo' => 2],
            ['type' => 'lost', 'lat' => 48.8600, 'lng' => 2.3600, 'resolved' => true, 'daysAgo' => 1],
            ['type' => 'arrived', 'lat' => 48.8700, 'lng' => 2.3650, 'resolved' => true, 'daysAgo' => 0.5],
            ['type' => 'danger', 'lat' => 48.8750, 'lng' => 2.3700, 'resolved' => false, 'daysAgo' => 0.1],
        ];

        foreach ($eventPatterns as $pattern) {
            $createdAt = now()->subDays($pattern['daysAgo']);
            $resolved_at = $pattern['resolved'] ? $createdAt->copy()->addHours(2) : null;

            BraceletEvent::create([
                'bracelet_id' => $bracelet->id,
                'event_type' => $pattern['type'],
                'latitude' => $pattern['lat'],
                'longitude' => $pattern['lng'],
                'accuracy' => rand(5, 30),
                'battery_level' => rand(20, 95),
                'resolved' => $pattern['resolved'],
                'resolved_at' => $resolved_at,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
    }
}
