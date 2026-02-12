"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { SessionInfo } from "@/lib/types";
import { formatDate } from "@/lib/utils"; // Assume this exists or I'll implement inline

export function SessionList() {
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { data: session, status } = useSession(); // Add session hook

    useEffect(() => {
        if (status === "authenticated") {
            // Small delay to ensure AuthProvider has set the token
            const timer = setTimeout(() => {
                loadSessions();
            }, 50);
            return () => clearTimeout(timer);
        } else if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status]); // Run when status changes

    const loadSessions = async () => {
        try {
            setError(null);
            const data = await api.listSessions();
            setSessions(data.sessions);
        } catch (err: any) {
            console.error("Failed to load sessions:", err);
            setError(err.message || "Failed to load session history");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this session?")) return;
        try {
            await api.deleteSession(id);
            setSessions(sessions.filter(s => s.session_id !== id));
        } catch (err) {
            alert("Failed to delete session");
        }
    };

    if (loading) return <div className="text-center py-8 text-gray-400">Loading sessions...</div>;
    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <button 
                    onClick={loadSessions}
                    className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }
    if (sessions.length === 0) return null;

    return (
        <div className="mt-12 glass rounded-3xl p-8 border border-white/5">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Sessions</h2>
            <div className="space-y-4">
                {sessions.map((session) => (
                    <div key={session.session_id} className="flex flex-col md:flex-row items-center justify-between bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-auto">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                                ${session.has_exam ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {session.has_exam ? '✓' : '⏱'}
                            </div>
                            <div>
                                <div className="font-semibold text-white truncate max-w-[200px]">{session.filename}</div>
                                <div className="text-xs text-gray-400">
                                    {new Date(session.created_at).toLocaleDateString()} • {session.word_count} words
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase
                                ${session.status === 'exam' ? 'bg-green-900/40 text-green-400' : 
                                  session.status === 'failed' ? 'bg-red-900/40 text-red-400' : 
                                  'bg-blue-900/40 text-blue-400'}`}>
                                {session.status}
                            </span>
                            
                            {session.has_exam && (
                                <Link 
                                    href={`/exam/${session.session_id}`}
                                    className="px-4 py-2 bg-primary-600/20 text-primary-400 rounded-lg hover:bg-primary-600/40 text-sm font-medium transition-colors"
                                >
                                    View Exam
                                </Link>
                            )}
                            
                            <button 
                                onClick={() => handleDelete(session.session_id)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete Session"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
