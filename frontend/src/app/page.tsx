"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { LoginView } from "../components/LoginView";
import { StudentDashboard } from "../components/StudentDashboard";
import { PlacementDashboard } from "../components/PlacementDashboard";
import { StudentProfileModal } from "../components/StudentProfileModal";
import {
  api,
  AuthResponse,
  StudentInfo,
  getAuthRole,
  getStoredStudent,
  clearAuth,
} from "../lib/api";

export default function Home() {
  const [role, setRole] = useState<"STUDENT" | "PLACEMENT_HEAD" | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check saved session in localStorage
    const savedRole = getAuthRole();
    const savedUsername = typeof window !== "undefined" ? localStorage.getItem("dsatm_username") : null;
    const savedStudent = getStoredStudent();

    if (savedRole && savedUsername) {
      setRole(savedRole);
      setUsername(savedUsername);
      if (savedStudent) {
        setStudent(savedStudent);
        if (savedRole === "STUDENT" && (!savedStudent.name || savedStudent.needs_name)) {
          setIsFirstTime(true);
          setIsEditProfileOpen(true);
        }
      }
    }
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (data: AuthResponse) => {
    setRole(data.role);
    setUsername(data.username);
    if (data.student) {
      setStudent(data.student);
      // Requirement 2: Students enter their names after their first login.
      if (!data.student.name || data.student.needs_name) {
        setIsFirstTime(true);
        setIsEditProfileOpen(true);
      }
    }
  };

  const handleLogout = () => {
    clearAuth();
    setRole(null);
    setUsername(null);
    setStudent(null);
    setIsEditProfileOpen(false);
  };

  const handleProfileSaved = (updated: StudentInfo) => {
    setStudent(updated);
    setIsFirstTime(false);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        role={role}
        username={username}
        studentName={student?.name}
        onLogout={handleLogout}
        onOpenEditProfile={role === "STUDENT" ? () => setIsEditProfileOpen(true) : undefined}
      />

      <main className="flex-1">
        {!role ? (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        ) : role === "STUDENT" && student ? (
          <>
            <StudentDashboard
              student={student}
              onOpenEditProfile={() => {
                setIsFirstTime(false);
                setIsEditProfileOpen(true);
              }}
            />

            {/* Profile Setup / Edit Modal */}
            <StudentProfileModal
              isOpen={isEditProfileOpen}
              isFirstTime={isFirstTime}
              student={student}
              onClose={() => setIsEditProfileOpen(false)}
              onSaved={handleProfileSaved}
            />
          </>
        ) : role === "PLACEMENT_HEAD" ? (
          <PlacementDashboard />
        ) : null}
      </main>

      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-800">
          Dayananda Sagar Academy of Technology & Management · Placement Coding Analytics
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          DSATM CodePulse · Department of MCA
        </p>
      </footer>
    </div>
  );
}
