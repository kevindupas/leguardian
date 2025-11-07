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
        // PostgreSQL: add new value to enum type
        DB::statement("ALTER TYPE bracelet_events_event_type_enum ADD VALUE 'heartbeat' BEFORE 'arrived'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Removing enum values in PostgreSQL is complex - skip
    }
};
