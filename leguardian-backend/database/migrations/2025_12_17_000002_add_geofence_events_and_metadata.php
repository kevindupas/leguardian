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
        Schema::table('bracelet_events', function (Blueprint $table) {
            // Add metadata JSON field for storing event details
            $table->json('metadata')->nullable()->after('resolved_at');
        });

        // Update event_type enum to include zone events
        // Note: For MySQL, we need to modify the enum type
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE bracelet_events MODIFY COLUMN event_type ENUM('heartbeat', 'arrived', 'lost', 'danger', 'zone_entry', 'zone_exit')");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bracelet_events', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });

        // Revert enum
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE bracelet_events MODIFY COLUMN event_type ENUM('heartbeat', 'arrived', 'lost', 'danger')");
        }
    }
};
