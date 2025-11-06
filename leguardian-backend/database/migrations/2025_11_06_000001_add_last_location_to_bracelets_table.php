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
        Schema::table('bracelets', function (Blueprint $table) {
            $table->decimal('last_latitude', 10, 8)->nullable()->after('battery_level');
            $table->decimal('last_longitude', 11, 8)->nullable()->after('last_latitude');
            $table->integer('last_accuracy')->nullable()->after('last_longitude');
            $table->timestamp('last_location_update')->nullable()->after('last_accuracy');

            // Index for efficient queries
            $table->index(['last_location_update', 'guardian_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bracelets', function (Blueprint $table) {
            $table->dropIndex(['last_location_update', 'guardian_id']);
            $table->dropColumn(['last_latitude', 'last_longitude', 'last_accuracy', 'last_location_update']);
        });
    }
};
