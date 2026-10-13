import { useState } from "react";
import { Wallet, Tag, Users, AlertTriangle, Percent, X, Check } from "lucide-react";
import { FiEdit2 } from "react-icons/fi";
import { Student, Group } from "@/lib/types";
import { StudentsService } from "@/lib/services/studentsService";
import { SubscriptionsService } from "@/lib/services/subscriptionsService";

interface Props {
  student: Student;
  group?: Group;
  onSaved: (updated: Partial<Student>) => void;
}

export function StudentFinancialCard({ student, group, onSaved }: Props) {
  const [discountPct, setDiscountPct] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [bookDiscountPct, setBookDiscountPct] = useState("");
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountSaving, setDiscountSaving] = useState(false);

  const [editingFamilyDiscount, setEditingFamilyDiscount] = useState(false);
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [subPct, setSubPct] = useState("");
  const [subReason, setSubReason] = useState("");
  const [bookPct, setBookPct] = useState("");
  const [bookReason, setBookReason] = useState("");
  const [familySaving, setFamilySaving] = useState(false);
  const [familyError, setFamilyError] = useState("");

  const hasFamilyDiscount =
    (student.family_discount_percent != null && student.family_discount_percent > 0) ||
    (student.family_book_discount_percent != null && student.family_book_discount_percent > 0);

  const basePrice = student.custom_monthly_price ?? group?.monthly_price ?? null;

