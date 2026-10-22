"use client";

import React from "react";
import Image from "next/image";
import { LogOut, User, ShieldCheck, GraduationCap, Code2, ExternalLink } from "lucide-react";
import { clearAuth } from "../lib/api";

interface NavbarProps {
  role: "STUDENT" | "PLACEMENT_HEAD" | null;
  username: string | null;
  studentName?: string | null;
  onLogout: () => void;
  onOpenEditProfile?: () => void;
}

export function Navbar({
  role,
  username,
  studentName,
  onLogout,
  onOpenEditProfile,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#002147] text-white shadow-md border-b border-blue-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* DSATM Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white p-0.5 shadow-md overflow-hidden border-2 border-yellow-400 shrink-0">
              <img
                src="/dsi_logo.png"
                alt="Dayananda Sagar Institutions Emblem"
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <Code2 className="w-6 h-6 text-[#002147] absolute" style={{ zIndex: -1 }} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  DSATM <span className="text-sky-400 font-extrabold">CodePulse</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/80 text-blue-200 border border-blue-700/60 uppercase tracking-wider">
                  MCA Dept
                </span>
              </div>
              <p className="hidden md:block text-xs text-blue-200/80 tracking-wide font-medium">
                Dayananda Sagar Academy of Technology & Management · Placement Coding Analytics
              </p>
            </div>
          </div>

          {/* Right side: User info & logout */}
          {role && (
            <div className="flex items-center gap-3">
              {role === "STUDENT" ? (
                <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-800/80 px-3.5 py-1.5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight">
                      {studentName || "Student"}
                    </p>
                    <p className="text-[11px] text-sky-300/80 font-mono leading-tight">
                      {username}
                    </p>
                  </div>
                  {onOpenEditProfile && (
                    <button
                      onClick={onOpenEditProfile}
                      title="Edit Profile Name"
                      className="ml-1 p-1 hover:bg-blue-800/60 rounded text-slate-300 hover:text-white transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-800/80 px-3.5 py-1.5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight">Placement Head</p>
                    <p className="text-[11px] text-amber-300/80 leading-tight">Admin Portal</p>
                  </div>
                </div>
              )}

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-200 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

