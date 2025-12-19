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
        Schema::table('bracelet_tracking_history', function (Blueprint $table) {
            // Timestamp from device (device_timestamp already exists)
            $table->string('timestamp')->nullable()->after('device_timestamp')->comment('Device timestamp as string from heartbeat');

            // Emergency mode
            $table->boolean('emergency_mode')->default(false)->after('timestamp')->comment('Whether bracelet was in emergency mode');

            // Complete network data
            $table->json('network_data')->nullable()->after('emergency_mode')->comment('Network info: signal, rsrp, rsrq, type');

            // Complete IMU data
            $table->json('imu_data')->nullable()->after('network_data')->comment('IMU data: accel, gyro, temperature');

            // Battery level
            $table->integer('battery_level')->nullable()->after('imu_data')->comment('Battery percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bracelet_tracking_history', function (Blueprint $table) {
            $table->dropColumn(['timestamp', 'emergency_mode', 'network_data', 'imu_data', 'battery_level']);
        });
    }
};
