"use client";

import { Search, Printer, X, Loader2 } from "lucide-react";
import { Group, Grade } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  grades: Grade[];
  groups: Group[];
  studentGradeIds: Set<string>;
  hasCenterMode: boolean;
  subTeachers: any[];
  searchQuery: string;
  filterGradeId: string;
  filterSubTeacherId: string;
  activeFilter: string;
  onSearchChange: (v: string) => void;
  onGradeChange: (v: string) => void;
  onSubTeacherChange: (v: string) => void;
  onGroupChange: (v: string) => void;
  onApplyFilters: (gradeId?: string, groupId?: string) => void;
  onPrint: () => void;
  selectedCount?: number;
  preparingPrint?: boolean;
  disabled?: boolean;
  searching?: boolean;
}

export function StudentsFilters({
  grades, groups, studentGradeIds, hasCenterMode, subTeachers,
  searchQuery, filterGradeId, filterSubTeacherId, activeFilter,
  onSearchChange, onGradeChange, onSubTeacherChange, onGroupChange, onApplyFilters, onPrint, selectedCount = 0, preparingPrint = false, disabled = false, searching = false,
}: Props) {
  const filteredGroupsForSelect = groups
    .filter((g) => g.grade_id === filterGradeId)
    .filter((g) => !hasCenterMode || filterSubTeacherId === "all" || g.sub_teacher_id === filterSubTeacherId);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", rowGap: "1.5rem", marginBottom: "1.25rem", alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 220px", minWidth: 0, position: "relative" }}>
        <Input
          id="students-search"
          aria-label="البحث عن طالب بالاسم أو الكود"
          role="searchbox"
          dir="auto"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          aria-busy={searching}
          aria-describedby="students-search-status"
          leftIcon={searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          rightIcon={searchQuery ? <button type="button" aria-label="مسح البحث" className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-teal-500" onClick={() => {onSearchChange(""); document.getElementById("students-search")?.focus();}}><X size={16} /></button> : undefined}
          placeholder="ابحث بالاسم أو الكود..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") onSearchChange(""); }}
        />
        <small id="students-search-status" role="status" aria-live="polite" style={{ position: "absolute", top: "100%", insetInlineStart: 0, marginTop: 3, color: "var(--text-muted)", fontSize: 11 }}>{searching ? "جاري البحث…" : "بالاسم أو أي جزء من كود الطالب أو السنتر"}</small>
      </div>

      <div style={{ flex: "1 1 150px" }}>
        <select
          className="form-input"
          value={filterGradeId}
          onChange={(e) => { onApplyFilters(e.target.value, "all"); }}
        >
          <option value="all">كل السنين</option>
          {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {hasCenterMode && (
        <div style={{ flex: "1 1 150px" }}>
          <select
            className="form-input"
            value={filterSubTeacherId}
            onChange={(e) => { onSubTeacherChange(e.target.value); onApplyFilters(undefined, "all"); }}
          >
            <option value="all">كل المعلمين</option>
            {subTeachers
              .filter((st) => filterGradeId === "all" || groups.some((g) => g.grade_id === filterGradeId && g.sub_teacher_id === st.id))
              .map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
          </select>
        </div>
      )}

      <div style={{ flex: "1 1 170px" }}>
        <select
          className="form-input"
          value={activeFilter}
          onChange={(e) => onGroupChange(e.target.value)}
          disabled={filterGradeId === "all"}
          style={{ opacity: filterGradeId === "all" ? 0.5 : 1, cursor: filterGradeId === "all" ? "not-allowed" : "pointer" }}
          title={filterGradeId === "all" ? "اختر سنة دراسية أولاً" : ""}
        >
          <option value="all">جميع المجموعات</option>
          {filterGradeId !== "all" && (
            <>
              <option value="none">بدون مجموعة</option>
              {filteredGroupsForSelect.map((g) => (
                <option key={g.id} value={g.id}>{g.name} {g.is_private ? "(خاصة)" : ""}</option>
              ))}
            </>
          )}
        </select>
      </div>

      <Button variant="secondary" disabled={preparingPrint || disabled} onClick={onPrint} leftIcon={<Printer size={16} />} style={{ whiteSpace: "nowrap" }}>
        {preparingPrint ? "جاري تجهيز الطباعة…" : selectedCount > 0 ? `طباعة المحدد (${selectedCount})` : "طباعة كل النتائج"}
      </Button>
    </div>
  );
}
