"use client";

import React, { useState } from "react";
import { Lock, User, AlertCircle, CheckCircle2, X, Trash2 } from "lucide-react";
import { api, StudentInfo } from "../lib/api";

interface StudentProfileModalProps {
  isOpen: boolean;
  isFirstTime?: boolean;
  student: StudentInfo;
  onClose: () => void;
  onSaved: (updated: StudentInfo) => void;
}

export function StudentProfileModal({
  isOpen,
  isFirstTime = false,
  student,
  onClose,
  onSaved,
}: StudentProfileModalProps) {
  const [name, setName] = useState(student.name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (overrideName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const targetName = overrideName !== undefined ? overrideName : name.trim();
      const updated = await api.updateStudentProfile(targetName ? targetName : null);
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update profile name.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#002147] px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {isFirstTime ? "Welcome to DSATM CodePulse!" : "Edit Student Profile"}
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">
              {isFirstTime
                ? "You can enter your full name to complete your MCA profile."
                : "Update or remove your student profile name."}
            </p>
          </div>
          {!isFirstTime && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isFirstTime && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Setup Official Name</p>
                <p className="text-amber-700 mt-0.5">
                  Your USN, Date of Birth, Department, and Academic Year are verified and locked.
                  Enter your official full name as per DSATM records, or leave it blank if preferred.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Editable Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Student Name <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              {student.name && (
                <button
                  type="button"
                  onClick={() => {
                    setName("");
                    handleSave("");
                  }}
                  disabled={loading}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Name</span>
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shankar Gouda (leave empty to clear)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-medium text-slate-800 placeholder-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              To remove your name, simply clear the input field and click &quot;Save&quot;, or click &quot;Remove Name&quot;.
            </p>
          </div>

          {/* Locked / Non-editable fields per requirement */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" /> Locked Institutional Records
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">USN</span>
                <span className="text-xs font-mono font-bold text-slate-700">{student.usn}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">Department</span>
                <span className="text-xs font-bold text-slate-700">{student.department}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">Academic Year</span>
                <span className="text-xs font-bold text-slate-700">Year {student.year} (2025-27)</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-500 block font-semibold uppercase">Date of Birth</span>
                <span className="text-xs font-mono font-bold text-slate-700">{student.dob}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3">
            <div>
              {student.name && (
                <button
                  type="button"
                  onClick={() => {
                    setName("");
                    handleSave("");
                  }}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Name</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isFirstTime && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {loading ? "Saving..." : name.trim() ? "Save Name" : "Save (No Name)"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
