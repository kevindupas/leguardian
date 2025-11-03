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
        Schema::create('bracelet_commands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bracelet_id')->constrained('bracelets')->cascadeOnDelete();
            $table->enum('command_type', ['vibrate_short', 'vibrate_medium', 'vibrate_sos']);
            $table->enum('status', ['pending', 'executed', 'failed'])->default('pending');
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();

            $table->index('bracelet_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bracelet_commands');
    }
};
