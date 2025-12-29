<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bracelet_telemetry', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bracelet_id')->constrained()->onDelete('cascade');
            $table->timestamp('timestamp')->nullable();

            // GPS Data
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->decimal('altitude', 8, 2)->nullable();
            $table->integer('satellites')->nullable();
            $table->string('gps_date')->nullable();
            $table->string('gps_time')->nullable();

            // Network Data
            $table->integer('signal_csq')->nullable();
            $table->string('rsrp')->nullable();
            $table->string('rsrq')->nullable();
            $table->string('network_type')->nullable();

            // IMU Data
            $table->decimal('accel_x', 8, 4)->nullable();
            $table->decimal('accel_y', 8, 4)->nullable();
            $table->decimal('accel_z', 8, 4)->nullable();
            $table->decimal('gyro_x', 8, 4)->nullable();
            $table->decimal('gyro_y', 8, 4)->nullable();
            $table->decimal('gyro_z', 8, 4)->nullable();
            $table->decimal('imu_temperature', 5, 2)->nullable();

            // Status
            $table->boolean('emergency_mode')->default(false);

            $table->timestamps();

            // Indexes for better query performance
            $table->index('bracelet_id');
            $table->index('timestamp');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bracelet_telemetry');
    }
};
