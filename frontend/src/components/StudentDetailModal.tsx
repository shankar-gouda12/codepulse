"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  User,
  ExternalLink,
  Flame,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  RefreshCw,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { api, StudentDetailResponse } from "../lib/api";
import { LeetCodeHeatmap } from "./LeetCodeHeatmap";

interface StudentDetailModalProps {
  studentId: number | null;
  onClose: () => void;
}

export function StudentDetailModal({ studentId, onClose }: StudentDetailModalProps) {
  const [data, setData] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    setLoading(true);
    setError(null);
    api
      .getStudentDetails(studentId)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || "Failed to load student details."))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) return null;

  const isConnected = data?.leetcode.connected && data.leetcode.username;
  const total = data?.leetcode.total_problems;
  const easy = data?.leetcode.easy ?? 0;
  const medium = data?.leetcode.medium ?? 0;
  const hard = data?.leetcode.hard ?? 0;

  const easyPercent = total && total > 0 ? Math.round((easy / total) * 100) : 0;
  const medPercent = total && total > 0 ? Math.round((medium / total) * 100) : 0;
  const hardPercent = total && total > 0 ? Math.round((hard / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#002147] px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg text-sky-300">
              {data?.student.name && data.student.name !== "N/A"
                ? data.student.name.charAt(0).toUpperCase()
                : "S"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {data?.student.name !== "N/A" ? data?.student.name : "Student Name (Not Entered)"}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-200 border border-sky-400/30">
                  {data?.student.department || "MCA"} · Year {data?.student.year || "1"}
                </span>
              </div>
              <p className="text-xs text-blue-200 font-mono mt-0.5">
                USN: <span className="font-bold text-white">{data?.student.usn}</span> · DOB:{" "}
                <span className="font-bold text-white">{data?.student.dob || "N/A"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Fetching verified coding details...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {data && !loading && (
            <>
              {/* LeetCode Connection status banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">
                            LeetCode Profile: @{data.leetcode.username}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        </div>
                        <a
                          href={data.leetcode.profile_url || `https://leetcode.com/${data.leetcode.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium mt-0.5"
                        >
                          Visit profile on LeetCode <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">LeetCode Not Connected</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Student has not yet linked their LeetCode handle. Metrics are displayed as N/A.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {isConnected && data.leetcode.last_synced_at && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Synced</span>
                    <span className="text-xs font-semibold text-slate-600">
                      {new Date(data.leetcode.last_synced_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Solved */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Problems Solved
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">
                      {total !== null && total !== undefined ? total : "N/A"}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-2">
                    Global Rank:{" "}
                    <strong className="text-slate-700">
                      {data.leetcode.ranking ? `#${data.leetcode.ranking.toLocaleString()}` : "N/A"}
                    </strong>
                  </span>
                </div>

                {/* Difficulty Split */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Difficulty Breakdown
                  </span>
                  {isConnected ? (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between font-semibold">
                        <span className="text-emerald-700">Easy: {easy}</span>
                        <span className="text-slate-400">{easyPercent}%</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-amber-700">Med: {medium}</span>
                        <span className="text-slate-400">{medPercent}%</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-rose-700">Hard: {hard}</span>
                        <span className="text-slate-400">{hardPercent}%</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">N/A</span>
                  )}
                </div>

                {/* Active Days */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Active Days
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">
                      {data.leetcode.active_days ?? "N/A"}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-2">
                    Last active:{" "}
                    <strong className="text-slate-700">
                      {data.leetcode.last_active
                        ? new Date(data.leetcode.last_active).toLocaleDateString()
                        : "N/A"}
                    </strong>
                  </span>
                </div>

                {/* Streak */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Coding Streak
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5 text-amber-600">
                    <Flame className="w-5 h-5 fill-amber-500" />
                    <span className="text-2xl font-black">
                      {data.leetcode.current_streak ?? "N/A"}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">Days</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-2">
                    Max: <strong className="text-indigo-700">{data.leetcode.longest_streak ?? "N/A"} Days</strong>
                  </span>
                </div>
              </div>

              {/* Activity Heatmap */}
              {isConnected && (
                <LeetCodeHeatmap
                  submissionCalendarJson={data.leetcode.submission_calendar}
                  activeDays={data.leetcode.active_days}
                  currentStreak={data.leetcode.current_streak}
                  longestStreak={data.leetcode.longest_streak}
                />
              )}

              {/* Recent Problems Table */}
              {isConnected && data.leetcode.recent_problems && data.leetcode.recent_problems.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" /> Recent Accepted LeetCode Submissions
                  </h4>

                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {data.leetcode.recent_problems.map((prob, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <a
                          href={prob.url || `https://leetcode.com/problems/${prob.external_id}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-slate-800 hover:text-blue-600 flex items-center gap-1"
                        >
                          {prob.title} <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                        <span className="text-slate-400">
                          {prob.solved_date
                            ? new Date(prob.solved_date).toLocaleString(undefined, {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "Recent"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
