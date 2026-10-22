"use client";

import React, { useMemo, useState } from "react";
import { Calendar, Flame, Award, CheckCircle2 } from "lucide-react";

interface LeetCodeHeatmapProps {
  submissionCalendarJson?: string | null;
  activeDays?: number;
  currentStreak?: number;
  longestStreak?: number;
}

export function LeetCodeHeatmap({
  submissionCalendarJson,
  activeDays = 0,
  currentStreak = 0,
  longestStreak = 0,
}: LeetCodeHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Parse submission calendar into map: "YYYY-MM-DD" -> count
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!submissionCalendarJson) return map;

    try {
      const raw = JSON.parse(submissionCalendarJson);
      for (const [ts, count] of Object.entries(raw)) {
        const d = new Date(parseInt(ts, 10) * 1000);
        // Normalize to local YYYY-MM-DD
        const key = d.toISOString().split("T")[0];
        map.set(key, (map.get(key) || 0) + (count as number));
      }
    } catch (e) {
      console.error("Failed to parse calendar JSON:", e);
    }
    return map;
  }, [submissionCalendarJson]);

  // Generate grid for past 52 weeks (364 days ending today)
  const weeks = useMemo(() => {
    const result: Array<Array<{ date: Date; dateStr: string; count: number }>> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End on the Saturday of this week or today
    const daysToSubtract = 52 * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToSubtract + (7 - today.getDay()));

    let current = new Date(startDate);
    let currentWeek: Array<{ date: Date; dateStr: string; count: number }> = [];

    while (current <= today) {
      const dateStr = current.toISOString().split("T")[0];
      const count = activityMap.get(dateStr) || 0;

      currentWeek.push({
        date: new Date(current),
        dateStr,
        count,
      });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [activityMap]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-slate-100 hover:ring-1 hover:ring-slate-300";
    if (count <= 2) return "bg-emerald-200 border-emerald-300 hover:ring-1 hover:ring-emerald-400";
    if (count <= 5) return "bg-emerald-400 border-emerald-500 hover:ring-1 hover:ring-emerald-600";
    if (count <= 9) return "bg-emerald-600 border-emerald-700 hover:ring-1 hover:ring-emerald-800";
    return "bg-emerald-800 border-emerald-900 text-white";
  };

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      {/* Header stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">LeetCode Activity Heatmap</h3>
            <p className="text-xs text-slate-500">Recorded problem submissions over the past 12 months</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-800 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{activeDays} Active Days</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-800 font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>{currentStreak} Day Streak</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-800 font-semibold">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            <span>Max Streak: {longestStreak} Days</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid container */}
      <div className="relative mt-6 overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          <div className="flex gap-[3.5px]">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[3.5px]">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredCell({
                        dateStr: day.dateStr,
                        count: day.count,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`w-[11.5px] h-[11.5px] rounded-[2.5px] transition-all duration-100 cursor-pointer ${getColorClass(
                      day.count
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Days label & Legend */}
          <div className="flex items-center justify-between mt-4 text-[11px] text-slate-500 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-4">
              <span>Sun</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 border border-slate-200" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-200" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-800" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredCell && (
        <div
          style={{
            position: "fixed",
            left: hoveredCell.x,
            top: hoveredCell.y,
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
          }}
          className="z-50 bg-slate-900 text-white px-2.5 py-1.5 rounded-md text-[11px] shadow-lg whitespace-nowrap flex flex-col items-center"
        >
          <span className="font-semibold">
            {hoveredCell.count === 0
              ? "No submissions"
              : `${hoveredCell.count} submission${hoveredCell.count > 1 ? "s" : ""}`}
          </span>
          <span className="text-slate-400 text-[10px]">{hoveredCell.dateStr}</span>
        </div>
      )}
    </div>
  );
}

