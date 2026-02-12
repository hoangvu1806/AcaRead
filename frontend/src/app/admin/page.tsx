"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { StorageStats } from "@/lib/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupReport, setCleanupReport] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStorageStats();
      setStats(data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const result = await api.runCleanup();
      setCleanupReport(result.report);
      await loadStats();
      alert("Cleanup completed successfully");
    } catch (err) {
      alert("Cleanup failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <span className="text-primary-500">🛡️</span> Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* Storage Stats Card */}
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-blue-400">💾</span> Storage Usage
            </h2>
            
            {stats && (
              <div className="space-y-4">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        Usage
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {stats.usage_percent}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200/20">
                    <div style={{ width: `${stats.usage_percent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-sm text-gray-400">Sessions</div>
                      <div className="text-2xl font-bold">{stats.total_sessions}</div>
                   </div>
                   <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-sm text-gray-400">Size</div>
                      <div className="text-2xl font-bold">{stats.total_mb} MB</div>
                   </div>
                </div>
                
                <div className="text-xs text-gray-500 text-center">
                   Limit: {stats.limit_mb} MB
                </div>
              </div>
            )}
          </div>

          {/* Actions Card */}
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-red-400">🧹</span> Maintenance
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              Manually trigger cleanup to remove old sessions and free up storage space.
            </p>
            <button 
              onClick={handleCleanup}
              disabled={loading}
              className="w-full py-3 bg-red-600/20 hover:bg-red-600/40 text-red-500 rounded-xl font-bold transition-colors border border-red-600/30"
            >
               {loading ? "Cleaning..." : "Run Cleanup Now"}
            </button>
            
            {cleanupReport && (
              <div className="mt-4 p-4 bg-black/20 rounded-lg text-xs font-mono text-green-400 border border-white/5">
                <div className="font-bold mb-2">Last Cleanup Report:</div>
                <pre>{JSON.stringify(cleanupReport, null, 2)}</pre>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
