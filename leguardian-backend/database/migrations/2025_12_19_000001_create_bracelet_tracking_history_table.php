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
        Schema::create('bracelet_tracking_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bracelet_id')->constrained('bracelets')->onDelete('cascade');

            // GPS location data
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->decimal('altitude', 8, 2)->nullable();
            $table->integer('accuracy')->nullable();
            $table->integer('satellites')->nullable()->comment('Number of satellites for GPS fix');

            // Speed (optional, can be calculated from consecutive positions)
            $table->decimal('speed', 6, 2)->nullable()->comment('Speed in km/h or m/s');

            // Timestamp from device
            $table->timestamp('device_timestamp')->nullable();

            // Server timestamps
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();

            // Indexes for efficient querying
            $table->index('bracelet_id');
            $table->index('created_at');
            $table->index(['bracelet_id', 'created_at']);

            // Composite index for time range queries
            $table->index(['bracelet_id', 'device_timestamp']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bracelet_tracking_history');
    }
};