const openDiscountEdit = () => {
    setDiscountPct(student.discount_value != null ? String(student.discount_value) : "");
    setDiscountReason(student.discount_reason || "");
    setBookDiscountPct(student.book_discount_value != null ? String(student.book_discount_value) : "");
    setEditingDiscount(true);
  };

  const handleSaveDiscount = async () => {
    const val = discountPct === "" ? 0 : Number(discountPct);
    const bval = bookDiscountPct === "" ? null : Number(bookDiscountPct);
    if (isNaN(val) || val < 0 || val > 100) return;
    if (bval !== null && (isNaN(bval) || bval < 0 || bval > 100)) return;
    setDiscountSaving(true);
    try {
      const updated = await StudentsService.updateStudent(student.id, {
        discount_value: val,
        discount_reason: discountReason.trim() || undefined,
        apply_discount_to_books: bval != null && bval > 0,
        book_discount_value: bval,
      });
      onSaved(updated);
      setEditingDiscount(false);
    } finally {
      setDiscountSaving(false);
    }
  };

  const openFamilyDiscountEdit = () => {
    if (!student.sibling_family_id) return;
    if (hasFamilyDiscount) { setConfirmOverride(true); return; }
    startFamilyEdit();
  };

  const startFamilyEdit = () => {
    setSubPct(student.family_discount_percent != null ? String(student.family_discount_percent) : "");
    setSubReason(student.family_discount_reason || "");
    setBookPct(student.family_book_discount_percent != null ? String(student.family_book_discount_percent) : "");
    setBookReason(student.family_book_discount_reason || "");
    setConfirmOverride(false);
    setFamilyError("");
    setEditingFamilyDiscount(true);
  };

  const handleSaveFamilyDiscount = async () => {
    if (!student.sibling_family_id) return;
    const pct = subPct === "" ? null : Number(subPct);
    const bpct = bookPct === "" ? null : Number(bookPct);
    if (pct !== null && (isNaN(pct) || pct < 0 || pct > 100)) { setFamilyError("نسبة خصم الاشتراك يجب أن تكون بين 0 و 100"); return; }
    if (bpct !== null && (isNaN(bpct) || bpct < 0 || bpct > 100)) { setFamilyError("نسبة خصم الكتب يجب أن تكون بين 0 و 100"); return; }
    setFamilySaving(true);
    setFamilyError("");
    try {
      await StudentsService.setFamilyDiscount(student.sibling_family_id, pct, subReason, bpct, bookReason);
      await SubscriptionsService.fixAmounts();
      onSaved({
        family_discount_percent: pct,
        family_discount_reason: subReason.trim() || null,
        family_book_discount_percent: bpct,
        family_book_discount_reason: bookReason.trim() || null,
      });
      setEditingFamilyDiscount(false);
    } catch {
      setFamilyError("فشل حفظ الخصم العائلي");
    } finally {
      setFamilySaving(false);
    }
  };

  // حساب السعر بعد الخصم
  const subDiscountPct = student.family_discount_percent ?? 0;
  const fixedDiscountPct = student.discount_value ?? 0;
  const effectiveDiscountPct = subDiscountPct > 0 ? subDiscountPct : fixedDiscountPct;
  const priceAfterDiscount = basePrice != null && effectiveDiscountPct > 0
    ? Math.round(basePrice * (1 - effectiveDiscountPct / 100))
    : basePrice;

  return (
    <div className="glass-panel panel-content">
      <h3 className="panel-title">
        <Wallet size={16} style={{ color: "var(--color-teal)" }} />
        <span>الإعدادات المالية</span>
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        {/* ── السعر الفعلي summary ── */}
        {basePrice != null && (
          <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--color-teal)", fontWeight: 600, marginBottom: "0.2rem" }}>
                  {group ? `سعر مجموعة "${group.name}"` : "السعر الأساسي"}
                  {student.custom_monthly_price && <span style={{ color: "var(--text-muted)", marginRight: "4px" }}>· مخصص</span>}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
                  {(subDiscountPct > 0 || fixedDiscountPct > 0) ? (
                    <>
                      <span style={{ fontSize: "1rem", color: "var(--text-muted)", textDecoration: "line-through" }}>{basePrice} ج</span>
                      <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-teal)" }}>{priceAfterDiscount} ج</span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>/ شهر</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-teal)" }}>{basePrice}</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>جنيه / شهر</span>
                    </>
                  )}
                </div>
              </div>

            </div>


          </div>
        )}

        {/* ── الخصم الثابت ── */}
        <div style={{ padding: "1rem", borderRadius: "10px", background: "rgba(245,158,11,0.05)", border: `1px solid ${subDiscountPct > 0 && fixedDiscountPct > 0 ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.15)"}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editingDiscount ? "0.75rem" : (student.discount_value ? "0.5rem" : 0) }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Tag size={14} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fcd34d" }}>الخصم الثابت</span>
              {subDiscountPct > 0 && fixedDiscountPct > 0 && (
                <span style={{ fontSize: "0.68rem", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", padding: "1px 6px" }}>⚠ مش بيتطبق دلوقتي — الخصم العائلي هو اللي شغال</span>
              )}
            </div>
            {!editingDiscount && (
              <button onClick={openDiscountEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#f59e0b", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", padding: "2px 8px", borderRadius: "6px", fontFamily: "inherit" }}>
                <FiEdit2 size={12} /> {student.discount_value ? "تعديل" : "إضافة"}
              </button>
            )}
          </div>

          {editingDiscount ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* خصم الاشتراك */}
              <p className="sib-disc-label">خصم الاشتراك %</p>
              <div className="sib-disc-presets">
                {[5, 10, 15, 20, 25, 50].map((p) => (
                  <button key={p} className={`sib-disc-preset${discountPct === String(p) ? " sib-disc-preset--active" : ""}`} onClick={() => setDiscountPct(String(p))}>{p}%</button>
                ))}
              </div>
              <div className="sib-disc-input-row">
                <input type="number" min={0} max={100} value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} placeholder="أو أدخل نسبة مخصصة..." className="sib-disc-input" />
                <span className="sib-disc-pct-label">%</span>
              </div>
              <input type="text" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} placeholder="سبب الخصم (اختياري)..." className="sib-disc-input" />
              {discountPct && Number(discountPct) > 0 && basePrice != null && (
                <div className="sib-disc-preview">
                  <Percent size={13} />
                  <span>
                    {basePrice} ج ← <strong>{Math.round(basePrice * (1 - Number(discountPct) / 100))} ج</strong> بعد خصم {discountPct}%
                  </span>
                </div>
              )}

              {/* خصم الكتب */}
              <div style={{ height: "1px", background: "var(--border-color)", margin: "0.25rem 0" }} />
              <p className="sib-disc-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                خصم الكتب <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400 }}>(اختياري)</span>
              </p>
              <div className="sib-disc-presets">
                {[10, 20, 25, 50, 75, 100].map((p) => (
                  <button key={p} className={`sib-disc-preset${bookDiscountPct === String(p) ? " sib-disc-preset--active" : ""}`} onClick={() => setBookDiscountPct(String(p))}>{p}%</button>
                ))}
              </div>
              <div className="sib-disc-input-row">
                <input type="number" min={0} max={100} value={bookDiscountPct} onChange={(e) => setBookDiscountPct(e.target.value)} placeholder="نسبة خصم الكتب..." className="sib-disc-input" />
                <span className="sib-disc-pct-label">%</span>
              </div>
              {bookDiscountPct && Number(bookDiscountPct) > 0 && (
                <div className="sib-disc-preview" style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.2)" }}>
                  <Percent size={13} style={{ color: "#818cf8" }} />
                  <span style={{ color: "#818cf8" }}>خصم كتب <strong>{bookDiscountPct}%</strong> على الطالب</span>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                <button onClick={() => { setDiscountPct(""); setDiscountReason(""); setBookDiscountPct(""); }} disabled={discountSaving} style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem" }}>
                  إزالة الخصم
                </button>
                <button onClick={handleSaveDiscount} disabled={discountSaving} style={{ flex: 2, padding: "0.5rem", borderRadius: "8px", background: "#f59e0b", border: "none", color: "#000", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <Check size={13} /> {discountSaving ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          ) : (
            student.discount_value ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <div style={{ fontSize: "0.88rem", color: "#fcd34d" }}>
                  اشتراك: <strong>{student.discount_value}%</strong>
                  {student.discount_reason && <span style={{ color: "var(--text-muted)", marginRight: "6px" }}>· {student.discount_reason}</span>}
                </div>
                {student.apply_discount_to_books && student.book_discount_value ? (
                  <div style={{ fontSize: "0.88rem", color: "#818cf8" }}>كتب: <strong>{student.book_discount_value}%</strong></div>
                ) : null}
              </div>
            ) : (
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>لا يوجد خصم ثابت</span>
            )
          )}
        </div>

        {/* ── خصم الأخوات ── */}
        {student.sibling_family_id && (
          <div style={{ padding: "1rem", borderRadius: "10px", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Users size={14} style={{ color: "#a78bfa" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#a78bfa" }}>خصم عائلي</span>
                {student.sibling_family_name && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>· {student.sibling_family_name}</span>
                )}
              </div>
              {!editingFamilyDiscount && !confirmOverride && (
                <button onClick={openFamilyDiscountEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#a78bfa", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", padding: "2px 8px", borderRadius: "6px", fontFamily: "inherit" }}>
                  <Percent size={12} /> {hasFamilyDiscount ? "تعديل الخصم" : "إضافة خصم"}
                </button>
              )}
            </div>

            {confirmOverride && (
              <div style={{ padding: "0.75rem", borderRadius: "8px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.6rem" }}>
                  <AlertTriangle size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />
                  <p style={{ fontSize: "0.8rem", color: "#fcd34d", margin: 0, lineHeight: 1.5 }}>
                    الطالب ده عنده خصم أخوات بالفعل. لو عدّلت هنا هيتغير الخصم لكل أفراد العائلة. تكمل؟
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => setConfirmOverride(false)} style={{ flex: 1, padding: "0.4rem 0.6rem", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem" }}>لأ</button>
                  <button onClick={startFamilyEdit} style={{ flex: 2, padding: "0.4rem 0.6rem", borderRadius: "6px", background: "#f59e0b", border: "none", color: "#000", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 600 }}>أيوه، عدّل الخصم</button>
                </div>
              </div>
            )}

            {editingFamilyDiscount ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <p className="sib-disc-label">نسبة الخصم %</p>
                <div className="sib-disc-presets">
                  {[5, 10, 15, 20, 25, 50].map((p) => (
                    <button key={p} className={`sib-disc-preset${subPct === String(p) ? " sib-disc-preset--active" : ""}`} onClick={() => setSubPct(String(p))}>{p}%</button>
                  ))}
                </div>
                <div className="sib-disc-input-row">
                  <input type="number" min={0} max={100} value={subPct} onChange={(e) => setSubPct(e.target.value)} placeholder="أو أدخل نسبة مخصصة..." className="sib-disc-input" />
                  <span className="sib-disc-pct-label">%</span>
                </div>
                <input type="text" value={subReason} onChange={(e) => setSubReason(e.target.value)} placeholder="مثال: خصم الأخوة، خصم خاص..." className="sib-disc-input" />
                {subPct && Number(subPct) > 0 && basePrice != null && (
                  <div className="sib-disc-preview">
                    <Percent size={13} />
                    <span>
                      {basePrice} ج ← <strong>{Math.round(basePrice * (1 - Number(subPct) / 100))} ج</strong> · سيتم تطبيقه على جميع أفراد العائلة
                    </span>
                  </div>
                )}

                <div style={{ height: "1px", background: "var(--border-color)", margin: "0.25rem 0" }} />
                <p className="sib-disc-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  خصم على الكتب <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400 }}>(اختياري)</span>
                </p>
                <div className="sib-disc-presets">
                  {[10, 20, 25, 50, 75, 100].map((p) => (
                    <button key={p} className={`sib-disc-preset${bookPct === String(p) ? " sib-disc-preset--active" : ""}`} onClick={() => setBookPct(String(p))}>{p}%</button>
                  ))}
                </div>
                <div className="sib-disc-input-row">
                  <input type="number" min={0} max={100} value={bookPct} onChange={(e) => setBookPct(e.target.value)} placeholder="نسبة خصم الكتب..." className="sib-disc-input" />
                  <span className="sib-disc-pct-label">%</span>
                </div>
                <input type="text" value={bookReason} onChange={(e) => setBookReason(e.target.value)} placeholder="سبب خصم الكتب (اختياري)..." className="sib-disc-input" />
                {bookPct && Number(bookPct) > 0 && (
                  <div className="sib-disc-preview" style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.2)" }}>
                    <Percent size={13} style={{ color: "#818cf8" }} />
                    <span style={{ color: "#818cf8" }}>خصم كتب <strong>{bookPct}%</strong> على جميع أفراد العائلة</span>
                  </div>
                )}

                {familyError && <p style={{ fontSize: "0.8rem", color: "#f87171", margin: 0 }}>{familyError}</p>}

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <button onClick={() => { setSubPct(""); setSubReason(""); setBookPct(""); setBookReason(""); }} disabled={familySaving} style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem" }}>
                    إزالة الخصم
                  </button>
                  <button onClick={handleSaveFamilyDiscount} disabled={familySaving} style={{ flex: 2, padding: "0.5rem", borderRadius: "8px", background: "#a78bfa", border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    {familySaving ? <span style={{ width: 13, height: 13, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> : <Check size={13} />}
                    {familySaving ? "جاري الحفظ..." : "حفظ"}
                  </button>
                </div>
              </div>
            ) : (
              !confirmOverride && (
                hasFamilyDiscount ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {student.family_discount_percent ? (
                      <div style={{ fontSize: "0.88rem", color: "#c4b5fd" }}>
                        اشتراك: <strong>{student.family_discount_percent}%</strong>
                        {student.family_discount_reason && <span style={{ color: "var(--text-muted)", marginRight: "6px" }}>· {student.family_discount_reason}</span>}
                      </div>
                    ) : null}
                    {student.family_book_discount_percent ? (
                      <div style={{ fontSize: "0.88rem", color: "#818cf8" }}>
                        كتب: <strong>{student.family_book_discount_percent}%</strong>
                        {student.family_book_discount_reason && <span style={{ color: "var(--text-muted)", marginRight: "6px" }}>· {student.family_book_discount_reason}</span>}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>لا يوجد خصم أخوات مطبق</p>
                )
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
