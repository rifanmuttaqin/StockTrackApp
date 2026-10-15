<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_show_does_not_expose_sessions_or_activities(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('user.name', $user->name)
            ->missing('sessions')
            ->missing('activities')
        );
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile/edit');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile/edit');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_avatar_can_be_uploaded_and_used_as_profile_picture(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('avatar.jpg', 400, 400)->size(500);

        $response = $this
            ->actingAs($user)
            ->post('/profile/avatar', ['avatar' => $file]);

        $response->assertSessionHasNoErrors();

        $user->refresh();

        $this->assertNotNull($user->avatar);
        Storage::disk('public')->assertExists($user->avatar);
        $this->assertNotNull($user->avatar_url);
        $this->assertStringStartsWith('/storage/', $user->avatar_url);
    }

    public function test_avatar_upload_replaces_old_file(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $first = UploadedFile::fake()->image('first.jpg', 400, 400)->size(500);
        $this->actingAs($user)->post('/profile/avatar', ['avatar' => $first]);
        $oldPath = $user->refresh()->avatar;
        Storage::disk('public')->assertExists($oldPath);

        $second = UploadedFile::fake()->image('second.png', 400, 400)->size(500);
        $this->actingAs($user)->post('/profile/avatar', ['avatar' => $second]);

        $newPath = $user->refresh()->avatar;
        $this->assertNotSame($oldPath, $newPath);
        Storage::disk('public')->assertExists($newPath);
        Storage::disk('public')->assertMissing($oldPath);
    }

    public function test_avatar_validation_rejects_invalid_files(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/profile/avatar', ['avatar' => null])
            ->assertSessionHasErrors('avatar');

        $this->actingAs($user)
            ->post('/profile/avatar', ['avatar' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')])
            ->assertSessionHasErrors('avatar');
    }

    public function test_avatar_can_be_deleted(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $file = UploadedFile::fake()->image('avatar.jpg', 400, 400)->size(500);
        $this->actingAs($user)->post('/profile/avatar', ['avatar' => $file]);
        $path = $user->refresh()->avatar;
        Storage::disk('public')->assertExists($path);

        $response = $this
            ->actingAs($user)
            ->delete('/profile/avatar');

        $response->assertSessionHasNoErrors();

        $this->assertNull($user->refresh()->avatar);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
