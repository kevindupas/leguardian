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
            $table->boolean('emergency_mode')->default(false)->after('status');
            $table->json('last_imu_data')->nullable()->after('last_accuracy');
            $table->json('last_network_data')->nullable()->after('last_imu_data');
            $table->timestamp('last_imu_update')->nullable()->after('last_network_data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bracelets', function (Blueprint $table) {
            $table->dropColumn(['emergency_mode', 'last_imu_data', 'last_network_data', 'last_imu_update']);
        });
    }
};
