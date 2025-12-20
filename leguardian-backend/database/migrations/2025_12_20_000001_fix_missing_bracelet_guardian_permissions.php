<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix bracelets where the owner is missing from bracelet_guardian pivot table
        // This can happen when bracelets are registered before the pivot table is properly set up
        $bracelets = DB::table('bracelets')
            ->whereNotNull('guardian_id')
            ->where('is_paired', true)
            ->get();

        foreach ($bracelets as $bracelet) {
            $existing = DB::table('bracelet_guardian')
                ->where('bracelet_id', $bracelet->id)
                ->where('guardian_id', $bracelet->guardian_id)
                ->exists();

            if (!$existing) {
                DB::table('bracelet_guardian')->insert([
                    'bracelet_id' => $bracelet->id,
                    'guardian_id' => $bracelet->guardian_id,
                    'role' => 'owner',
                    'can_edit' => true,
                    'can_view_location' => true,
                    'can_view_events' => true,
                    'can_send_commands' => true,
                    'shared_at' => $bracelet->paired_at ?? $bracelet->created_at,
                    'accepted_at' => $bracelet->paired_at ?? $bracelet->created_at,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                \Log::info('Fixed missing bracelet_guardian entry', [
                    'bracelet_id' => $bracelet->id,
                    'guardian_id' => $bracelet->guardian_id,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration only adds missing entries, so reverse is not needed
        // The entries added by this migration are indistinguishable from legitimate ones
    }
};
