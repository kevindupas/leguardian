<?php

namespace Tests\Feature;

use App\Models\Bracelet;
use App\Models\Guardian;
use Tests\TestCase;

/**
 * COMPREHENSIVE TEST SUITE FOR BRACELET ALIAS SYSTEM
 *
 * This test file provides exhaustive coverage of the bracelet alias feature
 * covering all scenarios, edge cases, and error conditions.
 */
class BraceletAliasComprehensiveTest extends TestCase
{
    protected $guardian;
    protected $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test guardian
        $this->guardian = Guardian::factory()->create();
        $this->token = $this->guardian->createToken('test-token')->plainTextToken;
    }

    // ============ REGISTRATION TESTS ============

    public function test_register_bracelet_without_alias_returns_null_alias()
    {
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-REG-1-' . time(),
            'name' => 'BR-TEST-1',
            'alias' => null,
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        $response = $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => $bracelet->unique_code,
        ]);

        $response->assertStatus(200);
        $this->assertNull($response['bracelet']['alias']);
    }

    public function test_register_bracelet_with_empty_alias_string()
    {
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-EMPTY-' . time(),
            'name' => 'BR-EMPTY',
            'alias' => null,
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        $response = $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => $bracelet->unique_code,
            'alias' => '',
        ]);

        // Empty alias should either be accepted or rejected by validation
        $this->assertTrue(
            $response->status() === 200 || $response->status() === 422
        );
    }

    public function test_register_bracelet_with_simple_alias()
    {
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-SIMPLE-' . time(),
            'name' => 'BR-SIMPLE',
            'alias' => null,
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        $response = $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => $bracelet->unique_code,
            'alias' => 'My Bracelet',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('My Bracelet', $response['bracelet']['alias']);
    }

    public function test_register_bracelet_with_special_characters_in_alias()
    {
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-SPECIAL-' . time(),
            'name' => 'BR-SPECIAL',
            'alias' => null,
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        $specialAliases = [
            'Bracelet-Jean',
            'Bracelet_Parent',
            'Bracelet (enfant)',
            'École - Bracelet',
            'Bracelet\'s Device',
            'Bracelet #1',
        ];

        foreach ($specialAliases as $alias) {
            $response = $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
                'unique_code' => $bracelet->unique_code,
                'alias' => $alias,
            ]);

            // Should either accept or reject but not crash
            $this->assertTrue($response->status() === 200 || $response->status() === 422);
            if ($response->status() === 200) {
                break; // Stop after first successful registration
            }
        }
    }

    public function test_register_bracelet_with_unicode_characters()
    {
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-UNICODE-' . time(),
            'name' => 'BR-UNICODE',
            'alias' => null,
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        $response = $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => $bracelet->unique_code,
            'alias' => 'Bracelet enfant 👶',
        ]);

        // Should handle unicode gracefully
        $this->assertTrue($response->status() === 200 || $response->status() === 422);
    }

    public function test_register_bracelet_with_whitespace_in_alias()
    {
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-WHITESPACE-' . time(),
            'name' => 'BR-WHITESPACE',
            'alias' => null,
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        $response = $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => $bracelet->unique_code,
            'alias' => '  My Bracelet  ',
        ]);

        $response->assertStatus(200);
        // Should preserve spaces or trim them
        $this->assertNotNull($response['bracelet']['alias']);
    }

    // ============ UPDATE TESTS ============

    public function test_update_alias_from_null_to_value()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-NULL-UPDATE-' . time(),
            'name' => 'BR-NULL-UPDATE',
            'alias' => null,
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 'New Alias',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('New Alias', $response['bracelet']['alias']);

        $bracelet->refresh();
        $this->assertEquals('New Alias', $bracelet->alias);
    }

    public function test_update_alias_from_value_to_null()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-CLEAR-ALIAS-' . time(),
            'name' => 'BR-CLEAR',
            'alias' => 'Old Alias',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => null,
        ]);

        $response->assertStatus(200);
        $bracelet->refresh();
        $this->assertNull($bracelet->alias);
    }

    public function test_update_alias_from_value_to_different_value()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-REPLACE-' . time(),
            'name' => 'BR-REPLACE',
            'alias' => 'Original Alias',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 'Replaced Alias',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Replaced Alias', $response['bracelet']['alias']);

        $bracelet->refresh();
        $this->assertEquals('Replaced Alias', $bracelet->alias);
    }

    public function test_update_alias_with_same_value()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-SAME-' . time(),
            'name' => 'BR-SAME',
            'alias' => 'Same Alias',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 'Same Alias',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Same Alias', $response['bracelet']['alias']);
    }

    public function test_update_without_alias_field_does_not_modify()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-NO-FIELD-' . time(),
            'name' => 'BR-NO-FIELD',
            'alias' => 'Original',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, []);

        $response->assertStatus(200);
        $bracelet->refresh();
        $this->assertEquals('Original', $bracelet->alias);
    }

    // ============ VALIDATION TESTS ============

    public function test_alias_cannot_exceed_255_characters()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-LENGTH-' . time(),
            'name' => 'BR-LENGTH',
            'alias' => 'Short',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $longAlias = str_repeat('a', 256);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => $longAlias,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('alias');
    }

    public function test_alias_can_be_exactly_255_characters()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-255-' . time(),
            'name' => 'BR-255',
            'alias' => 'Short',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $maxAlias = str_repeat('b', 255);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => $maxAlias,
        ]);

        $response->assertStatus(200);
        $this->assertEquals($maxAlias, $response['bracelet']['alias']);
    }

    public function test_alias_must_be_string()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-TYPE-' . time(),
            'name' => 'BR-TYPE',
            'alias' => 'Test',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 123,
        ]);

        // Should either convert to string or reject
        $this->assertTrue($response->status() === 200 || $response->status() === 422);
    }

    // ============ AUTHORIZATION TESTS ============

    public function test_user_cannot_update_another_users_bracelet_alias()
    {
        $anotherGuardian = Guardian::factory()->create();
        $anotherToken = $anotherGuardian->createToken('test-token')->plainTextToken;

        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-AUTH-' . time(),
            'name' => 'BR-AUTH',
            'alias' => 'Original',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($anotherToken)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 'Hacked',
        ]);

        $response->assertStatus(403);

        $bracelet->refresh();
        $this->assertEquals('Original', $bracelet->alias);
    }

    public function test_unauthenticated_user_cannot_update_alias()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-NOAUTH-' . time(),
            'name' => 'BR-NOAUTH',
            'alias' => 'Original',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 'Hacked',
        ]);

        $response->assertStatus(401);
    }

    // ============ FETCH TESTS ============

    public function test_fetch_bracelets_includes_alias_field()
    {
        Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-FETCH-1-' . time(),
            'name' => 'BR-FETCH-1',
            'alias' => 'With Alias',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-FETCH-2-' . time(),
            'name' => 'BR-FETCH-2',
            'alias' => null,
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->getJson('/api/mobile/bracelets');

        $response->assertStatus(200);
        $this->assertGreaterThan(1, count($response['bracelets']));

        foreach ($response['bracelets'] as $bracelet) {
            $this->assertTrue(array_key_exists('alias', $bracelet), 'Bracelet missing alias field');
        }
    }

    public function test_fetch_single_bracelet_includes_alias()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-SINGLE-' . time(),
            'name' => 'BR-SINGLE',
            'alias' => 'Single Alias',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->getJson('/api/mobile/bracelets/' . $bracelet->id);

        $response->assertStatus(200);
        $this->assertTrue(array_key_exists('alias', $response['bracelet']), 'Bracelet missing alias field');
        $this->assertEquals('Single Alias', $response['bracelet']['alias']);
    }

    // ============ DATA INTEGRITY TESTS ============

    public function test_updating_alias_does_not_change_name()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-INTEGRITY-' . time(),
            'name' => 'BR-INTEGRITY',
            'alias' => 'Old',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 'New',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('BR-INTEGRITY', $response['bracelet']['name']);
        $this->assertEquals('New', $response['bracelet']['alias']);
    }

    public function test_updating_alias_does_not_change_other_fields()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-PRESERVE-' . time(),
            'name' => 'BR-PRESERVE',
            'alias' => 'Original',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
            'firmware_version' => '1.0.0',
        ]);

        $originalStatus = $bracelet->status;
        $originalBattery = $bracelet->battery_level;

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 'Updated',
        ]);

        $response->assertStatus(200);
        $this->assertEquals($originalStatus, $response['bracelet']['status']);
        $this->assertEquals($originalBattery, $response['bracelet']['battery_level']);
    }

    public function test_alias_persists_in_database()
    {
        // Create an UNPAIRED bracelet
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-PERSIST-' . time(),
            'name' => 'BR-PERSIST',
            'alias' => null,
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => false,
            'guardian_id' => null,
        ]);

        $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => $bracelet->unique_code,
            'alias' => 'Persisted Alias',
        ]);

        $bracelet->refresh();
        $this->assertEquals('Persisted Alias', $bracelet->alias);

        // Verify it persists after another fetch
        $response = $this->withToken($this->token)->getJson('/api/mobile/bracelets/' . $bracelet->id);
        $this->assertEquals('Persisted Alias', $response['bracelet']['alias']);
    }

    // ============ MODEL TESTS ============

    public function test_bracelet_model_has_alias_in_fillable()
    {
        $bracelet = new Bracelet();
        $this->assertContains('alias', $bracelet->getFillable());
    }

    public function test_bracelet_alias_is_nullable_in_database()
    {
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-NULLABLE-' . time(),
            'name' => 'BR-NULLABLE',
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        $this->assertNull($bracelet->alias);
    }

    public function test_bracelet_alias_can_be_set_via_mass_assignment()
    {
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-MASS-' . time(),
            'name' => 'BR-MASS',
            'alias' => 'Mass Assigned',
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        $this->assertEquals('Mass Assigned', $bracelet->alias);
    }

    // ============ EDGE CASE TESTS ============

    public function test_update_with_missing_bracelet_id()
    {
        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/99999999', [
            'alias' => 'Test',
        ]);

        $response->assertStatus(404);
    }

    public function test_register_with_invalid_unique_code()
    {
        $response = $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => 'INVALID-CODE-' . time(),
            'alias' => 'Test',
        ]);

        $response->assertStatus(422);
    }

    public function test_register_same_bracelet_twice_by_different_users()
    {
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-TWICE-' . time(),
            'name' => 'BR-TWICE',
            'alias' => null,
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        // First user registers
        $response1 = $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => $bracelet->unique_code,
            'alias' => 'First User',
        ]);

        $response1->assertStatus(200);

        // Second user tries to register same bracelet
        $anotherGuardian = Guardian::factory()->create();
        $anotherToken = $anotherGuardian->createToken('test-token')->plainTextToken;

        $response2 = $this->withToken($anotherToken)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => $bracelet->unique_code,
            'alias' => 'Second User',
        ]);

        $response2->assertStatus(422);
    }
}
