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
        Schema::create('bracelet_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bracelet_id')->constrained('bracelets')->cascadeOnDelete();
            if (DB::getDriverName() === 'pgsql') {
                DB::statement(<<<SQL
                    CREATE TYPE bracelet_events_event_type_enum AS ENUM ('heartbeat', 'arrived', 'lost', 'danger');
                SQL);
                $table->raw('event_type bracelet_events_event_type_enum NOT NULL DEFAULT \'arrived\'');
            } else {
                // For MySQL/SQLite
                $table->enum('event_type', ['heartbeat', 'arrived', 'lost', 'danger']);
            }
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('accuracy')->nullable();
            $table->integer('battery_level');
            $table->boolean('resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();

            $table->index('bracelet_id');
            $table->index('event_type');
            $table->index('resolved');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bracelet_events');

        // Drop the enum type if it exists (PostgreSQL)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP TYPE IF EXISTS bracelet_events_event_type_enum CASCADE;');
        }
    }
};
