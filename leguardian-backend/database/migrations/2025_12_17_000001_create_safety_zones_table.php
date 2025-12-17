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
        Schema::create('safety_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bracelet_id')->constrained('bracelets')->onDelete('cascade');
            $table->foreignId('created_by_guardian_id')->constrained('guardians');
            $table->string('name');
            $table->string('icon')->nullable();
            $table->json('coordinates'); // Array of {latitude, longitude} points
            $table->boolean('notify_on_entry')->default(true);
            $table->boolean('notify_on_exit')->default(true);
            $table->timestamps();

            $table->index('bracelet_id');
            $table->index('created_by_guardian_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('safety_zones');
    }
};
