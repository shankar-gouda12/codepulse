"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Code2,
  RefreshCw,
  ExternalLink,
  Flame,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
  Link2,
  Unlink,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { api, StudentInfo, LeetCodeStats } from "../lib/api";
import { LeetCodeHeatmap } from "./LeetCodeHeatmap";

interface StudentDashboardProps {
  student: StudentInfo;
  onOpenEditProfile: () => void;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function StudentDashboard({ student, onOpenEditProfile }: StudentDashboardProps) {
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const statsRequestInFlight = useRef(false);

  const loadStats = useCallback(async () => {
    if (statsRequestInFlight.current) return;
    statsRequestInFlight.current = true;
    try {
      const data = await api.getMyLeetCode();
      setError(null);
      setStats(data);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to load LeetCode data."));
    } finally {
      setLoading(false);
      statsRequestInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void loadStats();
    }, 0);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadStats();
      }
    };
    const refreshInterval = window.setInterval(refreshWhenVisible, 15_000);

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadStats]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leetcodeUsername.trim()) return;

    setConnecting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.connectLeetCode(leetcodeUsername.trim());
      setSuccessMsg(res.message);
      if (res.stats) {
        setStats(res.stats);
      } else {
        await loadStats();
      }
      setLeetcodeUsername("");
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to connect LeetCode profile."));
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.syncLeetCode();
      setSuccessMsg(res.message);
      if (res.stats) {
        setStats(res.stats);
      } else {
        await loadStats();
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Sync failed. Your existing data has been preserved."));
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this LeetCode profile?")) return;
    try {
      await api.disconnectLeetCode();
      setSuccessMsg("LeetCode profile disconnected successfully.");
      setStats({ connected: false });
      await loadStats();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to disconnect."));
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading your coding pulse...</p>
      </div>
    );
  }

  const isConnected = stats?.connected && stats.username;
  const total = stats?.total_problems ?? 0;
  const easy = stats?.easy ?? 0;
  const medium = stats?.medium ?? 0;
  const hard = stats?.hard ?? 0;

  // Safe percentage helper
  const easyPercent = total > 0 ? Math.round((easy / total) * 100) : 0;
  const medPercent = total > 0 ? Math.round((medium / total) * 100) : 0;
  const hardPercent = total > 0 ? Math.round((hard / total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Alert Banners */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#002147] to-blue-700 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            {student.name ? student.name.charAt(0).toUpperCase() : "S"}
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {student.name || "Student (Name Not Set)"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {student.department} · Year {student.year}
              </span>
              {!student.name && (
                <button
                  onClick={onOpenEditProfile}
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors animate-pulse"
                >
                  Set Your Name
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 font-mono">
              USN: <span className="font-bold text-slate-700">{student.usn}</span> · DOB:{" "}
              <span className="font-bold text-slate-700">{student.dob}</span>
            </p>

            <div className="flex items-center gap-3 mt-3">
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    LeetCode: @{stats.username}
                  </span>
                  <a
                    href={stats.profile_url || `https://leetcode.com/${stats.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    View on LeetCode <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  LeetCode Not Connected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sync Controls */}
        {isConnected && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            {stats.last_synced_at && (
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Last Synchronized</span>
                <span className="text-xs text-slate-600 font-semibold">
                  {new Date(stats.last_synced_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            )}

            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              title="Fetch fresh real-time LeetCode statistics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Fetching Real-Time..." : "Sync Now"}</span>
            </button>

            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
              title="Disconnect Profile"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>

      {/* LeetCode Connection Prompt (if not connected) */}
      {!isConnected && (
        <div className="bg-gradient-to-r from-blue-900 to-[#002147] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
            <Code2 className="w-96 h-96 -mr-20" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Fast & Password-Free Integration
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Connect your LeetCode profile</h2>
            <p className="text-sm text-blue-200 mt-2 leading-relaxed">
              Link your public LeetCode handle to showcase your problem-solving consistency, active streaks,
              and problem breakdown on the DSATM MCA Placement Leaderboard. We never ask for passwords.
            </p>

            <form onSubmit={handleConnect} className="mt-6 flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  placeholder="Enter LeetCode username (e.g. shankar_gouda)"
                  className="w-full px-4 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-400 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Connect Profile</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 flex items-center gap-2 text-xs text-blue-300">
              <span>Quick test:</span>
              <button
                type="button"
                onClick={() => setLeetcodeUsername("shankar_gouda")}
                className="underline hover:text-white font-mono cursor-pointer"
              >
                shankar_gouda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics & Problem Stats (if connected) */}
      {isConnected && (
        <div className="space-y-8">
          {/* Top 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Solved Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Solved</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{total}</span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">Problems</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Global Rank:</span>
                <span className="font-bold text-slate-700">
                  {stats.ranking ? `#${stats.ranking.toLocaleString()}` : "N/A"}
                </span>
              </div>
            </div>

            {/* Easy / Med / Hard Breakdown Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty Split</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-700">Easy ({easy})</span>
                    <span className="text-slate-500">{easyPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${easyPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-amber-700">Medium ({medium})</span>
                    <span className="text-slate-500">{medPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${medPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-rose-700">Hard ({hard})</span>
                    <span className="text-slate-500">{hardPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${hardPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Days Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Days</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-800 tracking-tight">
                  {stats.active_days ?? "N/A"}
                </span>
                <span className="text-xs text-slate-400 ml-1.5 font-medium">Days with submissions</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Last active:</span>
                <span className="font-bold text-slate-700">
                  {stats.last_active ? new Date(stats.last_active).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>

            {/* Streak Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Streak</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Flame className="w-5 h-5 fill-amber-500" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600 tracking-tight">
                  {stats.current_streak ?? 0}
                </span>
                <span className="text-xs font-bold text-slate-600">Current Day Streak</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Longest Streak:</span>
                <span className="font-bold text-indigo-700 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  {stats.longest_streak ?? stats.current_streak ?? "N/A"} Days
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Heatmap */}
          <LeetCodeHeatmap
            submissionCalendarJson={stats.submission_calendar}
            activeDays={stats.active_days}
            currentStreak={stats.current_streak}
            longestStreak={stats.longest_streak}
          />

          {/* Recent Accepted Problems Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">Recent Accepted Problems</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Auto-refreshes every 15 seconds
              </span>
            </div>

            {stats.recent_problems && stats.recent_problems.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.recent_problems.map((prob, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <a
                          href={prob.url || `https://leetcode.com/problems/${prob.external_id}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-slate-800 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                        >
                          {prob.title}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Slug: {prob.external_id}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-medium block">
                        {prob.solved_date
                          ? new Date(prob.solved_date).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent problem submissions recorded yet. Solve problems on LeetCode and click &quot;Sync LeetCode&quot;!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
