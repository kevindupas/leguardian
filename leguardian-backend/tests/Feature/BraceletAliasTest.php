<?php

namespace Tests\Feature;

use App\Models\Bracelet;
use App\Models\Guardian;
use Tests\TestCase;

class BraceletAliasTest extends TestCase
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

    public function test_user_can_register_bracelet_without_alias()
    {
        // Create an unpaired bracelet
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-NO-ALIAS-' . time(),
            'name' => 'BR-TEST-NO-ALIAS',
            'alias' => null,
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        $response = $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => $bracelet->unique_code,
        ]);

        $response->assertStatus(200);
        $this->assertEquals('BR-TEST-NO-ALIAS', $response['bracelet']['name']);
        $this->assertNull($response['bracelet']['alias']);
        $this->assertTrue($response['bracelet']['is_paired']);

        // Verify in DB
        $bracelet->refresh();
        $this->assertNull($bracelet->alias);
    }

    public function test_user_can_register_bracelet_with_alias()
    {
        // Create an unpaired bracelet
        $bracelet = Bracelet::create([
            'unique_code' => 'TEST-WITH-ALIAS-' . time(),
            'name' => 'BR-TEST-WITH-ALIAS',
            'alias' => null,
            'status' => 'inactive',
            'battery_level' => 100,
            'is_paired' => false,
        ]);

        $response = $this->withToken($this->token)->postJson('/api/mobile/bracelets/register', [
            'unique_code' => $bracelet->unique_code,
            'alias' => 'Mon Bracelet Enfant',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('BR-TEST-WITH-ALIAS', $response['bracelet']['name']);
        $this->assertEquals('Mon Bracelet Enfant', $response['bracelet']['alias']);
        $this->assertTrue($response['bracelet']['is_paired']);

        // Verify in DB
        $bracelet->refresh();
        $this->assertEquals('Mon Bracelet Enfant', $bracelet->alias);
    }

    public function test_user_can_update_bracelet_alias()
    {
        // Create a paired bracelet with alias
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-UPDATE-' . time(),
            'name' => 'BR-UPDATE',
            'alias' => 'Original Alias',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 'Updated Alias',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Updated Alias', $response['bracelet']['alias']);

        // Verify in DB
        $bracelet->refresh();
        $this->assertEquals('Updated Alias', $bracelet->alias);
    }

    public function test_user_can_fetch_bracelets_with_aliases()
    {
        // Create multiple bracelets with different aliases
        Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'FETCH-1-' . time(),
            'name' => 'BR-FETCH-1',
            'alias' => 'First Bracelet',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'FETCH-2-' . time(),
            'name' => 'BR-FETCH-2',
            'alias' => 'Second Bracelet',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->getJson('/api/mobile/bracelets');

        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(2, count($response['bracelets']));

        // Verify aliases are returned
        $bracelets = $response['bracelets'];
        $aliasesFound = [];

        foreach ($bracelets as $bracelet) {
            if (isset($bracelet['alias'])) {
                $aliasesFound[] = $bracelet['alias'];
            }
        }

        $this->assertContains('First Bracelet', $aliasesFound);
        $this->assertContains('Second Bracelet', $aliasesFound);
    }

    public function test_unauthorized_user_cannot_update_another_users_bracelet()
    {
        $anotherGuardian = Guardian::factory()->create();
        $anotherToken = $anotherGuardian->createToken('test-token')->plainTextToken;

        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-UNAUTH-' . time(),
            'name' => 'BR-UNAUTH',
            'alias' => 'Original',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($anotherToken)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 'Hacked Alias',
        ]);

        $response->assertStatus(403);

        // Verify alias was not changed
        $bracelet->refresh();
        $this->assertEquals('Original', $bracelet->alias);
    }

    public function test_alias_field_has_maximum_length_of_255_characters()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-MAX-' . time(),
            'name' => 'BR-MAX',
            'alias' => 'Short',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        // Try with 256 characters (should fail)
        $longAlias = str_repeat('a', 256);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => $longAlias,
        ]);

        $response->assertStatus(422);

        // Try with 255 characters (should succeed)
        $maxAlias = str_repeat('b', 255);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => $maxAlias,
        ]);

        $response->assertStatus(200);
        $this->assertEquals($maxAlias, $response['bracelet']['alias']);
    }

    public function test_name_field_is_preserved_when_updating_alias()
    {
        $bracelet = Bracelet::create([
            'guardian_id' => $this->guardian->id,
            'unique_code' => 'TEST-PRESERVE-' . time(),
            'name' => 'BR-PRESERVE',
            'alias' => 'Original Alias',
            'status' => 'active',
            'battery_level' => 100,
            'is_paired' => true,
        ]);

        $response = $this->withToken($this->token)->putJson('/api/mobile/bracelets/' . $bracelet->id, [
            'alias' => 'New Alias',
        ]);

        $response->assertStatus(200);

        // Verify name is still the same
        $this->assertEquals('BR-PRESERVE', $response['bracelet']['name']);
        // Verify alias is updated
        $this->assertEquals('New Alias', $response['bracelet']['alias']);

        // Verify in DB
        $bracelet->refresh();
        $this->assertEquals('BR-PRESERVE', $bracelet->name);
        $this->assertEquals('New Alias', $bracelet->alias);
    }
}
