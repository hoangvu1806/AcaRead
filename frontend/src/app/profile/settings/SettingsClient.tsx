"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface SettingsClientProps {
    session: Session;
}

export function SettingsClient({ session }: SettingsClientProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <div className="space-y-8">
            {/* Account Section */}
            <div className="glass p-6 rounded-3xl border border-white/10">
                <h2 className="text-xl font-bold text-white mb-6">Account</h2>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div>
                            <div className="font-medium text-white">Email</div>
                            <div className="text-sm text-gray-400">{session.user?.email}</div>
                        </div>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                            Verified
                        </span>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div>
                            <div className="font-medium text-white">Connected Account</div>
                            <div className="text-sm text-gray-400">Google OAuth</div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Connected
                        </div>
                    </div>
                </div>
            </div>

            {/* Preferences Section */}
            <div className="glass p-6 rounded-3xl border border-white/10">
                <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div>
                            <div className="font-medium text-white">Default Exam Type</div>
                            <div className="text-sm text-gray-400">IELTS Reading</div>
                        </div>
                        <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500">
                            <option value="IELTS">IELTS</option>
                            <option value="TOEIC">TOEIC</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-white/5">
                        <div>
                            <div className="font-medium text-white">Default Questions</div>
                            <div className="text-sm text-gray-400">Number of questions per exam</div>
                        </div>
                        <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500">
                            <option value="12">12</option>
                            <option value="13">13</option>
                            <option value="14" selected>14</option>
                            <option value="15">15</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between py-4">
                        <div>
                            <div className="font-medium text-white">Email Notifications</div>
                            <div className="text-sm text-gray-400">Receive updates about your exams</div>
                        </div>
                        <button className="w-12 h-6 bg-primary-500 rounded-full relative transition-colors">
                            <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="glass p-6 rounded-3xl border border-red-500/20">
                <h2 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h2>
                
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/5">
                        <div>
                            <div className="font-medium text-white">Sign Out</div>
                            <div className="text-sm text-gray-400">Sign out from this device</div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                        <div>
                            <div className="font-medium text-white">Delete Account</div>
                            <div className="text-sm text-gray-400">Permanently delete your account and all data</div>
                        </div>
                        {showDeleteConfirm ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                            >
                                Delete Account
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
