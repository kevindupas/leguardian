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
        // Convert command_type from enum to VARCHAR for PostgreSQL
        DB::statement("ALTER TABLE bracelet_commands ALTER COLUMN command_type TYPE VARCHAR(255)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to enum if needed
        Schema::table('bracelet_commands', function (Blueprint $table) {
            if (config('database.default') === 'pgsql') {
                // Note: This would require recreating the type, so we'll skip it
                // DB::statement("ALTER TABLE bracelet_commands ALTER COLUMN command_type TYPE command_type USING command_type::command_type");
            }
        });
    }
};
