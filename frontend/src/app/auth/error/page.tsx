"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    const errorMessages: Record<string, string> = {
        Configuration: "There is a problem with the server configuration.",
        AccessDenied: "You do not have permission to sign in.",
        Verification: "The verification link has expired or has already been used.",
        OAuthSignin: "Error in constructing an authorization URL.",
        OAuthCallback: "Error in handling the response from the OAuth provider.",
        OAuthCreateAccount: "Could not create OAuth provider user in the database.",
        EmailCreateAccount: "Could not create email provider user in the database.",
        Callback: "Error in the OAuth callback handler route.",
        OAuthAccountNotLinked: "Email on the account already exists with different credentials.",
        EmailSignin: "Check your email address.",
        CredentialsSignin: "Sign in failed. Check the details you provided are correct.",
        SessionRequired: "Please sign in to access this page.",
        Default: "An unexpected error occurred.",
    };

    const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

    return (
        <main className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-50"></div>
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                <div className="glass p-8 rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent backdrop-blur-xl text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
                    <p className="text-gray-400 mb-6">{message}</p>

                    {error && (
                        <p className="text-sm text-gray-500 mb-6">Error code: {error}</p>
                    )}

                    <Link
                        href="/auth/signin"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Try Again
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </main>
        }>
            <ErrorContent />
        </Suspense>
    );
}
