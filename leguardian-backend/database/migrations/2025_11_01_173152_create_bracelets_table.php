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
        Schema::create('bracelets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('unique_code', 50)->unique()->index();
            $table->string('name'); 
            $table->string('alias')->nullable(); 
            $table->enum('status', ['active', 'inactive', 'lost', 'emergency'])->default('inactive');
            $table->integer('battery_level')->default(100);
            $table->timestamp('last_ping_at')->nullable();
            $table->string('firmware_version')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bracelets');
    }
};
