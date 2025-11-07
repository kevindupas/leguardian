<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bracelet_location_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bracelet_id')->constrained('bracelets')->cascadeOnDelete();

            // Store all location data as JSON for flexibility
            // Structure: { "latitude": 48.8566, "longitude": 2.3522, "accuracy": 15, "battery_level": 85 }
            $table->json('location_data');

            // Store the source of this location update
            // Values: "heartbeat", "arrived", "lost", "danger", "danger_update"
            $table->string('source_type')->default('heartbeat');

            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();

            // Indices for efficient queries
            $table->index(['bracelet_id', 'recorded_at']);
            $table->index('recorded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bracelet_location_history');
    }
};
