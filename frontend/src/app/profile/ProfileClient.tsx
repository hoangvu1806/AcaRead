"use client";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Calendar, 
  HardDrive, 
  LogOut, 
  CreditCard, 
  Zap, 
  History, 
  Settings, 
  Plus,
  CheckCircle2,
  BarChart3,
  FileText,
  Clock
} from "lucide-react";

interface UserPlan {
    type: string;
    exams_limit: number;
    exams_used: number;
    started_at: string | null;
    expires_at: string | null;
}

interface UserCredits {
    balance: number;
    weekly_limit: number;
    week_start: string | null;
    total_used: number;
}

interface UserData {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    plan: UserPlan;
    credits: UserCredits;
    total_exams_created: number;
    total_sessions: number;
    storage_used_mb: number;
    created_at: string | null;
    last_login_at: string | null;
}

interface UserStats {
    total_exams: number;
    total_sessions: number;
    exams_this_month: number;
    avg_score: number | null;
}

interface ProfileClientProps {
    session: Session;
}

const PLAN_CONFIG = {
    free: {
        name: "Free",
        color: "slate",
        limit: 5,
        features: ["5 exams/month", "Basic question types", "PDF export"],
    },
    starter: {
        name: "Starter",
        color: "blue",
        limit: 20,
        features: ["20 exams/month", "All question types", "PDF + Word export", "Priority support"],
    },
    pro: {
        name: "Pro",
        color: "red",
        limit: 100,
        features: ["100 exams/month", "All question types", "All export formats", "API access", "Priority support"],
    },
    enterprise: {
        name: "Enterprise",
        color: "yellow",
        limit: -1,
        features: ["Unlimited exams", "Custom integrations", "Dedicated support", "SLA guarantee", "Team management"],
    },
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function ProfileClient({ session }: ProfileClientProps) {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const userId = (session.user as any)?.id;

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            try {
                const accessToken = (session.user as any)?.accessToken;
                const headers = {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                };

                const [userResponse, statsResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/v1/users/${userId}`, { headers }),
                    fetch(`${API_BASE_URL}/api/v1/users/${userId}/stats`, { headers }),
                ]);

                if (userResponse.ok) {
                    const data = await userResponse.json();
                    setUserData(data.user);
                }

                if (statsResponse.ok) {
                    const data = await statsResponse.json();
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const currentPlan = userData?.plan?.type || "free";
    const planConfig = PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;
    const examsUsed = userData?.plan?.exams_used || 0;
    const examsLimit = userData?.plan?.exams_limit || 5;
    const usagePercent = examsLimit > 0 ? Math.min((examsUsed / examsLimit) * 100, 100) : 0;

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string; border: string; bar: string }> = {
            slate: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", bar: "bg-slate-500" },
            blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", bar: "bg-blue-500" },
            red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", bar: "bg-red-500" },
            yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", bar: "bg-yellow-500" },
        };
        return colors[color] || colors.slate;
    };

    const planColors = getColorClasses(planConfig.color);

    return (
        <div className="space-y-8 font-sans">
            {/* Profile Header */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-8">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                    {session.user?.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="w-24 h-24 rounded-full border-4 border-white/5"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-3xl border-4 border-white/5">
                            {session.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                    )}

                    <div className="text-center sm:text-left flex-1">
                        <h1 className="text-3xl font-bold text-white mb-2">{session.user?.name}</h1>
                        <p className="text-slate-400 flex items-center gap-2 justify-center sm:justify-start">
                            <Mail className="w-4 h-4" />
                            {session.user?.email}
                        </p>
                        
                        <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
                             <div className={`px-3 py-1 ${planColors.bg} ${planColors.text} border ${planColors.border} rounded-full text-xs font-semibold uppercase tracking-wider`}>
                                {planConfig.name} Plan
                            </div>
                            <div className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Active
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="px-4 py-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 border border-white/10 hover:border-red-500/20 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Col: Plan & Credits */}
                <div className="lg:col-span-2 space-y-8">
                     {/* Subscription Plan */}
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-slate-400" />
                                Subscription Usage
                            </h2>
                            <span className="text-slate-400 text-sm">Resets monthly</span>
                        </div>

                        {/* Usage Bar */}
                        <div className="mb-8">
                            <div className="flex justify-between text-sm mb-3">
                                <span className="text-slate-400 font-medium">Exams Generated</span>
                                <span className="text-white font-bold">
                                    {examsLimit === -1 ? `${examsUsed} (Unlimited)` : `${examsUsed} / ${examsLimit}`}
                                </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${planColors.bar} rounded-full transition-all duration-500`}
                                    style={{ width: `${examsLimit === -1 ? 100 : usagePercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Plan Features */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {planConfig.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-3 text-sm text-slate-400">
                                    <CheckCircle2 className={`w-4 h-4 ${planColors.text}`} />
                                    {feature}
                                </div>
                            ))}
                        </div>

                        {/* Upgrade CTA */}
                        {currentPlan !== "enterprise" && (
                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                                <p className="text-slate-400 text-sm">Unlock more features with Pro plan.</p>
                                <Link
                                    href="/#pricing"
                                    className="px-5 py-2 bg-white text-black hover:bg-slate-200 font-medium rounded-lg text-sm transition-colors"
                                >
                                    Upgrade Plan
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Weekly Credits */}
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap className="w-32 h-32 text-orange-500" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Weekly Credits</h2>
                                    <p className="text-slate-400 text-xs">Refreshes every week</p>
                                </div>
                            </div>
                            
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-4xl font-bold text-white">{userData?.credits?.balance ?? 20}</span>
                                <span className="text-slate-500 mb-1">/ {userData?.credits?.weekly_limit ?? 20} available</span>
                            </div>
                            
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                                <div
                                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${((userData?.credits?.balance ?? 20) / (userData?.credits?.weekly_limit ?? 20)) * 100}%` }}
                                />
                            </div>
                            
                            <div className="flex gap-6 text-xs text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                    Create Exam: 2 credits
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                    Edit: 1 credit
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Stats & Actions */}
                <div className="space-y-8">
                     {/* Quick Actions */}
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link
                                href="/create"
                                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-900/20 group-hover:scale-110 transition-transform">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Create Exam</div>
                                    <div className="text-xs text-slate-400">Generate new test</div>
                                </div>
                            </Link>

                             <Link
                                href="/profile/history"
                                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">History</div>
                                    <div className="text-xs text-slate-400">View past results</div>
                                </div>
                            </Link>

                             <Link
                                href="/profile/settings"
                                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                    <Settings className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Settings</div>
                                    <div className="text-xs text-slate-400">Account preferences</div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#111] border border-white/5 p-4 rounded-xl text-center">
                            <div className="text-slate-400 mb-2 flex justify-center"><BarChart3 className="w-5 h-5" /></div>
                            <div className="text-2xl font-bold text-white mb-1">{isLoading ? "-" : stats?.total_exams || 0}</div>
                            <div className="text-xs text-slate-500">Total Exams</div>
                        </div>
                         <div className="bg-[#111] border border-white/5 p-4 rounded-xl text-center">
                            <div className="text-slate-400 mb-2 flex justify-center"><Clock className="w-5 h-5" /></div>
                            <div className="text-2xl font-bold text-white mb-1">{isLoading ? "-" : stats?.total_sessions || 0}</div>
                            <div className="text-xs text-slate-500">Sessions</div>
                        </div>
                    </div>

                     {/* Info Table */}
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                         <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Details</h2>
                         <div className="space-y-3 text-sm">
                             <div className="flex justify-between">
                                 <span className="text-slate-500">User ID</span>
                                 <span className="text-slate-300 font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">{userId?.substring(0, 8)}...</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-slate-500">Storage</span>
                                 <span className="text-slate-300">{userData?.storage_used_mb?.toFixed(2) || "0"} MB</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-slate-500">Joined</span>
                                 <span className="text-slate-300">{userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : "-"}</span>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
