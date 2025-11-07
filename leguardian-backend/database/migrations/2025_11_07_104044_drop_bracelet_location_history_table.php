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
        Schema::dropIfExists('bracelet_location_history');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate if needed
        Schema::create('bracelet_location_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bracelet_id')->constrained('bracelets')->cascadeOnDelete();
            $table->json('location_data');
            $table->string('source_type')->default('heartbeat');
            $table->timestamp('recorded_at')->nullable();
            $table->timestamps();
            $table->index(['bracelet_id', 'recorded_at']);
            $table->index('recorded_at');
        });
    }
};
