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
        // Check if columns need to be added
        if (!Schema::hasColumn('bracelet_commands', 'led_color')) {
            Schema::table('bracelet_commands', function (Blueprint $table) {
                $table->string('led_color')->nullable()->after('command_type');
                $table->string('led_pattern')->nullable()->after('led_color');
            });
        }

        // Add indices (SQLite)
        if (config('database.default') === 'sqlite') {
            DB::statement('CREATE INDEX IF NOT EXISTS bracelet_commands_bracelet_id_index ON bracelet_commands(bracelet_id)');
            DB::statement('CREATE INDEX IF NOT EXISTS bracelet_commands_status_index ON bracelet_commands(status)');
            DB::statement('CREATE INDEX IF NOT EXISTS bracelet_commands_created_at_index ON bracelet_commands(created_at)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bracelet_commands', function (Blueprint $table) {
            $table->dropColumn(['led_color', 'led_pattern']);
        });
    }
};
