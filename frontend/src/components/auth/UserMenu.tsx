"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

import { api } from "@/lib/api";

export function UserMenu() {
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [credits, setCredits] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchCredits = async () => {
            if (session?.user && (session.user as any).id) {
                try {
                    const data = await api.getUser((session.user as any).id);
                    if (data?.user?.credits) {
                        setCredits(data.user.credits.balance);
                    }
                } catch (error) {
                    console.error("Failed to fetch credits:", error);
                }
            }
        };

        if (isOpen) {
            fetchCredits();
        }
    }, [session, isOpen]);

    if (status === "loading") {
        return (
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
        );
    }

    if (!session) {
        return (
            <button
                onClick={() => signIn("google")}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
            </button>
        );
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
                {session.user?.image ? (
                    <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                        {session.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                )}
                <span className="text-sm font-medium text-gray-300 hidden sm:block">
                    {session.user?.name?.split(" ")[0] || "User"}
                    {credits !== null && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs text-primary-400 border border-white/5">
                            {credits}
                        </span>
                    )}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 py-2 bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white">{session.user?.name}</p>
                        <p className="text-xs text-gray-400 truncate mb-2">{session.user?.email}</p>
                        <div className="flex items-center gap-2 text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-gray-400">Credits:</span>
                            <span className="font-bold text-primary-400">{credits !== null ? credits : "..."}</span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Profile
                        </Link>
                        <Link
                            href="/profile/history"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            My Exam History
                        </Link>
                        <Link
                            href="/profile/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                        </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-white/10 pt-2">
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
