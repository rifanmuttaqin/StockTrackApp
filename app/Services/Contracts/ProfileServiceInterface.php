<?php

namespace App\Services\Contracts;

use App\Models\User;
use Illuminate\Http\UploadedFile;

interface ProfileServiceInterface
{
    public function updateAvatar(User $user, UploadedFile $file): string;

    public function deleteAvatar(User $user): void;
}
