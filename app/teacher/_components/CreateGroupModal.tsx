"use client";

import { useState, useEffect, useMemo } from "react";
import { FolderPlus, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Grade, Group, SubTeacher } from "@/lib/types";
import { GroupsService } from "@/lib/services/groupsService";
import { GradesService } from "@/lib/services/gradesService";
import {
  ARABIC_DAYS, DEFAULT_GRADE_NAMES, formatTimeTo12H, timeToMinutes,
  splitDays, generateUniqueCode, getGroupSuffix, btnBase, btnActive,
} from "@/lib/groupUtils";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  grades: Grade[];
  groups: Group[];
  hasCenterMode: boolean;
  subTeachers: SubTeacher[];
  onCreated: (group: Group) => void;
  onGradeAdded?: (grade: Grade) => void;
  onError: (msg: string) => void;
}

type FormState = {
  groupName: string;
  nameEditedByUser: boolean;
  groupCode: string;
  codeError: string;
  selectedGradeName: string;
  groupDays: string[];
  groupTime: string;
  monthlyPrice: string;
  groupSubTeacherId: string;
  startDate: string;
  formError: string;
};

const INITIAL_FORM: FormState = {
  groupName: "",
  nameEditedByUser: false,
  groupCode: "",
  codeError: "",
  selectedGradeName: "",
  groupDays: ["السبت"],
  groupTime: "",
  monthlyPrice: "",
  groupSubTeacherId: "",
  startDate: "",
  formError: "",
};

const DAYS_AR_IDX: Record<string, number> = {
  "الأحد": 0, "الإثنين": 1, "الثلاثاء": 2, "الأربعاء": 3,
  "الخميس": 4, "الجمعة": 5, "السبت": 6,
};
const MONTHS_AR_SHORT = ["ين","فب","مر","أب","ما","ين","يل","أغ","سب","أك","نو","دي"];
const DAY_NAMES_AR = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

