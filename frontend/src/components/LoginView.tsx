"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  ShieldCheck,
  Calendar,
  KeyRound,
  User,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Award,
  CheckCircle2,
  Code2,
} from "lucide-react";
import { api, AuthResponse } from "../lib/api";

interface LoginViewProps {
  onLoginSuccess: (authData: AuthResponse) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [tab, setTab] = useState<"STUDENT" | "PLACEMENT_HEAD">("STUDENT");

  // Student form state
  const [usn, setUsn] = useState("");
  const [dob, setDob] = useState("");

  // Placement form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usn.trim() || !dob.trim()) {
      setError("Please provide both your USN and Date of Birth.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.studentLogin(usn.trim(), dob.trim());
      onLoginSuccess(res);
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please verify your USN and Date of Birth.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please provide both Login ID and Password.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.placementLogin(username.trim(), password);
      onLoginSuccess(res);
    } catch (err: any) {
      setError(err.message || "Incorrect Login ID or Password.");
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for evaluator
  const fillStudentDemo = () => {
    setUsn("1DT25MC001");
    setDob("01-01-2004");
    setError(null);
  };

  const fillPlacementDemo = () => {
    setUsername("placement_head");
    setPassword("placement123");
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Left Side: DSATM Branding & College Visual */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#002147] via-[#092955] to-[#12386d] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-sky-400/10 blur-2xl" />

          <div className="relative z-10">
            {/* DSATM Header */}
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-white p-1 shadow-lg flex items-center justify-center border-2 border-yellow-400 shrink-0">
                <img
                  src="/dsi_logo.png"
                  alt="Dayananda Sagar Institutions Emblem"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <p className="text-[12px] font-bold text-yellow-300 uppercase tracking-wider">
                  Dayananda Sagar Institutions
                </p>
                <p className="text-xs text-blue-100 font-semibold">
                  Dayananda Sagar Academy of Technology & Management (DSATM)
                </p>
              </div>
            </div>

            <div className="mt-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <Sparkles className="w-3.5 h-3.5" /> Department of MCA
              </span>
              <h1 className="text-3xl font-black tracking-tight text-white mt-3">
                CodePulse <span className="text-sky-400">Platform</span>
              </h1>
              <p className="text-xs text-blue-100/80 mt-2 leading-relaxed">
                Empowering MCA students with automated LeetCode progress tracking, active streaks,
                and transparent placement benchmarking.
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="relative z-10 my-8 space-y-3">
            <div className="flex items-start gap-3 text-xs text-blue-100">
              <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Real-time LeetCode synchronization via GraphQL</span>
            </div>

            <div className="flex items-start gap-3 text-xs text-blue-100">
              <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Placement rankings with verified tie-breaking</span>
            </div>

            <div className="flex items-start gap-3 text-xs text-blue-100">
              <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>One-click reports in CSV, Excel, and PDF</span>
            </div>
          </div>

          {/* Institutional Footer */}
          <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-blue-200/60">
            <span>Official DSATM Placement & Academic Cell · 2026</span>
          </div>
        </div>

        {/* Right Side: Auth Tabs & Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Tab Selector */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-6">
            <button
              onClick={() => {
                setTab("STUDENT");
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === "STUDENT"
                  ? "bg-white text-[#002147] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </button>

            <button
              onClick={() => {
                setTab("PLACEMENT_HEAD");
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === "PLACEMENT_HEAD"
                  ? "bg-white text-[#002147] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Placement Head</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STUDENT LOGIN FORM */}
          {tab === "STUDENT" && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    University Seat Number (USN)
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">1DT25MC001 to 1DT25MC100</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    placeholder="e.g. 1DT25MC001"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-mono font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Date of Birth (DOB)
                  </label>
                  <span className="text-[11px] text-slate-400">Format: DD-MM-YYYY</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="01-01-2004"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-mono font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Student Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Fill Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Dev Testing Seed:</span>
                <button
                  type="button"
                  onClick={fillStudentDemo}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ⚡ Fill Sample (1DT25MC001)
                </button>
              </div>
            </form>
          )}

          {/* PLACEMENT HEAD LOGIN FORM */}
          {tab === "PLACEMENT_HEAD" && (
            <form onSubmit={handlePlacementSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Placement Login ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="placement_head"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Security Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#002147] hover:bg-blue-900 text-white font-bold text-sm shadow-md shadow-blue-950/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Placement Head Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Fill Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Authorized Officer:</span>
                <button
                  type="button"
                  onClick={fillPlacementDemo}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ⚡ Fill Placement Head Credentials
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

