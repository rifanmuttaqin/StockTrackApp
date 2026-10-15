<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\AvatarUpdateRequest;
use App\Http\Requests\ProfileUpdateRequest;
use App\Services\Contracts\ProfileServiceInterface;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        protected ProfileServiceInterface $profileService
    ) {}

    /**
     * Display user's profile.
     */
    public function show(Request $request): Response
    {
        $user = $request->user()->loadMissing('roles');

        return Inertia::render('Profile/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'avatar_url' => $user->avatar_url,
                'roles' => $user->roles->pluck('name')->toArray(),
                'last_login_at' => $user->last_login_at?->toISOString(),
                'created_at' => $user->created_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Display user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Update user's avatar.
     */
    public function updateAvatar(AvatarUpdateRequest $request): RedirectResponse
    {
        try {
            $this->profileService->updateAvatar($request->user(), $request->file('avatar'));

            return Redirect::back()->with('success', 'Avatar berhasil diperbarui.');
        } catch (\Throwable $e) {
            Log::error('Failed to update avatar', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return Redirect::back()->with('error', 'Gagal mengunggah avatar. Silakan coba lagi.');
        }
    }

    /**
     * Delete user's avatar.
     */
    public function destroyAvatar(Request $request): RedirectResponse
    {
        try {
            $this->profileService->deleteAvatar($request->user());

            return Redirect::back()->with('success', 'Avatar berhasil dihapus.');
        } catch (\Throwable $e) {
            Log::error('Failed to delete avatar', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return Redirect::back()->with('error', 'Gagal menghapus avatar. Silakan coba lagi.');
        }
    }

    /**
     * Delete user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        $this->profileService->deleteAvatar($user);

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
