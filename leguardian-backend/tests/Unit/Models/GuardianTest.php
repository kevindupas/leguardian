<?php

namespace Tests\Unit\Models;

use App\Models\Guardian;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuardianTest extends TestCase
{
    use RefreshDatabase;
    /**
     * Test guardian can be created
     */
    public function test_guardian_can_be_created(): void
    {
        $guardian = Guardian::create([
            'name' => 'Test Guardian',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'phone' => '+33612345678',
        ]);

        $this->assertNotNull($guardian->id);
        $this->assertEquals('Test Guardian', $guardian->name);
        $this->assertEquals('test@example.com', $guardian->email);
    }

    /**
     * Test guardian has many bracelets
     */
    public function test_guardian_has_many_bracelets(): void
    {
        $guardian = Guardian::factory()->create();

        $this->assertTrue(count($guardian->bracelets()->get()) === 0);
    }

    /**
     * Test guardian email is unique
     */
    public function test_guardian_email_is_unique(): void
    {
        $guardian1 = Guardian::create([
            'name' => 'Guardian 1',
            'email' => 'unique@example.com',
            'password' => bcrypt('password'),
        ]);

        $this->expectException(\Exception::class);

        Guardian::create([
            'name' => 'Guardian 2',
            'email' => 'unique@example.com',
            'password' => bcrypt('password'),
        ]);
    }

    /**
     * Test guardian can create API tokens
     */
    public function test_guardian_can_create_api_token(): void
    {
        $guardian = Guardian::create([
            'name' => 'Token Guardian',
            'email' => 'token@example.com',
            'password' => bcrypt('password'),
        ]);

        $token = $guardian->createToken('test-token')->plainTextToken;

        $this->assertNotNull($token);
        $this->assertIsString($token);
    }
}
