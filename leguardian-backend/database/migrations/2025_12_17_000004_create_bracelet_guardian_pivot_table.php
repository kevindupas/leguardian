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
        // Create pivot table for many-to-many relationship
        Schema::create('bracelet_guardian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bracelet_id')->constrained('bracelets')->onDelete('cascade');
            $table->foreignId('guardian_id')->constrained('guardians')->onDelete('cascade');

            // Role: 'owner' or 'shared'
            $table->enum('role', ['owner', 'shared'])->default('shared');

            // Permissions
            $table->boolean('can_edit')->default(false);                // Can rename, edit settings
            $table->boolean('can_view_location')->default(true);        // Can see real-time location
            $table->boolean('can_view_events')->default(true);          // Can see event history
            $table->boolean('can_send_commands')->default(false);       // Can vibrate, LED, etc

            // Invitation system
            $table->timestamp('shared_at')->useCurrent();
            $table->timestamp('accepted_at')->nullable();

            $table->timestamps();

            // Ensure unique relationship
            $table->unique(['bracelet_id', 'guardian_id']);

            $table->index('role');
            $table->index('accepted_at');
        });

        // Migrate existing bracelets from guardian_id to pivot table
        // This preserves existing relationships with 'owner' role
        $bracelets = DB::table('bracelets')
            ->whereNotNull('guardian_id')
            ->get();

        foreach ($bracelets as $bracelet) {
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
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bracelet_guardian');
    }
};
