import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin");
    }

    return (
        <main className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"></div>
            </div>

            {/* Header */}
            <header className="relative bg-background/80 backdrop-blur-md shadow-lg border-b border-white/5 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img src="/images/logo.png" alt="AcaRead" className="w-12 h-12 object-contain" />
                        <div>
                            <span className="text-3xl font-bold tracking-tight">
                                <span className="text-primary-500">Aca</span>
                                <span className="text-white">Read</span>
                            </span>
                            <div className="text-xs text-secondary-400 font-medium tracking-wide">
                                AI Exam Generator
                            </div>
                        </div>
                    </Link>
                    <Link
                        href="/profile"
                        className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
                    >
                        Back to Profile
                    </Link>
                </div>
            </header>

            <div className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-gray-400 mt-2">Manage your account preferences</p>
                </div>

                <SettingsClient session={session} />
            </div>
        </main>
    );
}
