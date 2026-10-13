"use client";

import { useState, useEffect } from "react";
import { Users, Search } from "lucide-react";
import { StudentsService } from "@/lib/services/studentsService";
import { GroupsService } from "@/lib/services/groupsService";
import { Student, Group } from "@/lib/types";
import { Toast } from "@/components/ui/Toast";

const PAGE_SIZE = 30;

export default function CenterStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load groups once
  useEffect(() => {
    GroupsService.getGroupsByTeacherId()
      .then(setGroups)
      .catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    StudentsService.getStudentsPaginated({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      group_id: filterGroupId !== "all" ? filterGroupId : undefined,
    })
      .then(res => { setStudents(res.students); setTotal(res.total); })
      .catch(() => setToast({ message: "فشل تحميل الطلاب", type: "error" }))
      .finally(() => setLoading(false));
  }, [page, search, filterGroupId]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-7 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-[14px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-bold bg-gradient-to-l from-slate-400 to-white bg-clip-text text-transparent">
              الطلاب
            </h1>
            <p className="text-sm text-slate-500">إجمالي {total} طالب</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel panel-content mb-5" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={15} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="form-input"
            style={{ paddingRight: "2.25rem", margin: 0 }}
            placeholder="بحث بالاسم أو الكود..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          style={{ flex: "1 1 160px", margin: 0 }}
          value={filterGroupId}
          onChange={e => { setFilterGroupId(e.target.value); setPage(1); }}
        >
          <option value="all">كل المجموعات</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="loading-wrapper"><div className="spinner" /></div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>لا يوجد طلاب</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="students-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>#</th>
                  <th style={{ textAlign: "center" }}>الكود</th>
                  <th>الاسم</th>
                  <th>المجموعة</th>
                  <th>هاتف ولي الأمر</th>
                  <th style={{ textAlign: "center" }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const group = groups.find(g => g.id === s.group_id);
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td style={{ textAlign: "center", fontFamily: "monospace", color: "var(--text-secondary)" }}>{s.code || "—"}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{group?.name || "—"}</td>
                      <td style={{ color: "var(--text-secondary)", direction: "ltr", textAlign: "right" }}>{s.parent_phone || "—"}</td>
                      <td style={{ textAlign: "center" }}>
                        {s.is_suspended ? (
                          <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.6rem", borderRadius: "999px", background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>موقوف</span>
                        ) : (
                          <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.6rem", borderRadius: "999px", background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }}>نشط</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: "8px", color: page === 1 ? "var(--text-muted)" : "var(--color-teal)", cursor: page === 1 ? "not-allowed" : "pointer", padding: "0.35rem 0.9rem", fontSize: "0.82rem", fontWeight: 600 }}
            >السابق</button>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>صفحة {page} من {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", borderRadius: "8px", color: page >= totalPages ? "var(--text-muted)" : "var(--color-teal)", cursor: page >= totalPages ? "not-allowed" : "pointer", padding: "0.35rem 0.9rem", fontSize: "0.82rem", fontWeight: 600 }}
            >التالي</button>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
