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
        // PostgreSQL: Update enum type to include led_blink
        if (config('database.default') === 'pgsql') {
            DB::statement("ALTER TYPE command_type_enum ADD VALUE 'led_blink'");
        }

        // SQLite or other databases: Just add the value via raw SQL if needed
        // SQLite doesn't have enums, so we don't need to do anything special
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // PostgreSQL: Remove led_blink from enum
        if (config('database.default') === 'pgsql') {
            // Note: PostgreSQL doesn't allow removing values from enums directly
            // You would need to rename the type and create a new one
            // For now, we'll just leave it as is
        }
    }
};
