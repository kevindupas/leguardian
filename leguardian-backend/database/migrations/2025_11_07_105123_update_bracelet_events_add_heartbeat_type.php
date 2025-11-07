<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only for PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            // Check if the enum value 'heartbeat' already exists
            $heartbeatExists = DB::selectOne(
                "SELECT 1 FROM pg_enum
                 WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'bracelet_events_event_type_enum')
                 AND enumlabel = 'heartbeat'"
            );

            // Add heartbeat to enum if it doesn't exist
            if (!$heartbeatExists) {
                DB::statement(
                    "ALTER TYPE bracelet_events_event_type_enum ADD VALUE 'heartbeat' BEFORE 'arrived'"
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Removing enum values in PostgreSQL is complex
        // No automatic reversal - the heartbeat value will remain
    }
};
