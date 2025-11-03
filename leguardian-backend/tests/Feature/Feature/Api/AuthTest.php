<?php

namespace Tests\Feature\Api;

use App\Models\Guardian;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test guardian registration
     */
    public function test_guardian_can_register(): void
    {
        $response = $this->postJson('/api/mobile/auth/register', [
            'name' => 'New Guardian',
            'email' => 'newguardian@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure(['user', 'token']);
        $this->assertDatabaseHas('guardians', [
            'email' => 'newguardian@example.com',
        ]);
    }

    /**
     * Test guardian login
     */
    public function test_guardian_can_login(): void
    {
        Guardian::create([
            'name' => 'Test Guardian',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/mobile/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['user', 'token']);
    }

    /**
     * Test login fails with invalid credentials
     */
    public function test_login_fails_with_invalid_credentials(): void
    {
        Guardian::create([
            'name' => 'Test Guardian',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/mobile/auth/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    /**
     * Test get authenticated guardian
     */
    public function test_can_get_authenticated_guardian(): void
    {
        $guardian = Guardian::create([
            'name' => 'Test Guardian',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $token = $guardian->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/mobile/user');

        $response->assertStatus(200);
        $response->assertJsonStructure(['id', 'name', 'email']);
    }

    /**
     * Test guardian logout
     */
    public function test_guardian_can_logout(): void
    {
        $guardian = Guardian::create([
            'name' => 'Test Guardian',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $token = $guardian->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/mobile/auth/logout');

        $response->assertStatus(200);
    }

    /**
     * Test update FCM token
     */
    public function test_can_update_fcm_token(): void
    {
        $guardian = Guardian::create([
            'name' => 'Test Guardian',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $token = $guardian->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/mobile/user/notification-token', [
            'fcm_token' => 'new-fcm-token-123',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('guardians', [
            'email' => 'test@example.com',
            'fcm_token' => 'new-fcm-token-123',
        ]);
    }
}
