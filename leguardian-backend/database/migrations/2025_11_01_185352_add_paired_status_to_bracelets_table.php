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
            // Change guardian_id to be nullable (new bracelets without owner)
            $table->unsignedBigInteger('guardian_id')->nullable()->change();

            // Add paired_at timestamp to track when bracelet was paired
            $table->timestamp('paired_at')->nullable();

            // Add is_paired boolean for quick filtering
            $table->boolean('is_paired')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bracelets', function (Blueprint $table) {
            $table->unsignedBigInteger('guardian_id')->nullable(false)->change();
            $table->dropColumn(['paired_at', 'is_paired']);
        });
    }
};
