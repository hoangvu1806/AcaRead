"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

interface ExamSession {
    id: string;
    filename: string;
    exam_type: string;
    passage_type: number;
    total_questions: number;
    status: string;
    has_exam: boolean;
    created_at: string;
}

interface HistoryClientProps {
    userId: string | undefined;
}

export function HistoryClient({ userId }: HistoryClientProps) {
    const { data: session, status } = useSession();
    const [sessions, setSessions] = useState<ExamSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSessions = async () => {
            // Wait for session to be loaded
            if (status === "loading") {
                return;
            }

            if (status === "unauthenticated" || !userId) {
                setIsLoading(false);
                return;
            }

            // Small delay to ensure AuthProvider's useEffect has run and set the token
            // This fixes race condition where this effect runs before token is set
            await new Promise(resolve => setTimeout(resolve, 50));

            try {
                const data = await api.getUserSessions(userId);
                setSessions(data.sessions || []);
            } catch (err: any) {
                console.error("Failed to fetch sessions:", err);
                setError(err.message || "Failed to load history");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSessions();
    }, [userId, status]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass p-8 rounded-2xl border border-red-500/20 text-center">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="glass p-8 rounded-2xl border border-white/10 text-center">
                <p className="text-gray-400">Please sign in to view your history</p>
                <Link
                    href="/auth/signin"
                    className="inline-block mt-4 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-colors"
                >
                    Sign In
                </Link>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="glass p-12 rounded-2xl border border-white/10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Exams Yet</h3>
                <p className="text-gray-400 mb-6">Create your first exam to see it here</p>
                <Link
                    href="/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Exam
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sessions.map((session) => (
                <div
                    key={session.id}
                    className="glass p-6 rounded-2xl border border-white/10 hover:border-primary-500/20 transition-all duration-300 group"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-3">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                    session.has_exam 
                                        ? "bg-green-500/20 text-green-400" 
                                        : "bg-yellow-500/20 text-yellow-400"
                                }`}>
                                    {session.has_exam ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-white truncate mb-1 group-hover:text-primary-400 transition-colors">
                                        {session.filename || "Untitled Document"}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                            session.status === "completed"
                                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                : session.status === "failed"
                                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                        }`}>
                                            {session.status}
                                        </span>
                                        {session.has_exam && (
                                            <span className="text-xs text-green-400 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Ready to practice
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            {session.exam_type}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                            </svg>
                                            Type {session.passage_type}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {session.total_questions} questions
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(session.created_at).toLocaleDateString("vi-VN", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 lg:flex-col lg:items-stretch">
                            {session.has_exam ? (
                                <Link
                                    href={`/exam/${session.id}`}
                                    className="flex-1 lg:flex-none px-5 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-red-900/30 hover:shadow-red-900/50 group-hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Start Exam</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ) : (
                                <div className="flex-1 lg:flex-none px-5 py-3 bg-gray-700/30 text-gray-500 rounded-xl flex items-center justify-center gap-2 text-sm font-medium cursor-not-allowed" title="Exam not ready yet">
                                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>Processing...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
