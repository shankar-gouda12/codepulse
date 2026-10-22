"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Filter,
  RefreshCw,
  Trophy,
  Users,
  Calendar,
  Flame,
  ExternalLink,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FileCode,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { api, RankedStudent } from "../lib/api";
import { StudentDetailModal } from "./StudentDetailModal";

export function PlacementDashboard() {
  const [students, setStudents] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("total_problems");
  const [minSolved, setMinSolved] = useState<string>("");
  const [connectedOnly, setConnectedOnly] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [exporting, setExporting] = useState<"csv" | "excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPlacementStudents({
        search: search.trim() || undefined,
        sort_by: sortBy,
        min_solved: minSolved ? parseInt(minSolved, 10) : undefined,
        connected_only: connectedOnly || undefined,
      });
      setStudents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load rankings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRankings();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, sortBy, minSolved, connectedOnly]);

  const handleDownloadReport = async (type: "csv" | "excel" | "pdf") => {
    setExporting(type);
    try {
      const blob = await api.downloadReportBlob(type, {
        search: search.trim() || undefined,
        sort_by: sortBy,
        min_solved: minSolved ? parseInt(minSolved, 10) : undefined,
        connected_only: connectedOnly || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extensions = { csv: "csv", excel: "xlsx", pdf: "pdf" };
      a.download = `DSATM_CodePulse_Rankings.${extensions[type]}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Report download failed: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  // Overall Statistics calculated directly from true data
  const totalStudentsCount = students.length;
  const connectedCount = students.filter((s) => s.leetcode_connected).length;
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const activeTodayCount = students.filter((s) => s.last_active?.slice(0, 10) === todayKey).length;
  const totalSolvedAcrossDept = students.reduce((acc, s) => acc + (s.total_problems || 0), 0);
  const avgSolved = connectedCount > 0 ? Math.round(totalSolvedAcrossDept / connectedCount) : 0;

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center font-black text-xs shadow-md border border-amber-300 ring-2 ring-amber-400/20">
          🥇 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 flex items-center justify-center font-black text-xs shadow-sm border border-slate-300">
          🥈 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-amber-100 flex items-center justify-center font-black text-xs shadow-sm border border-amber-600">
          🥉 3
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs font-mono">
        #{rank}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#002147]">
              Dayananda Sagar Academy of Technology & Management · Department of MCA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            MCA Placement Coding Rankings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official DSA & LeetCode analytics dashboard for placement eligibility and student benchmarking.
          </p>
        </div>

        {/* Report Export Button Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1 uppercase tracking-wider hidden sm:inline">
            Export Report:
          </span>

          <button
            onClick={() => handleDownloadReport("csv")}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            <span>{exporting === "csv" ? "Exporting..." : "CSV"}</span>
          </button>

          <button
            onClick={() => handleDownloadReport("excel")}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{exporting === "excel" ? "Exporting..." : "Excel (.xlsx)"}</span>
          </button>

          <button
            onClick={() => handleDownloadReport("pdf")}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#002147] hover:bg-blue-900 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>{exporting === "pdf" ? "Exporting..." : "Official PDF"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">MCA Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{totalStudentsCount}</span>
            <span className="text-xs text-slate-400">Enrolled</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1 font-medium">Batch 2025-27</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">LeetCode Connected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-emerald-600">{connectedCount}</span>
            <span className="text-xs text-slate-400">/ {totalStudentsCount}</span>
          </div>
          <span className="text-[11px] text-emerald-700 block mt-1 font-semibold">
            {totalStudentsCount > 0 ? Math.round((connectedCount / totalStudentsCount) * 100) : 0}% Adoption
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Today</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-indigo-600">{activeTodayCount}</span>
            <span className="text-xs text-slate-400">/ {totalStudentsCount}</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1 font-medium">Students with activity today</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Average Solved</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-amber-600">{avgSolved}</span>
            <span className="text-xs text-slate-400">Per Student</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1 font-medium">Active coder average</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name or USN (e.g. 1DT25MC001)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Min Solved */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Min Solved:</span>
            <input
              type="number"
              min="0"
              value={minSolved}
              onChange={(e) => setMinSolved(e.target.value)}
              placeholder="0"
              className="w-16 px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-center focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Connected Only Checkbox */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none px-2.5 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200">
            <input
              type="checkbox"
              checked={connectedOnly}
              onChange={(e) => setConnectedOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Connected Only</span>
          </label>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="total_problems">Rank by: Total Solved</option>
              <option value="active_days">Rank by: Active Days</option>
              <option value="current_streak">Rank by: Day Streak</option>
              <option value="longest_streak">Rank by: Max Streak</option>
              <option value="last_active">Rank by: Recent Activity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rankings Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Updating student rankings...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600">{error}</div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-medium">
            No students found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#002147] text-white uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">USN</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">LeetCode Handle</th>
                  <th className="py-3.5 px-4 text-center">Total Solved</th>
                  <th className="py-3.5 px-4 text-center">Easy / Med / Hard</th>
                  <th className="py-3.5 px-4 text-center">Active Days</th>
                  <th className="py-3.5 px-4 text-center">Streak</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        {getRankBadge(student.rank)}
                      </div>
                    </td>

                    {/* USN */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {student.usn}
                    </td>

                    {/* Student Name */}
                    <td className="py-3.5 px-4">
                      {student.name && student.name !== "N/A" ? (
                        <span className="font-bold text-slate-800">{student.name}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not Entered</span>
                      )}
                    </td>

                    {/* LeetCode Handle */}
                    <td className="py-3.5 px-4">
                      {student.leetcode_connected && student.username ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 text-xs">
                            @{student.username}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">N/A</span>
                      )}
                    </td>

                    {/* Total Solved */}
                    <td className="py-3.5 px-4 text-center">
                      {student.total_problems !== null ? (
                        <span className="font-black text-slate-900 text-sm">
                          {student.total_problems}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">N/A</span>
                      )}
                    </td>

                    {/* Difficulty Badges */}
                    <td className="py-3.5 px-4 text-center">
                      {student.leetcode_connected ? (
                        <div className="inline-flex items-center gap-1 font-bold text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {student.easy ?? 0}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {student.medium ?? 0}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {student.hard ?? 0}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    {/* Active Days */}
                    <td className="py-3.5 px-4 text-center">
                      {student.active_days !== null ? (
                        <span className="font-semibold text-slate-700">
                          {student.active_days} d
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    {/* Streak */}
                    <td className="py-3.5 px-4 text-center">
                      {student.current_streak !== null && student.current_streak > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                          <Flame className="w-3.5 h-3.5 fill-amber-500" />
                          {student.current_streak}
                        </span>
                      ) : student.leetcode_connected ? (
                        <span className="text-slate-400">0</span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentId(student.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 text-[11px] font-bold transition-all flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      <StudentDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
