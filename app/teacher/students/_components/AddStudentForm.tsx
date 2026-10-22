"use client";
import { validateStudentName } from "@/lib/utils/studentName";

import { useState, useRef, useEffect } from "react";
import { UserPlus, Plus, ChevronDown, Loader2, Upload, Users } from "lucide-react";
import { Student, Group, Grade } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FamilyMatchBox, FamilyMatch } from "./FamilyMatchBox";
import { BulkImportModal } from "./BulkImportModal";

const formatTimeTo12H = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

interface CenterSuggestion {
  student_id: string;
  name: string;
  center_student_code: string;
  teacher_name: string;
  group_name: string | null;
}

interface Props {
  grades: Grade[];
  groupsProp?: Group[];
  hasCenterMode: boolean;
  isCenterContext?: boolean; // true لو المدرس داخل سنتر
  currentTeacherId?: string; // للـ center match API
  subTeachers: { id: string; name: string }[];
  isLoading: boolean;
  activeMonths?: number[];
  onSubmit: (data: {
    name: string;
    gradeId: string;
    groupId: string;
    parentPhone: string;
    subTeacherId: string;
    customMonthlyPrice: number | null;
    subscriptionStartMonth: number;
    subscriptionStartYear: number;
    join_family_id?: string;
    create_new_family?: boolean;
    center_student_code?: string; // "new" أو كود موجود
  }) => Promise<boolean | void | {error: string}>;
  onBulkDone: (students: Student[]) => void;
}

const arabicMonthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export function AddStudentForm({ grades, groupsProp, hasCenterMode, isCenterContext, currentTeacherId, subTeachers, isLoading, activeMonths, onSubmit, onBulkDone }: Props) {
  const now = new Date();
  const [name, setName] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [subTeacherId, setSubTeacherId] = useState("");
  const [subscriptionStartMonth, setSubscriptionStartMonth] = useState(now.getMonth() + 1);
  const [subscriptionStartYear, setSubscriptionStartYear] = useState(now.getFullYear());
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("action") === "new") return false;
    return typeof window !== "undefined" && window.innerWidth <= 768;
  });
  const [phoneError, setPhoneError] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const [familyMatch, setFamilyMatch] = useState<FamilyMatch | null>(null);
  const [familyLookupLoading, setFamilyLookupLoading] = useState(false);
  const [familyChoice, setFamilyChoice] = useState<"join" | "skip">("join");

  // Center student matching
  const [centerSuggestions, setCenterSuggestions] = useState<CenterSuggestion[]>([]);
  const [centerSuggestionsLoading, setCenterSuggestionsLoading] = useState(false);
  const [selectedCenterCode, setSelectedCenterCode] = useState<string | null>(null); // null = لم يختار بعد

  const phoneDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameDebounce  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centerDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookupVersion = useRef(0);
  const centerVersion = useRef(0);
  const [nameError, setNameError] = useState("");
  const [gradeTouched, setGradeTouched] = useState(false);
  const [yearTouched, setYearTouched] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  useEffect(() => () => {
    lookupVersion.current++; centerVersion.current++;
    [phoneDebounce, nameDebounce, centerDebounce].forEach(timer => { if (timer.current) clearTimeout(timer.current); });
  }, []);
  const groups = groupsProp || [];
  const gradeError = gradeTouched && !grades.some(g => g.id === gradeId) ? "اختر السنة الدراسية أولًا." : "";
  const yearError = yearTouched && (!Number.isInteger(subscriptionStartYear) || subscriptionStartYear < 2020 || subscriptionStartYear > 2040) ? "أدخل سنة صحيحة من 2020 إلى 2040." : "";
  const groupError = groupId && !groups.some(g => g.id === groupId && g.grade_id === gradeId) ? "اختر مجموعة تابعة للسنة الدراسية المحددة." : "";

  const validatePhone = (val: string) => {
    if (!val.trim()) return "رقم هاتف ولي الأمر مطلوب.";
    if (!/^01\d{9}$/.test(val)) return "يجب أن يكون 11 رقمًا ويبدأ بـ 01";
    return "";
  };

  const triggerLookup = (phone: string, currentName: string) => {
    const version = ++lookupVersion.current;
    if (!/^01\d{9}$/.test(phone)) { setFamilyMatch(null); setFamilyLookupLoading(false); return; }
    setFamilyLookupLoading(true);
    (async () => {
      try {
        const res = await StudentsService.lookupFamily(phone, currentName);
        if (version === lookupVersion.current) setFamilyMatch(res.family);
      } catch {
        if (version === lookupVersion.current) setFamilyMatch(null);
      } finally {
        if (version === lookupVersion.current) setFamilyLookupLoading(false);
      }
    })();
  };

  const triggerCenterMatch = (phone: string, currentGradeId: string) => {
    const version = ++centerVersion.current;
    if (!isCenterContext || !phone || !/^01\d{9}$/.test(phone)) {
      setCenterSuggestions([]);
      return;
    }
    setCenterSuggestionsLoading(true);
    (async () => {
      try {
        const params = new URLSearchParams({ parent_phone: phone });
        if (currentGradeId) params.set("grade_id", currentGradeId);
        if (currentTeacherId) params.set("teacher_id", currentTeacherId);
        const res = await api.get<{ suggestions: CenterSuggestion[] }>(`/students/center-match?${params}`);
        if (version !== centerVersion.current) return;
        setCenterSuggestions(res?.suggestions ?? []);
        setSelectedCenterCode(null); // ريست الاختيار عند كل بحث جديد
      } catch {
        if (version === centerVersion.current) setCenterSuggestions([]);
      } finally {
        if (version === centerVersion.current) setCenterSuggestionsLoading(false);
      }
    })();
  };

  const handlePhoneChange = (val: string) => {
    setSubmitError("");
    lookupVersion.current++; centerVersion.current++;
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    setParentPhone(val);
    setPhoneError(validatePhone(val));
    setFamilyMatch(null); setFamilyChoice("join");
    setCenterSuggestions([]); setSelectedCenterCode(null);
    if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
    phoneDebounce.current = setTimeout(() => triggerLookup(val, name), 600);
    if (centerDebounce.current) clearTimeout(centerDebounce.current);
    centerDebounce.current = setTimeout(() => triggerCenterMatch(val, gradeId), 700);
  };

  const handleNameChange = (val: string) => {
    lookupVersion.current++; setNameError(validateStudentName(val)); setSubmitError("");
    if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
    setName(val);
    setFamilyMatch(null); setFamilyChoice("join");
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    nameDebounce.current = setTimeout(() => triggerLookup(parentPhone, val), 700);
  };

  const resetForm = () => {
    lookupVersion.current++; centerVersion.current++;
    [phoneDebounce, nameDebounce, centerDebounce].forEach(timer => { if (timer.current) clearTimeout(timer.current); });
    setName(""); setGradeId(""); setGroupId(""); setParentPhone("");
    setSubTeacherId(""); setPhoneError("");
    setNameError(""); setGradeTouched(false); setYearTouched(false); setSubmitError("");
    setFamilyMatch(null); setFamilyChoice("join");
    setCenterSuggestions([]); setSelectedCenterCode(null);
    setSubscriptionStartMonth(new Date().getMonth() + 1);
    setSubscriptionStartYear(new Date().getFullYear());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || submitting.current) return;
    setSubmitError(""); setGradeTouched(true); setYearTouched(true);
    const nameError = validateStudentName(name);
    setNameError(nameError);
    const err = validatePhone(parentPhone);
    setPhoneError(err);
    if (nameError || err || !grades.some(g => g.id === gradeId) || groupError || !Number.isInteger(subscriptionStartYear) || subscriptionStartYear < 2020 || subscriptionStartYear > 2040) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (parentPhone && !/^01\d{9}$/.test(parentPhone)) return;

    const extra: { join_family_id?: string; create_new_family?: boolean; center_student_code?: string } = {};
    if (familyMatch && familyChoice === "join") {
      if (familyMatch.familyId) extra.join_family_id = familyMatch.familyId;
      else extra.create_new_family = true;
    }
    // center matching: لو اختار طالب موجود → مرر الكود، لو اختار "جديد" → مرر "new"
    if (isCenterContext && centerSuggestions.length > 0) {
      extra.center_student_code = selectedCenterCode ?? "new";
    }

    submitting.current = true;
    try {
      const saved = await onSubmit({ name: name.trim().replace(/\s+/g, " "), gradeId, groupId, parentPhone, subTeacherId, customMonthlyPrice: null, subscriptionStartMonth, subscriptionStartYear, ...extra });
      if (saved === false || (saved && typeof saved === "object")) {
        setSubmitError(saved && typeof saved === "object" ? saved.error : "تعذرت إضافة الطالب. راجع البيانات وحاول مرة أخرى."); return;
      }
      resetForm();
    } catch (error) { setSubmitError(error instanceof Error ? error.message : "تعذرت إضافة الطالب. حاول مرة أخرى."); }
    finally { submitting.current = false; }
  };

  const gradeIdsWithGroups = new Set(groups.map((g) => g.grade_id).filter(Boolean));
  const availableGrades = grades;
  const filteredGroups = groups
    .filter((g) => !gradeId || g.grade_id === gradeId)
    .filter((g) => !hasCenterMode || !subTeacherId || g.sub_teacher_id === subTeacherId);

  return (
    <>
      <div className="glass-panel panel-content">
        <h2
          className="panel-title"
          onClick={() => setCollapsed((c) => !c)}
          style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserPlus size={18} className="stat-icon-teal" style={{ background: "none", border: "none" }} />
            <span>إضافة طالب جديد</span>
          </span>
          <ChevronDown size={18} style={{ transition: "transform 0.25s", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", color: "var(--text-muted)" }} className="md-hide" />
        </h2>

        <div style={{ display: collapsed ? "none" : "flex", flexDirection: "column", gap: "1rem" }}>
          {/* زر الاستيراد الجماعي من CSV */}
          <button
            type="button"
            onClick={() => setShowBulk(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px 12px", borderRadius: "8px", border: "1px dashed rgba(20,184,166,0.5)", background: "rgba(20,184,166,0.08)", color: "var(--color-teal)", fontSize: "0.83rem", cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}
            className="hover:bg-teal-500/15"
          >
            <Upload size={14} />
            استيراد طلاب من CSV (إضافة جماعية)
          </button>

          <form ref={formRef} noValidate onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Input label="اسم الطالب" error={nameError} onBlur={() => setNameError(validateStudentName(name))} required placeholder="الاسم الكامل للطالب" value={name} maxLength={120} onChange={(e) => handleNameChange(e.target.value)} />

            {/* Phone + Family Detection */}
            <div className="form-group">
              <div style={{ position: "relative" }}>
                <Input
                  label="رقم هاتف ولي الأمر"
                  required
                  type="tel"
                  placeholder="01012345678"
                  value={parentPhone}
                  error={phoneError}
                  onBlur={() => setPhoneError(validatePhone(parentPhone))}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  style={{ direction: "ltr", textAlign: "right" }}
                />
                {familyLookupLoading && (
                  <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", marginTop: "10px" }}>
                    <Loader2 size={15} style={{ color: "var(--color-teal)", animation: "spin 1s linear infinite" }} />
                  </span>
                )}
              </div>
              <FamilyMatchBox familyMatch={familyMatch} familyLookupLoading={familyLookupLoading} familyChoice={familyChoice} parentPhone={parentPhone} onChoiceChange={setFamilyChoice} />

              {/* Center Student Suggestion */}
              {isCenterContext && centerSuggestions.length > 0 && (
                <div style={{ marginTop: "0.75rem", padding: "0.85rem", borderRadius: 10, border: "1px solid rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem" }}>
                    <Users size={15} color="#14b8a6" />
                    <span style={{ color: "#14b8a6", fontWeight: 700, fontSize: "0.8rem" }}>هل هذا الطالب موجود بالفعل في السنتر؟</span>
                    {centerSuggestionsLoading && <Loader2 size={13} style={{ color: "#14b8a6", animation: "spin 1s linear infinite" }} />}
                  </div>
                  {centerSuggestions.map(s => (
                    <label key={s.center_student_code} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.6rem", borderRadius: 8, cursor: "pointer", background: selectedCenterCode === s.center_student_code ? "rgba(20,184,166,0.12)" : "transparent", border: selectedCenterCode === s.center_student_code ? "1px solid rgba(20,184,166,0.4)" : "1px solid transparent", marginBottom: "0.35rem" }}>
                      <input type="radio" name="center_match" value={s.center_student_code} checked={selectedCenterCode === s.center_student_code} onChange={() => setSelectedCenterCode(s.center_student_code)} style={{ accentColor: "#14b8a6" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>{s.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>
                          {s.teacher_name}{s.group_name ? ` · ${s.group_name}` : ""}
                        </div>
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#14b8a6", background: "rgba(20,184,166,0.1)", padding: "2px 7px", borderRadius: 6 }}>{s.center_student_code}</span>
                    </label>
                  ))}
                  <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.6rem", borderRadius: 8, cursor: "pointer", background: selectedCenterCode === "new" ? "rgba(99,102,241,0.1)" : "transparent", border: selectedCenterCode === "new" ? "1px solid rgba(99,102,241,0.35)" : "1px solid transparent" }}>
                    <input type="radio" name="center_match" value="new" checked={selectedCenterCode === "new"} onChange={() => setSelectedCenterCode("new")} style={{ accentColor: "#818cf8" }} />
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem" }}>لا، هذا طالب جديد مختلف</span>
                  </label>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="new-student-grade" className="form-label">السنة الدراسية</label>
              <select id="new-student-grade" aria-invalid={!!gradeError} aria-describedby={gradeError ? "new-student-grade-error" : undefined} onBlur={() => setGradeTouched(true)} required className="form-input" value={gradeId} onChange={(e) => {
                setGradeTouched(true); setSubmitError("");
                setGradeId(e.target.value);
                centerVersion.current++;
                setCenterSuggestions([]); setSelectedCenterCode(null);
                setGroupId("");
                if (centerDebounce.current) clearTimeout(centerDebounce.current);
                centerDebounce.current = setTimeout(() => triggerCenterMatch(parentPhone, e.target.value), 300);
              }}>
                <option value="">-- اختر السنة الدراسية --</option>
                {availableGrades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              {gradeError && <span id="new-student-grade-error" role="alert" className="text-sm text-red-400">{gradeError}</span>}
            </div>

            {hasCenterMode && (
              <div className="form-group">
                <label className="form-label">المعلم</label>
                <select className="form-input" value={subTeacherId} onChange={(e) => { setSubTeacherId(e.target.value); setGroupId(""); }}>
                  <option value="">-- اختر المعلم --</option>
                  {subTeachers
                    .filter((st) => !gradeId || groups.some((g) => g.grade_id === gradeId && g.sub_teacher_id === st.id))
                    .map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="new-student-group" className="form-label">المجموعة (اختياري)</label>
              <select id="new-student-group" disabled={!gradeId} aria-invalid={!!groupError} aria-describedby={groupError ? "new-student-group-error" : undefined} className="form-input" value={groupId} onChange={(e) => {setGroupId(e.target.value); setSubmitError("");}}>
                <option value="">بدون مجموعة</option>
                {filteredGroups.map((g, i) => (
                  <option key={g.id ?? i} value={g.id}>
                    {g.name} {g.is_private ? "(خاصة) " : ""}({g.day_of_week} - {formatTimeTo12H(g.time)})
                  </option>
                ))}
              </select>
              {groupError && <span id="new-student-group-error" role="alert" className="text-sm text-red-400">{groupError}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">تاريخ بداية هذا الطالب</label>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", marginTop: "-0.1rem" }}>
                الشهر الأول اللي هيبدأ يدفع فيه الطالب
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select className="form-input" value={subscriptionStartMonth} onChange={(e) => setSubscriptionStartMonth(Number(e.target.value))} style={{ flex: 2 }}>
                  {(activeMonths && activeMonths.length > 0 ? [...new Set(activeMonths)].sort((a, b) => a - b) : Array.from({length:12},(_,i)=>i+1)).map((m) => (
                    <option key={m} value={m}>{arabicMonthNames[m - 1]}</option>
                  ))}
                </select>
                <input aria-label="سنة بداية الاشتراك" aria-invalid={!!yearError} aria-describedby={yearError ? "new-student-year-error" : undefined} onBlur={() => setYearTouched(true)} type="number" className="form-input" value={subscriptionStartYear || ""} onChange={(e) => {setYearTouched(true); setSubmitError(""); setSubscriptionStartYear(Number(e.target.value));}} min={2020} max={2040} style={{ flex: 1, direction: "ltr" }} />
              </div>
              {yearError && <span id="new-student-year-error" role="alert" className="text-sm text-red-400">{yearError}</span>}
            </div>

            {submitError && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{submitError}</div>}
            <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Plus size={18} />} style={{ width: "100%", marginTop: "0.5rem" }}>
              إضافة الطالب
            </Button>
          </form>
        </div>
      </div>

      {showBulk && (
        <BulkImportModal
          grades={grades}
          groups={groups}
          activeMonths={activeMonths || [9,10,11,12,1,2,3,4,5]}
          onClose={() => setShowBulk(false)}
          onDone={(inserted) => {
            setShowBulk(false);
            onBulkDone(inserted);
          }}
        />
      )}
    </>
  );
}
