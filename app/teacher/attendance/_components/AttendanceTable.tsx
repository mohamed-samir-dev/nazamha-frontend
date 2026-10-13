"use client";

import { useState } from "react";
import { Pagination } from "../../students/_components/Pagination";
import { Student, AttendanceRecord, Group } from "@/lib/types";
import {
  CheckSquare, XSquare, CalendarX, ChevronLeft, ChevronRight,
  AlertTriangle, RotateCcw,
} from "lucide-react";
import {
  isSessionExpired, isSessionFuture,
  getGroupSessionDatesForWeek, getWeekLabel,
} from "../_utils/sessionDates";
import { SessionState } from "./SessionHeaderCell";
import { GroupTable } from "./GroupTable";

function getSessionState(dateStr: string, groupTime: string, cancelled: boolean): SessionState {
  if (cancelled) return "cancelled";
  if (isSessionFuture(dateStr)) return "future";
  if (isSessionExpired(dateStr, groupTime)) return "expired";
  return "active";
}

interface GroupBlock {
  group: Group | null;
  groupId: string;
  students: Student[];
  sessionDates: string[];
  sessionStates: Record<string, SessionState>;
  activeDates: string[];
}

function buildGroupBlocks(
  students: Student[],
  groups: Group[],
  selectedGroupId: string,
  sessionDates: string[],
  weekOffset: number,
): GroupBlock[] {
  if (selectedGroupId !== "all") {
    const group = groups.find(g => g.id === selectedGroupId) ?? null;
    const cancelled = group?.cancelled_sessions ?? [];
    const states: Record<string, SessionState> = {};
    for (const d of sessionDates)
      states[d] = getSessionState(d, group?.time ?? "00:00", cancelled.includes(d));
    return [{
      group, groupId: group?.id ?? "single",
      students,
      sessionDates,
      sessionStates: states,
      activeDates: sessionDates.filter(d => states[d] !== "cancelled"),
    }];
  }

  const groupedMap = new Map<string, Student[]>();
  for (const s of students) {
    const key = s.group_id || "no-group";
    if (!groupedMap.has(key)) groupedMap.set(key, []);
    groupedMap.get(key)!.push(s);
  }

  return Array.from(groupedMap.entries()).map(([gid, grpStudents]) => {
    const group = groups.find(g => g.id === gid) ?? null;
    const grpDates = group ? getGroupSessionDatesForWeek(group, weekOffset) : sessionDates;
    const cancelled = group?.cancelled_sessions ?? [];
    const states: Record<string, SessionState> = {};
    for (const d of grpDates)
      states[d] = getSessionState(d, group?.time ?? "00:00", cancelled.includes(d));
    return {
      group, groupId: gid,
      students: grpStudents,
      sessionDates: grpDates,
      sessionStates: states,
      activeDates: grpDates.filter(d => states[d] !== "cancelled"),
    };
  });
}

interface TableProps {
  students: Student[];
  sessionDates: string[];
  attendance: AttendanceRecord[];
  selectedGroupId: string;
  selectedMonth: number;
  selectedYear: number;
  groups: Group[];
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  isPresent: (sid: string, date: string) => boolean;
  getAttendancePercent: (sid: string, activeDates: string[], joinDate?: string) => number;
  onToggle: (student: Student, date: string) => void;
  onMarkAll: (date: string, gid: string) => void;
  onClearSession: (date: string, gid: string) => void;
  onCancelSession: (groupId: string, date: string) => void;
  onShowQR: (student: Student) => void;
  onShowToast: (msg: string, type: "error") => void;
  isSaving: (gid: string, date: string) => boolean;
}

const PAGE_SIZE = 20;

