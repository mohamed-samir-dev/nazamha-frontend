"use client";

import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { printInPlace } from "@/lib/printInPlace";
import { useState, useMemo } from "react";
import { FiSearch, FiX, FiTrash2, FiGrid, FiPrinter, FiChevronDown } from "react-icons/fi";
import { MdOutlineCalendarMonth } from "react-icons/md";
import { RiCheckboxLine, RiCheckboxBlankLine, RiFolderOpenLine } from "react-icons/ri";
import { BiErrorCircle } from "react-icons/bi";
import { Group, Student, Grade, SubTeacher } from "@/lib/types";
import { GroupCard } from "@/components/features/GroupCard";
import { ARABIC_DAYS, splitDays, timeToMinutes, formatTimeTo12H } from "@/lib/groupUtils";

interface SectionHeaderProps {
  label: string;
  count: number;
  muted?: boolean;
  sectionKey: string;
  collapsed: Record<string, boolean>;
  onToggle: (key: string) => void;
}

function SectionHeader({ label, count, muted, sectionKey, collapsed, onToggle }: SectionHeaderProps) {
  const isCollapsed = collapsed[sectionKey];
  return (
    <button
      type="button"
      onClick={() => onToggle(sectionKey)}
      className="flex items-center gap-2 w-full text-right mb-4 pb-3 border-b border-white/[0.08] cursor-pointer"
      style={{ background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 0 0.75rem", fontFamily: "inherit" }}
    >
      <RiFolderOpenLine size={17} className={muted ? "text-slate-500" : "text-teal-400"} />
      <span className="text-[1.05rem] font-semibold" style={{ color: "var(--text-primary)" }}>{label}</span>
      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-teal-500/10 text-teal-400 text-[0.75rem] font-bold border border-teal-500/20">
        {count}
      </span>
      <FiChevronDown
        size={20}
        style={{ marginRight: "auto", color: "var(--text-muted)", transition: "transform 0.25s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", flexShrink: 0 }}
      />
    </button>
  );
}

interface GroupsListProps {
  groups: Group[];
  students: Student[];
  grades: Grade[];
  subTeachers: SubTeacher[];
  hasCenterMode: boolean;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onDeleteSelected: () => void;
  onEdit: (group: Group) => void;
}

export function GroupsList({
  groups, students, grades, subTeachers, hasCenterMode,
  selectedIds, onSelect, onSelectAll, onDelete, onDeleteSelected, onEdit,
}: GroupsListProps) {
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [view, setView] = useState<"cards" | "schedule">("cards");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  // grades الموجودة فعلاً في المجموعات المعروضة
  const activeGrades = useMemo(() => {
    const gradeIds = new Set(groups.map((g) => g.grade_id).filter(Boolean));
    const fromGrades = grades.filter((g) => gradeIds.has(g.id));
    // grade_ids موجودة في المجموعات لكن مش في grades array
    const missingIds = [...gradeIds].filter((id) => !grades.find((g) => g.id === id));
    const missing = missingIds.map((id) => {
      const group = groups.find((g) => g.grade_id === id);
      return { id: id!, name: group?.grade_id || "سنة غير معروفة", monthly_price: null, teacher_id: "", created_at: "" } as Grade;
    });
    return [...fromGrades, ...missing];
  }, [groups, grades]);

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      const q = search.trim().toLowerCase();
      if (q && !g.name.toLowerCase().includes(q) && !(g.code || "").toLowerCase().includes(q)) return false;
      if (filterGrade && g.grade_id !== filterGrade) return false;
      if (filterDay && !splitDays(g.day_of_week || "").includes(filterDay)) return false;
      return true;
    });
  }, [groups, search, filterGrade, filterDay]);

  const allFilteredIds = filtered.map((g) => g.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id));

  const studentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      if (s.group_id && !s.is_suspended) {
        map.set(s.group_id, (map.get(s.group_id) || 0) + 1);
      }
    }
    return map;
  }, [students]);

  const totalStudents = filtered.reduce((s, g) => s + (studentCountMap.get(g.id) || 0), 0);
  const totalRevenue = filtered.reduce((s, g) => s + (g.monthly_price ?? 0) * (studentCountMap.get(g.id) || 0), 0);

  const handlePrint = async () => {
    const date = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    let printTotal = 0;
    let printRevenue = 0;
    const rows = filtered.map((g, i) => {
      const count = studentCountMap.get(g.id) || 0;
      printTotal += count;
      printRevenue += (g.monthly_price ?? 0) * count;
      const low = count < 5;
      return {
        num: i + 1,
        name: g.name,
        code: g.code || "—",
        grade: grades.find((gr) => gr.id === g.grade_id)?.name?.replace("الصف ", "") || "—",
        days: g.day_of_week,
        time: formatTimeTo12H(g.time),
        price: g.monthly_price != null ? g.monthly_price + " ج" : "—",
        count,
        low,
        type: g.is_private ? "خاصة" : "عامة",
      };
    });

    const rowsHtml = rows.map((r) => `
      <tr style="background:${r.low ? "#fffbeb" : r.num % 2 === 0 ? "#fff" : "#f9fafb"}">
        <td style="color:#999;text-align:center;font-size:11px">${r.num}</td>
        <td style="font-weight:700;font-size:13px">${r.name}</td>
        <td style="font-family:monospace;color:#555;font-size:11px">${r.code}</td>
        <td>${r.grade}</td>
        <td>${r.days}</td>
        <td>${r.time}</td>
        <td style="font-weight:600">${r.price}</td>
        <td style="font-weight:700;text-align:center;color:${r.low ? "#b45309" : "#111"}">${r.count}${r.low ? " ⚠" : ""}</td>
        <td style="text-align:center">${r.type}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"/>
      <title>تقرير المجموعات</title>
      <style>
        @page{size:A4 portrait;margin:0 !important}
        *{margin:0;padding:0;box-sizing:border-box}
        html{width:210mm;overflow-x:hidden}
        body{width:210mm;font-family:"Segoe UI",Arial,sans-serif;color:#111;background:#fff;direction:rtl;padding:14mm 14mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;margin-bottom:18px;border-bottom:3px solid #111}
        .title{font-size:22px;font-weight:800;margin-bottom:4px}
        .sub{font-size:11px;color:#555}
        .stats{display:flex;gap:16px}
        .stat{display:flex;flex-direction:column;align-items:center;padding:6px 16px;border:1px solid #ddd;border-radius:8px;min-width:72px}
        .sv{font-size:18px;font-weight:800;line-height:1}
        .sl{font-size:10px;color:#666;margin-top:2px}
        table{width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed}
        thead tr{background:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        thead th{padding:9px 10px;color:#fff;text-align:right;font-weight:700;font-size:11px;overflow:hidden;word-break:break-word}
        tbody td{padding:8px 10px;border-bottom:1px solid #e5e7eb;overflow:hidden;word-break:break-word}
        tfoot td{border-top:2px solid #111;padding:9px 10px;font-weight:700;font-size:13px;background:#f3f4f6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .ftr{display:flex;justify-content:space-between;font-size:10px;color:#999;border-top:1px solid #e5e7eb;padding-top:8px;margin-top:12px}
      </style>
    </head><body>
      <div class="hdr">
        <div><div style="font-size:11px;font-weight:700;color:#0d9488;margin-bottom:2px">منصة نظمها للإدارة التعليمية</div><div class="title">بيان رسمي بجدول وإحصائيات المجموعات الدراسية</div><div class="sub">تاريخ الإصدار: ${date} — كشف معتمد</div></div>
        <div class="stats">
          <div class="stat"><span class="sv">${rows.length}</span><span class="sl">مجموعة</span></div>
          <div class="stat"><span class="sv">${printTotal}</span><span class="sl">طالب</span></div>
          <div class="stat"><span class="sv">${printRevenue.toLocaleString("ar-EG")}</span><span class="sl">ج/شهر</span></div>
        </div>
      </div>
      <table>
        <thead><tr>
          <th style="width:32px">#</th><th>اسم المجموعة</th><th>الكود</th><th>السنة</th>
          <th>الأيام</th><th>الوقت</th><th>الاشتراك</th>
          <th style="text-align:center">الطلاب</th><th style="text-align:center">النوع</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot><tr>
          <td colspan="7" style="text-align:right">الإجمالي</td>
          <td style="text-align:center">${printTotal}</td><td></td>
        </tr></tfoot>
      </table>
      <div class="ftr" style="display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;color:#475569;border-top:2px solid #111;padding-top:16px;margin-top:24px;page-break-inside:avoid">
        <div style="max-width:240px">
          <div style="font-weight:800;color:#111;font-size:12px;margin-bottom:4px">منصة نظمها للإدارة التعليمية</div>
          <div style="line-height:1.6">بيان رسمي معتمد مستخرج آلياً بتاريخ ${date}</div>
        </div>
        <div style="text-align:center;min-width:170px">
          <div style="font-weight:700;color:#111;font-size:12px;margin-bottom:32px">توقيع المدرس</div>
          <div style="border-bottom:1.5px dashed #475569;width:170px;margin:0 auto"></div>
        </div>
      </div>
    </body></html>`;

    try {
      await printInPlace({ html });
    } catch {
      alert("تعذر تجهيز مستند الطباعة. يرجى المحاولة مرة أخرى.");
    }
  };

  // ── Toolbar ──
  const toolbar = (
    <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem", alignItems: "center" }}>
      {/* row 1: search + filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", flex: "1 1 100%", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 160px", minWidth: "140px" }}>
          <FiSearch size={14} style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            type="text" value={search} onChange={(e) => { setSearch(e.target.value); onSelectAll([]); }}
            placeholder="بحث بالاسم أو الكود..."
            style={{
              width: "100%", padding: "0.5rem 2.1rem 0.5rem 0.75rem",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.85rem",
              outline: "none", fontFamily: "inherit", direction: "rtl",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
              <FiX size={13} />
            </button>
          )}
        </div>

        <select value={filterGrade} onChange={(e) => { setFilterGrade(e.target.value); onSelectAll([]); }}
          style={{
            flex: "1 1 120px", minWidth: "110px",
            padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
            color: filterGrade ? "var(--color-teal)" : "var(--text-muted)",
            fontSize: "0.83rem", cursor: "pointer", fontFamily: "inherit", direction: "rtl",
          }}>
          <option value="">كل السنوات</option>
          {activeGrades.map((g) => <option key={g.id} value={g.id}>{g.name.replace("الصف ", "")}</option>)}
        </select>

        <select value={filterDay} onChange={(e) => { setFilterDay(e.target.value); onSelectAll([]); }}
          style={{
            flex: "1 1 110px", minWidth: "100px",
            padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
            color: filterDay ? "var(--color-teal)" : "var(--text-muted)",
            fontSize: "0.83rem", cursor: "pointer", fontFamily: "inherit", direction: "rtl",
          }}>
          <option value="">كل الأيام</option>
          {ARABIC_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* row 2: actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", width: "100%" }}>
        <button
          onClick={() => allSelected ? onSelectAll([]) : onSelectAll(allFilteredIds)}
          style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
            color: "var(--text-secondary)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit",
          }}>
          {allSelected ? <RiCheckboxLine size={15} style={{ color: "var(--color-teal)" }} /> : <RiCheckboxBlankLine size={15} />}
          <span>تحديد الكل</span>
        </button>

        {selectedIds.length > 0 && (
          <button onClick={onDeleteSelected}
            style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.5rem 0.75rem", background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px",
              color: "var(--color-danger)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit",
            }}>
            <FiTrash2 size={14} />
            <span>حذف ({selectedIds.length})</span>
          </button>
        )}

        <div style={{ flex: 1 }} />

        <button onClick={handlePrint}
          style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px",
            color: "var(--text-secondary)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit",
          }}>
          <FiPrinter size={14} />
          <span>طباعة</span>
        </button>

        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", overflow: "hidden" }}>
          {(["cards", "schedule"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                display: "flex", alignItems: "center", gap: "0.3rem",
                padding: "0.45rem 0.75rem", border: "none", cursor: "pointer",
                background: view === v ? "rgba(20,184,166,0.15)" : "none",
                color: view === v ? "var(--color-teal)" : "var(--text-muted)",
                fontSize: "0.8rem", fontFamily: "inherit", transition: "all 0.15s",
              }}>
              {v === "cards" ? <FiGrid size={14} /> : <MdOutlineCalendarMonth size={15} />}
              <span>{v === "cards" ? "كروت" : "جدول"}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (groups.length === 0) {
    return (
      <div className="glass-panel p-4 sm:p-6">
        {toolbar}
        <div className="flex flex-col items-center gap-4 py-12 text-slate-500">
          <BiErrorCircle size={48} className="opacity-40 text-slate-400" />
          <p className="text-center text-sm">لا توجد أي مجموعات حالياً. أضف أول مجموعة لبدء تنظيم طلابك.</p>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="glass-panel p-4 sm:p-6">
        {toolbar}
        <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
          <FiSearch size={36} className="opacity-30" />
          <p className="text-center text-sm">لا توجد نتائج مطابقة للبحث أو الفلتر.</p>
        </div>
      </div>
    );
  }

  // ── عرض الجدول الأسبوعي ──
  if (view === "schedule") {
    const usedHours = Array.from(new Set(filtered.map((g) => {
      const mins = timeToMinutes(g.time);
      return mins !== null ? Math.floor(mins / 60) : null;
    }).filter((h): h is number => h !== null))).sort((a, b) => a - b);
    const scheduleHours = usedHours.length > 0 ? usedHours : Array.from({ length: 14 }, (_, i) => i + 7);
    return (
      <div className="glass-panel p-6">
        {toolbar}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", minWidth: "700px" }}>
            <thead>
              <tr>
                <th style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)", fontWeight: 500, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", width: "60px" }}>الوقت</th>
                {ARABIC_DAYS.map((day) => (
                  <th key={day} style={{
                    padding: "0.5rem 0.75rem", color: "var(--text-secondary)", fontWeight: 600,
                    textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)",
                    background: filterDay === day ? "rgba(20,184,166,0.08)" : "none",
                  }}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleHours.map((hour) => (
                <tr key={hour} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "0.4rem 0.5rem", color: "var(--text-muted)", textAlign: "center", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                    {hour % 12 || 12}:00 {hour >= 12 ? "م" : "ص"}
                  </td>
                  {ARABIC_DAYS.map((day) => {
                    const dayGroups = filtered.filter((g) => {
                      const mins = timeToMinutes(g.time);
                      const groupHour = mins !== null ? Math.floor(mins / 60) : -1;
                      return splitDays(g.day_of_week || "").includes(day) && groupHour === hour;
                    });
                    return (
                      <td key={day} style={{ padding: "0.3rem", verticalAlign: "top" }}>
                        {dayGroups.map((g) => {
                          const count = studentCountMap.get(g.id) || 0;
                          const low = count < 5;
                          return (
                            <div key={g.id} onClick={() => onEdit(g)}
                              style={{
                                padding: "0.3rem 0.5rem", borderRadius: "6px", cursor: "pointer",
                                background: low ? "rgba(245,158,11,0.12)" : "rgba(20,184,166,0.1)",
                                border: `1px solid ${low ? "rgba(245,158,11,0.3)" : "rgba(20,184,166,0.25)"}`,
                                color: low ? "#f59e0b" : "var(--color-teal)",
                                fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              <div>{g.name}</div>
                              <div style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.7rem" }}>
                                {formatTimeTo12H(g.time)} · {count} طالب
                              </div>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── عرض الكروت ──
  const gradedGroups = grades
    .map((grade) => ({ grade, items: filtered.filter((g) => g.grade_id === grade.id) }))
    .filter(({ items }) => items.length > 0);
  const gradedIds = new Set(gradedGroups.map(({ grade }) => grade.id));
  const ungrouped = filtered.filter((g) => !g.grade_id || !gradedIds.has(g.grade_id));

  const renderGrid = (items: Group[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((group, i) => (
        <GroupCard
          key={group.id ?? i}
          group={group}
          students={students}
          studentCount={studentCountMap.get(group.id) || 0}
          gradeName={grades.find((g) => g.id === group.grade_id)?.name}
          subTeacher={subTeachers.find((t) => t.id === group.sub_teacher_id)}
          hasCenterMode={hasCenterMode}
          selected={selectedIds.includes(group.id)}
          onSelect={onSelect}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="glass-panel p-4 sm:p-5">
        {toolbar}
        {gradedGroups.length === 0 && ungrouped.length > 0 && (
          <>
            <SectionHeader label="كل المجموعات" count={ungrouped.length} sectionKey="__all__" collapsed={collapsed} onToggle={toggleCollapse} />
            {!collapsed["__all__"] && renderGrid(ungrouped)}
          </>
        )}
      </div>

      {gradedGroups.map(({ grade, items }) => (
        <div key={grade.id} className="glass-panel p-4 sm:p-6">
          <SectionHeader label={grade.name} count={items.length} sectionKey={grade.id} collapsed={collapsed} onToggle={toggleCollapse} />
          {!collapsed[grade.id] && renderGrid(items)}
        </div>
      ))}

      {gradedGroups.length > 0 && ungrouped.length > 0 && (
        <div className="glass-panel p-4 sm:p-6">
          <SectionHeader label="مجموعات أخرى" count={ungrouped.length} muted sectionKey="__other__" collapsed={collapsed} onToggle={toggleCollapse} />
          {!collapsed["__other__"] && renderGrid(ungrouped)}
        </div>
      )}
    </section>
  );
}