export function CreateGroupModal({
  isOpen, onClose, userId, grades, groups,
  hasCenterMode, subTeachers, onCreated, onGradeAdded, onError,
}: CreateGroupModalProps) {
  const gradeOptions = DEFAULT_GRADE_NAMES;

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  const { groupName, nameEditedByUser, groupCode, codeError,
    selectedGradeName, groupDays, groupTime, monthlyPrice,
    groupSubTeacherId, startDate, formError } = form;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (isOpen) {
      const usedCodes = groups.map((g) => g.code).filter(Boolean) as string[];
      setForm({ ...INITIAL_FORM, groupCode: generateUniqueCode(usedCodes) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleGradeSelect = (name: string) => {
    setField("selectedGradeName", name);
    const match = grades.find((g) => g.name === name);
    const price = match?.monthly_price != null ? String(match.monthly_price) : "";
    if (!nameEditedByUser) {
      const shortName = name.replace("الصف ", "");
      const existingCount = groups.filter(
        (g) => g.grade_id && grades.find((gr) => gr.id === g.grade_id && gr.name === name)
      ).length;
      const suffix = getGroupSuffix(existingCount);
      setForm((prev) => ({ ...prev, selectedGradeName: name, monthlyPrice: price, groupName: `مجموعة ${shortName} ${suffix}` }));
    } else {
      setForm((prev) => ({ ...prev, selectedGradeName: name, monthlyPrice: price }));
    }
  };

  const usedCodes = useMemo(() => groups.map((g) => g.code).filter(Boolean) as string[], [groups]);

  const handleGenerateCode = () => {
    setForm((prev) => ({ ...prev, groupCode: generateUniqueCode(usedCodes), codeError: "" }));
  };

  const handleCodeChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    const startsWithNumber = clean.length > 0 && /^[0-9]/.test(clean);
    setForm((prev) => ({
      ...prev,
      groupCode: clean,
      codeError: startsWithNumber
        ? "يجب أن يبدأ الكود بحرف وليس رقم."
        : clean && usedCodes.includes(clean) ? "هذا الكود مستخدم بالفعل في مجموعة أخرى." : "",
    }));
  };

  const toggleDay = (day: string) => {
    const newDays = groupDays.includes(day) ? groupDays.filter((d) => d !== day) : [...groupDays, day];
    setForm((prev) => ({ ...prev, groupDays: newDays, startDate: "" }));
  };

  const startDateOptions = useMemo(() => {
    if (groupDays.length === 0) return [];
    const targetIndices = groupDays.map((d) => DAYS_AR_IDX[d]).filter((i) => i !== undefined);
    const options: { value: string; label: string }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let offset = -7; offset <= 56; offset++) {
      const d = new Date(today); d.setDate(today.getDate() + offset);
      if (targetIndices.includes(d.getDay())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const value = `${y}-${m}-${day}`;
        const label = `${DAY_NAMES_AR[d.getDay()]} ${d.getDate()} ${MONTHS_AR_SHORT[d.getMonth()]} ${y}`;
        options.push({ value, label });
      }
    }
    return options;
  }, [groupDays]);

  const setError = (msg: string) => setField("formError", msg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setField("formError", "");

    if (!userId) { setError("حدث خطأ في الجلسة، يرجى تحديث الصفحة."); return; }
    if (!groupName.trim()) { setError("يرجى إدخال اسم المجموعة."); return; }
    if (!groupCode.trim()) { setError("يرجى إدخال كود المجموعة أو توليد كود تلقائي."); return; }
    if (codeError) { setError(codeError); return; }
    if (!selectedGradeName) { setError("يرجى اختيار السنة الدراسية."); return; }
    if (groupDays.length === 0) { setError("يرجى اختيار يوم واحد على الأقل."); return; }
    if (!groupTime) { setError("يرجى اختيار وقت المجموعة."); return; }
    if (!monthlyPrice || Number(monthlyPrice) <= 0) { setError("يرجى إدخال سعر الاشتراك الشهري."); return; }

    const duplicate = groups.find((g) => g.name.trim().toLowerCase() === groupName.trim().toLowerCase());
    if (duplicate) { setError(`يوجد مجموعة بنفس الاسم "${duplicate.name}" بالفعل.`); return; }

    if (usedCodes.includes(groupCode.trim().toUpperCase())) {
      setError("كود المجموعة مستخدم بالفعل، اضغط توليد كود جديد."); return;
    }

    const targetMinutes = timeToMinutes(groupTime);
    if (targetMinutes !== null) {
      const conflict = groups.find((g) => {
        // في وضع السنتر، لا يعتبر تعارضاً إذا كان المعلم الفرعي مختلفاً (قاعات منفصلة)
        if (hasCenterMode && groupSubTeacherId && g.sub_teacher_id && g.sub_teacher_id !== groupSubTeacherId) {
          return false;
        }
        const em = timeToMinutes(g.time);
        if (em === null) return false;
        const existingDays = splitDays(g.day_of_week || "");
        if (!existingDays.some((d) => groupDays.includes(d))) return false;
        return Math.abs(targetMinutes - em) < 60;
      });
      if (conflict) {
        setError(`تعارض مع مجموعة "${conflict.name}" (${conflict.day_of_week} - ${formatTimeTo12H(conflict.time)}). يجب فرق ساعة كاملة على الأقل.`);
        return;
      }
    }

    let matchedGrade = grades.find((g) => g.name === selectedGradeName);

    if (!matchedGrade) {
      try {
        matchedGrade = await GradesService.addGrade({ name: selectedGradeName, teacher_id: userId });
        onGradeAdded?.(matchedGrade);
      } catch {
        setError("فشل إضافة السنة الدراسية."); return;
      }
    }

    setLoading(true);
    try {
      const newGroup = await GroupsService.addGroup({
        name: groupName.trim(),
        code: groupCode.trim().toUpperCase(),
        day_of_week: groupDays.join(" ، "),
        time: groupTime,
        monthly_price: Number(monthlyPrice),
        grade_id: matchedGrade?.id ?? null,
        teacher_id: userId ?? undefined,
        sub_teacher_id: hasCenterMode && groupSubTeacherId ? groupSubTeacherId : null,
        start_date: startDate || null,
      });
      onCreated(newGroup);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إنشاء المجموعة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إنشاء مجموعة جديدة" maxWidth="560px">
      <form onSubmit={handleSubmit}>

        <div className="form-group">
          <label className="form-label">السنة الدراسية</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {gradeOptions.map((name) => (
              <button key={name} type="button"
                onClick={() => handleGradeSelect(name)}
                style={selectedGradeName === name ? btnActive : btnBase}>
                {name.replace("الصف ", "")}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 min(180px, 100%)" }} className="form-group">
            <Input
              label="اسم المجموعة"
              id="gName"
              type="text"
              required
              placeholder={selectedGradeName ? `مثال: مجموعة ${selectedGradeName.replace("الصف ", "")} أ` : "اختر السنة الدراسية أولاً"}
              value={groupName}
              onChange={(e) => setForm((prev) => ({ ...prev, groupName: e.target.value, nameEditedByUser: true }))}
              maxLength={60}
            />
          </div>
          <div style={{ flex: "1 1 min(160px, 100%)" }} className="form-group">
            <label className="form-label">
              كود المجموعة
              <span style={{ color: "var(--color-danger)", marginRight: "2px" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  id="gCode"
                  type="text"
                  className={`form-input${codeError ? " border-danger" : ""}`}
                  placeholder="مثال: A12B"
                  value={groupCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  maxLength={4}
                  style={{ fontFamily: "monospace", letterSpacing: "0.05em", width: "100%" }}
                  required
                />
                {codeError && (
                  <span style={{ color: "var(--color-danger)", fontSize: "0.75rem", marginTop: "0.2rem", display: "block" }}>
                    {codeError}
                  </span>
                )}
                {!codeError && groupCode && (
                  <span style={{ color: "var(--color-teal)", fontSize: "0.75rem", marginTop: "0.2rem", display: "block" }}>
                    ✓ الكود متاح
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleGenerateCode}
                title="توليد كود عشوائي"
                style={{ ...btnBase, padding: "0.6rem", flexShrink: 0, color: "var(--color-teal)", border: "1px solid rgba(20,184,166,0.3)" }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
              لترتيب الطلاب وتمييز المجموعة
            </p>
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <Input
                label="الاشتراك الشهري"
                id="gPrice"
                type="number"
                min="1"
                required
                placeholder="مثال: 500"
                value={monthlyPrice}
                onChange={(e) => setField("monthlyPrice", e.target.value)}
                leftIcon={<span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>ج.م</span>}
              />
            </div>
          </div>
          {selectedGradeName && grades.find((g) => g.name === selectedGradeName)?.monthly_price != null && (
            <p style={{ fontSize: "0.78rem", color: "var(--color-teal)", margin: "0.3rem 0 0" }}>
              💰 تم تحديد السعر تلقائياً من السنة الدراسية
            </p>
          )}
        </div>

        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <label className="form-label" style={{ margin: 0 }}>أيام المجموعة</label>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {[
                { label: "س-إ-أ", days: ["السبت", "الإثنين", "الأربعاء"] },
                { label: "ح-ث-خ", days: ["الأحد", "الثلاثاء", "الخميس"] },
              ].map(({ label, days }) => (
                <button key={label} type="button" onClick={() => setField("groupDays", days)}
                  style={{ ...btnBase, fontSize: "0.75rem", padding: "0.2rem 0.55rem" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {ARABIC_DAYS.map((day) => (
              <button key={day} type="button" onClick={() => toggleDay(day)}
                style={groupDays.includes(day) ? btnActive : btnBase}>
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <Input
            label="وقت المجموعة"
            id="gTime"
            type="time"
            required
            value={groupTime}
            onChange={(e) => setField("groupTime", e.target.value)}
            style={{ direction: "ltr", textAlign: "right" }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            تاريخ بداية المجموعة
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginRight: "6px" }}>اختياري</span>
          </label>
          {groupDays.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>اختر أيام المجموعة أولاً</p>
          ) : (
            <>
              <select
                className="form-input"
                value={startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                style={{ padding: "0.7rem 0.5rem" }}
              >
                <option value="">— من أول حصة فعلية للمجموعة —</option>
                {startDateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
                سيتم تجاهل أي حصص قبل هذا التاريخ في تقارير الغياب
              </p>
            </>
          )}
        </div>

        {hasCenterMode && (
          <div className="form-group">
            <label className="form-label">المعلم (اختياري)</label>
            <select className="form-input" value={groupSubTeacherId}
              onChange={(e) => setField("groupSubTeacherId", e.target.value)}
              style={{ padding: "0.7rem 0.5rem" }}>
              <option value="">-- المركز بالكامل --</option>
              {subTeachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}



        {(groupName || selectedGradeName || groupTime) && (
          <div style={{
            padding: "0.8rem 1rem", marginBottom: "0.5rem",
            background: "rgba(20,184,166,0.06)",
            border: "1px solid rgba(20,184,166,0.15)",
            borderRadius: "10px", fontSize: "0.85rem",
            color: "var(--text-secondary)", lineHeight: "1.8",
          }}>
            <span style={{ color: "var(--color-teal)", fontWeight: 600 }}>ملخص: </span>
            {groupName && <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{groupName}</span>}
            {groupCode && <span style={{ fontFamily: "monospace", color: "var(--text-muted)" }}> [{groupCode}]</span>}
            {selectedGradeName && <span> — {selectedGradeName.replace("الصف ", "")}</span>}
            {groupDays.length > 0 && <span> — {groupDays.join("، ")}</span>}
            {groupTime && <span> — {formatTimeTo12H(groupTime)}</span>}
            {monthlyPrice && <span style={{ color: "var(--color-teal)" }}> — {monthlyPrice} ج/شهر</span>}
          </div>
        )}

        {formError && (
          <div style={{
            padding: "0.65rem 0.9rem",
            marginBottom: "0.75rem",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px",
            color: "var(--color-danger)",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}>
            <span>⚠️</span>
            <span>{formError}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem", flexWrap: "wrap" }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: "1 1 80px" }}>إلغاء</Button>
          <Button type="submit" variant="primary" isLoading={loading} leftIcon={<FolderPlus size={16} />} style={{ flex: "2 1 120px" }}>
            إنشاء مجموعة
          </Button>
        </div>
      </form>
    </Modal>
  );
}
