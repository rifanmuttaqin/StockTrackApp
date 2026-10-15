<?php

namespace App\Services\Profile;

use App\Models\User;
use App\Services\Contracts\ProfileServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProfileService implements ProfileServiceInterface
{
    public function updateAvatar(User $user, UploadedFile $file): string
    {
        return DB::transaction(function () use ($user, $file) {
            $oldAvatar = $user->avatar;

            $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');

            $user->forceFill(['avatar' => $path])->save();

            if ($oldAvatar && Storage::disk('public')->exists($oldAvatar)) {
                Storage::disk('public')->delete($oldAvatar);
            }

            return $path;
        });
    }

    public function deleteAvatar(User $user): void
    {
        DB::transaction(function () use ($user) {
            $oldAvatar = $user->avatar;

            $user->forceFill(['avatar' => null])->save();

            if ($oldAvatar && Storage::disk('public')->exists($oldAvatar)) {
                Storage::disk('public')->delete($oldAvatar);
            }
        });
    }
}
