<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UserRegistrationRequest;
use App\Services\Contracts\UserServiceInterface;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    protected UserServiceInterface $userService;

    public function __construct(UserServiceInterface $userService)
    {
        $this->userService = $userService;
        $this->middleware('guest')->except(['logout', 'showResetForm', 'reset']);
    }

    /**
     * Display login page
     */
    public function showLoginForm(): Response
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Handle login request
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember' => 'boolean',
        ]);

        // Debug logging
        Log::info('Login attempt for email: ' . $credentials['email']);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            // Get authenticated user
            $user = Auth::user();

            // Debug logging
            Log::info('User authenticated: ' . $user->email);

            // Update last login
            // $this->userService->updateLastLogin($user->id);

            return redirect()->intended(route('dashboard'));
        }

        // Debug logging
        Log::info('Login failed for email: ' . $credentials['email']);

        throw ValidationException::withMessages([
            'email' => ['Email atau password salah.'],
        ]);
    }

    /**
     * Display registration page
     */
    public function showRegistrationForm(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle registration request
     */
    public function register(UserRegistrationRequest $request)
    {
        $user = $this->userService->registerUser($request);

        // Send email verification
        if ($user && !$user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return redirect()->route('verification.notice')->with('status', 'Registrasi berhasil! Silakan verifikasi email Anda.');
    }

    /**
     * Handle logout request
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    /**
     * Display forgot password page
     */
    public function showForgotPasswordForm(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    /**
     * Handle forgot password request
     */
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $status = Password::sendResetLink($request->only('email'));

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }

    /**
     * Display reset password page
     */
    public function showResetForm(Request $request, string $token = null): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $request->email,
        ]);
    }

    /**
     * Handle reset password request
     */
    public function reset(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset($request->all(), function ($user, $password) {
            $user->password = Hash::make($password);
            $user->setRememberToken(Str::random(60));
            $user->save();
        });

        if ($status == Password::PASSWORD_RESET) {
            return redirect()->route('password.confirmation')->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }

    /**
     * Display password reset confirmation page
     */
    public function showPasswordResetConfirmation(): Response
    {
        return Inertia::render('Auth/PasswordResetConfirmation');
    }

    /**
     * Display verification notice
     */
    public function showVerificationNotice(): Response
    {
        return Inertia::render('Auth/VerifyEmail');
    }

    /**
     * Handle email verification request
     */
    public function verify(Request $request, string $id, string $hash)
    {
        $user = $this->userService->findUserById($id);

        if (!$user || !hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return redirect()->route('login')->with('error', 'Link verifikasi tidak valid.');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('login')->with('status', 'Email sudah diverifikasi.');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return redirect()->route('login')->with('status', 'Email berhasil diverifikasi.');
    }

    /**
     * Resend verification email
     */
    public function resendVerification(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = $this->userService->findUserByEmail($request->email);

        if ($user->hasVerifiedEmail()) {
            return back()->with('status', 'Email sudah diverifikasi.');
        }

        $user->sendEmailVerificationNotification();

        return back()->with('status', 'Link verifikasi telah dikirim ulang.');
    }
}
