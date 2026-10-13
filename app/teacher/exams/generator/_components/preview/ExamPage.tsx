"use client";

import { Question } from "@/lib/types";
import { ML, fmtDate, formLabel } from "./types";

interface ExamPageProps {
  form: { id: number; questions: Question[] };
  formIndex: number;
  totalPages: number;
  subject: string;
  examTitle: string;
  date: string;
  teacher: string;
  gradeName: string;
  groupName: string;
  groupCode?: string;
  totalScore: number;
  instructions?: string[];
}

export function ExamPage({
  form, formIndex, totalPages,
  subject, examTitle, date, teacher, gradeName, groupName, groupCode, totalScore, instructions,
}: ExamPageProps) {
  const fLabel = formLabel(form.id - 1);
  const pageNum = formIndex + 1;

  return (
    <div
      className="exam-form-page"
      style={{
        background: "#fff",
        width: "794px",
        minHeight: "1123px",
        padding: "57px 61px 46px",
        boxSizing: "border-box",
        margin: "0 auto",
        direction: "rtl",
        color: "#000",
        fontFamily: "'Arial', 'Tahoma', sans-serif",
        fontSize: 13,
        lineHeight: 1.5,
        position: "relative",
      }}
    >
      {/* هيدر الامتحان */}
      <div style={{ border: "2.5px solid #000", marginBottom: 14 }}>

        {examTitle && (
          <div style={{ borderBottom: "1.5px solid #000", padding: "7px 12px", textAlign: "center", fontSize: 16, fontWeight: "bold" }}>
            {examTitle}
          </div>
        )}

        <div style={{ borderBottom: "1.5px solid #000", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
          <div style={{ padding: "8px 12px", borderLeft: "1.5px solid #000" }}>
            {subject && <div style={{ fontSize: 14, fontWeight: "bold" }}>المادة: {subject}</div>}
          </div>
          <div style={{ padding: "8px 20px", textAlign: "center", borderLeft: "1.5px solid #000" }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>النموذج</div>
            <div style={{ fontSize: 22, fontWeight: "bold", lineHeight: 1, letterSpacing: 2 }}>( {fLabel} )</div>
          </div>
          <div style={{ padding: "8px 12px", textAlign: "left" }}>
            {date && (
              <div style={{ fontSize: 12 }}>
                <span style={{ fontWeight: "bold" }}>التاريخ: </span>{fmtDate(date)}
              </div>
            )}
            <div style={{ fontSize: 12, marginTop: 3 }}>
              <span style={{ fontWeight: "bold" }}>الدرجة الكلية: </span>{totalScore} درجة
            </div>
          </div>
        </div>

        {(teacher || gradeName || groupName) && (
          <div style={{ borderBottom: "1.5px solid #000", padding: "5px 12px", display: "flex", gap: 28, fontSize: 12 }}>
            {teacher   && <span><strong>المدرس:</strong> {teacher}</span>}
            {gradeName && <span><strong>الصف:</strong> {gradeName}</span>}
            {groupName && <span><strong>المجموعة:</strong> {groupName}</span>}
          </div>
        )}

        <div style={{ borderBottom: "1.5px solid #000", padding: "4px 12px", fontSize: 12, display: "flex", gap: 24 }}>
          <span><strong>عدد الأسئلة:</strong> {form.questions.length} سؤال</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "3fr 1.2fr 1.2fr", fontSize: 13 }}>
          <div style={{ padding: "8px 12px", borderLeft: "1.5px solid #000", display: "flex", alignItems: "center", gap: 6 }}>
            <strong style={{ whiteSpace: "nowrap" }}>اسم الطالب:</strong>
            <span style={{ flex: 1, borderBottom: "1px solid #000", display: "inline-block", minHeight: 18 }} />
          </div>
          <div style={{ padding: "8px 12px", borderLeft: "1.5px solid #000", display: "flex", alignItems: "center", gap: 4 }}>
            <strong style={{ whiteSpace: "nowrap" }}>الكود:</strong>
            {groupCode
              ? <span style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <span style={{ flex: 1, borderBottom: "2px solid #000", display: "inline-block", minHeight: 18 }} />
                  <span style={{ fontWeight: "bold", fontSize: 13, whiteSpace: "nowrap", marginLeft: 4 }}>-{groupCode}</span>
                </span>
              : <span style={{ flex: 1, borderBottom: "2px solid #000", display: "inline-block", minHeight: 18 }} />
            }
          </div>
          <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <strong style={{ whiteSpace: "nowrap" }}>الدرجة:</strong>
            <span style={{ borderBottom: "1px solid #000", display: "inline-block", width: 36, minHeight: 18 }} />
            <span>/ {totalScore}</span>
          </div>
        </div>
      </div>

      {/* التعليمات */}
      {instructions && instructions.length > 0 && (
        <div style={{ border: "1.5px solid #000", marginBottom: 10, padding: "6px 12px", fontSize: 12, background: "#fafafa" }}>
          <strong style={{ display: "block", marginBottom: 4 }}>تعليمات:</strong>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
            {instructions.map((line, i) => (
              <span key={i} style={{ fontWeight: 600, lineHeight: 1.7 }}>• {line}</span>
            ))}
          </div>
        </div>
      )}

      {/* الأسئلة */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {form.questions.map((q, idx) => {
          const showSec = q.section_name && (idx === 0 || form.questions[idx - 1].section_name !== q.section_name);
          const qScore  = q.marks ?? (totalScore / form.questions.length);
          const isLast  = idx === form.questions.length - 1;

          return (
            <div key={q.id} style={{ breakInside: "avoid" }}>
              {showSec && (
                <div style={{ border: "1.5px solid #000", borderBottom: "none", padding: "5px 12px", fontWeight: "bold", fontSize: 13, marginTop: idx === 0 ? 0 : 10, display: "flex", justifyContent: "space-between", background: "#f5f5f5" }}>
                  <span>{q.section_name}</span>
                  <span style={{ fontWeight: "normal", fontSize: 11 }}>
                    [ {form.questions.filter(fq => fq.section_name === q.section_name).length} أسئلة ]
                  </span>
                </div>
              )}
              <div style={{ border: "1px solid #000", borderTop: showSec ? "1.5px solid #000" : "1px solid #000", borderBottom: isLast ? "1px solid #000" : "none", padding: "9px 12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontWeight: "bold", fontSize: 13, whiteSpace: "nowrap", minWidth: 28 }}>س {idx + 1} :</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: "bold", lineHeight: 1.6 }}>{q.content}</span>
                  <span style={{ fontSize: 11, whiteSpace: "nowrap", border: "1px solid #555", padding: "1px 7px", borderRadius: 3, marginTop: 1, flexShrink: 0 }}>
                    {Number(qScore) % 1 === 0 ? qScore : Number(qScore).toFixed(1)} د
                  </span>
                </div>
                {q.image_base64 && (
                  <div style={{ margin: "8px 28px 4px" }}>
                    <img src={q.image_base64} style={{ maxWidth: "100%", maxHeight: 190, objectFit: "contain", display: "block", border: "1px solid #ccc" }} alt="" />
                  </div>
                )}
                {q.question_type === "essay" && (
                  <div style={{ marginTop: 8, paddingRight: 28 }}>
                    {Array.from({ length: q.essay_lines || 4 }).map((_, i) => (
                      <div key={i} style={{ borderBottom: "1px solid #aaa", height: "1.85rem", marginBottom: 2 }} />
                    ))}
                  </div>
                )}
                {q.question_type !== "essay" && q.options && q.options.length > 0 && (
                  <OptionsGrid options={q.options} optionImages={q.option_images} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* فوتر + رقم الصفحة */}
      <div style={{ marginTop: 14, borderTop: "1.5px solid #000", paddingTop: 5, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
        <span>نموذج ( {fLabel} ){subject ? ` — ${subject}` : ""}</span>
        <span style={{ fontWeight: "bold", fontSize: 11, textAlign: "center" }}>✦ راجع إجاباتك قبل تسليم ورقة الامتحان، مع تمنياتنا لك بالتوفيق ✦</span>
        <span className="page-num-display">صفحة {pageNum} من {totalPages}</span>
      </div>
    </div>
  );
}

function OptionsGrid({ options, optionImages }: { options: string[]; optionImages?: (string | null)[] | null }) {
  const hasAnyImg = options.some((_, i) => !!optionImages?.[i]);
  const hasLong   = !hasAnyImg && options.some(o => o.length > 30);
  const hasMed    = !hasAnyImg && options.some(o => o.length > 12);
  const cols      = hasAnyImg ? 2 : hasLong ? 1 : hasMed ? 2 : 4;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "5px 10px", marginTop: 8, paddingRight: 28 }}>
      {options.map((opt, oi) => {
        const img = optionImages?.[oi] ?? null;
        return (
          <div key={oi} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, padding: "2px 0" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, border: "1.5px solid #000", borderRadius: "50%", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>
              {ML[oi % ML.length]}
            </span>
            {img
              ? <img src={img} style={{ maxHeight: 65, maxWidth: "100%", border: "1px solid #ccc", borderRadius: 2 }} alt="" />
              : <span style={{ lineHeight: 1.4 }}>{opt}</span>
            }
          </div>
        );
      })}
    </div>
  );
}