export function AttendanceTable({
  students, sessionDates,
  selectedGroupId, groups, weekOffset, onWeekChange,
  isPresent, getAttendancePercent,
  onToggle, onMarkAll, onClearSession, onCancelSession, onShowQR, onShowToast, isSaving,
}: TableProps) {
  const [page, setPage] = useState(1);
  const isPastWeek = weekOffset < 0;

  const weekNav = (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-teal-500/5 border border-teal-500/15 rounded-[10px] mb-4">
      <button
        className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] border border-white/10 bg-white/[0.04] text-slate-300 cursor-pointer transition-all flex-shrink-0 hover:bg-teal-500/10 hover:border-teal-500/30 hover:text-teal-400 disabled:opacity-25 disabled:cursor-not-allowed"
        onClick={() => { onWeekChange(weekOffset - 1); setPage(1); }}
        title="الأسبوع السابق"
      >
        <ChevronRight size={16} />
      </button>
      <div className="flex items-center gap-2.5 flex-1 justify-center">
        <span className="text-[0.92rem] font-bold text-slate-100 font-mono">{getWeekLabel(weekOffset)}</span>
        {isPastWeek && <span className="text-[0.72rem] px-2 py-px rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-semibold">🔒 مقفل</span>}
        {weekOffset === 0 && <span className="text-[0.5rem] sm:text-[0.72rem] px-1 sm:px-2 py-px rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 font-semibold leading-tight">الأسبوع الحالي</span>}
      </div>
      <button
        className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] border border-white/10 bg-white/[0.04] text-slate-300 cursor-pointer transition-all flex-shrink-0 hover:bg-teal-500/10 hover:border-teal-500/30 hover:text-teal-400 disabled:opacity-25 disabled:cursor-not-allowed"
        onClick={() => { onWeekChange(weekOffset + 1); setPage(1); }}
        disabled={weekOffset >= 0}
        title="الأسبوع التالي"
      >
        <ChevronLeft size={16} />
      </button>
    </div>
  );

  const legend = (
    <div className="flex items-center gap-2 flex-wrap px-3 py-2 bg-white/[0.02] border border-white/[0.07] rounded-lg mb-3 text-[0.72rem] sm:text-[0.75rem] text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="flex items-center justify-center w-[22px] h-[18px] rounded border border-teal-500/30 text-teal-400 bg-teal-500/10"><CheckSquare size={12} /></span>
        <span>تحضير كل الطلاب دفعة واحدة</span>
      </span>
      <span className="w-px h-3.5 bg-white/10 flex-shrink-0" />
      <span className="flex items-center gap-1.5">
        <span className="flex items-center justify-center w-[22px] h-[18px] rounded border border-red-500/30 text-red-400 bg-red-500/10"><XSquare size={12} /></span>
        <span>مسح حضور كل الطلاب في الحصة</span>
      </span>
      <span className="w-px h-3.5 bg-white/10 flex-shrink-0" />
      <span className="flex items-center gap-1.5">
        <span className="flex items-center justify-center w-[22px] h-[18px] rounded border border-red-500/30 text-red-400 bg-red-500/[0.06]"><CalendarX size={12} /></span>
        <span>إلغاء الحصة — لن تحتسب في التقارير</span>
      </span>
      <span className="w-px h-3.5 bg-white/10 flex-shrink-0" />
      <span className="flex items-center gap-1.5">
        <span className="flex items-center justify-center w-[22px] h-[18px] rounded border border-teal-500/30 text-teal-400 bg-teal-500/[0.06]"><RotateCcw size={12} /></span>
        <span>استعادة حصة ملغاة</span>
      </span>
    </div>
  );

  if (students.length === 0) {
    return (
      <>
        {weekNav}
        {legend}
        <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
          <AlertTriangle size={40} className="opacity-30" />
          <p>لا يوجد طلاب في هذا الاختيار</p>
        </div>
      </>
    );
  }

  if (sessionDates.length === 0) {
    return (
      <>
        {weekNav}
        {legend}
        <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
          <CalendarX size={40} className="opacity-30" />
          <p>لا توجد حصص في هذا الأسبوع</p>
        </div>
      </>
    );
  }

  const blocks = buildGroupBlocks(students, groups, selectedGroupId, sessionDates, weekOffset);

  // Pagination على مستوى الطلاب الكلي
  const totalStudents = students.length;
  const totalPages = Math.ceil(totalStudents / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = page * PAGE_SIZE;

  // توزيع الطلاب على الـ blocks مع مراعاة الـ pagination
  const blockOffsets = blocks.reduce<number[]>((offsets, block) => [...offsets, offsets[offsets.length - 1] + block.students.length], [0]);
  const pagedBlocks = blocks.map((block, index) => {
    const blockStart = blockOffsets[index];

    const visibleStudents = block.students.filter((_, i) => {
      const globalIdx = blockStart + i;
      return globalIdx >= pageStart && globalIdx < pageEnd;
    });
    const startIndex = Math.max(blockStart, pageStart);

    return { ...block, visibleStudents, startIndex };
  }).filter(b => b.visibleStudents.length > 0);

  return (
    <>
      {weekNav}
      {legend}
      {pagedBlocks.map(block => (
        <GroupTable
          key={block.groupId}
          group={block.group}
          groupId={block.groupId}
          students={block.visibleStudents}
          sessionDates={block.sessionDates}
          sessionStates={block.sessionStates}
          activeDates={block.activeDates}
          startIndex={block.startIndex - pageStart}
          isPastWeek={isPastWeek}
          isSaving={isSaving}
          isPresent={isPresent}
          getAttendancePercent={getAttendancePercent}
          onToggle={onToggle}
          onMarkAll={onMarkAll}
          onClearSession={onClearSession}
          onCancelSession={onCancelSession}
          onShowQR={onShowQR}
          onShowToast={onShowToast}
        />
      ))}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalStudents}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </>
  );
}
