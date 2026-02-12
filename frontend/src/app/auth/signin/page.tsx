"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn("google", { callbackUrl: "/create" });
        } catch (error) {
            console.error("Sign in error:", error);
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 group">
                        <img src="/images/logo.png" alt="AcaRead" className="w-16 h-16 object-contain" />
                        <span className="text-4xl font-bold tracking-tight">
                            <span className="text-primary-500">Aca</span>
                            <span className="text-white">Read</span>
                        </span>
                    </Link>
                </div>

                {/* Sign In Card */}
                <div className="glass p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-gray-400">Sign in to continue to AcaRead</p>
                    </div>

                    {/* Google Sign In Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        )}
                        <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
                    </button>

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-white/10"></div>
                        <span className="px-4 text-sm text-gray-500">or</span>
                        <div className="flex-1 border-t border-white/10"></div>
                    </div>

                    {/* Guest Access */}
                    <Link
                        href="/create"
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-all duration-300 border border-white/10"
                    >
                        <span>Continue as Guest</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    By signing in, you agree to our{" "}
                    <Link href="/terms" className="text-primary-400 hover:underline">Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link>
                </p>
            </div>
        </main>
    );
}
