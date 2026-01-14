import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { MobileCard, MobileCardHeader, MobileCardTitle, MobileCardContent, MobileCardFooter } from '@/Components/UI/MobileCard';
import { MobileInput } from '@/Components/UI/MobileInput';
import { MobileButton } from '@/Components/UI/MobileButton';
import { MobileLoadingSpinner } from '@/Components/UI/MobileLoadingSpinner';
import { MobileAlert } from '@/Components/UI/MobileAlert';
import { cn } from '@/lib/utils';
import { useAuth } from '@/Context/AuthContext';

export default function MobileLogin({ status, canResetPassword }) {
    const { login } = useAuth();
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
            onSuccess: (page) => {
                console.log('[MobileLogin] Login successful, updating AuthContext immediately');
                // Call the login function to immediately update auth state
                if (page.props.auth) {
                    login(page.props.auth);
                }
            },
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white px-4 py-8">
            <Head title="Masuk" />

            {/* Logo and App Name */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-poppins font-bold text-gray-900">StockTrackApp</h1>
                <p className="text-sm font-poppins text-gray-600 mt-1">Aplikasi Manajemen Stok</p>
            </div>

            {/* Login Form Card */}
            <MobileCard className="w-full max-w-sm mx-auto shadow-md">
                <MobileCardHeader className="text-center pb-2">
                    <MobileCardTitle className="text-xl">Selamat Datang</MobileCardTitle>
                    <p className="text-sm font-poppins text-gray-600 mt-1">Masuk ke akun Anda</p>
                </MobileCardHeader>

                <MobileCardContent className="space-y-4">
                    {status && (
                        <MobileAlert variant="success">
                            {status}
                        </MobileAlert>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-poppins font-medium text-gray-700">
                                Email
                            </label>
                            <MobileInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                placeholder="nama@email.com"
                                autoComplete="username"
                                autoFocus={true}
                                onChange={(e) => setData('email', e.target.value)}
                                className={cn(
                                    errors.email && "border-red-500 focus-visible:ring-red-500"
                                )}
                            />
                            {errors.email && (
                                <p className="text-xs font-poppins text-red-600 mt-1">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-poppins font-medium text-gray-700">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <MobileInput
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    placeholder="Masukkan kata sandi"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    className={cn(
                                        "pr-12",
                                        errors.password && "border-red-500 focus-visible:ring-red-500"
                                    )}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-4"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs font-poppins text-red-600 mt-1">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="remember" className="ml-3 block text-sm font-poppins text-gray-700">
                                Ingat saya
                            </label>
                        </div>

                        <MobileButton
                            type="submit"
                            className="w-full mt-2"
                            disabled={processing}
                        >
                            {processing ? (
                                <div className="flex items-center justify-center">
                                    <MobileLoadingSpinner size="sm" className="mr-2" />
                                    Memproses...
                                </div>
                            ) : (
                                'Masuk'
                            )}
                        </MobileButton>
                    </form>
                </MobileCardContent>

                <MobileCardFooter className="flex flex-col space-y-3 pt-2">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-poppins text-blue-600 hover:text-blue-700 text-center"
                        >
                            Lupa kata sandi?
                        </Link>
                    )}

                    <div className="text-center text-sm font-poppins text-gray-600">
                        Belum punya akun?{' '}
                        <Link
                            href={route('register')}
                            className="font-medium text-blue-600 hover:text-blue-700"
                        >
                            Daftar
                        </Link>
                    </div>
                </MobileCardFooter>
            </MobileCard>

            {/* Back to Home */}
            <div className="mt-8 text-center">
                <Link
                    href="/"
                    className="text-sm font-poppins text-gray-600 hover:text-blue-600"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
