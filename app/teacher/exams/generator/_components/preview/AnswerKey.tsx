"use client";

import { Question } from "@/lib/types";
import { ML, resolveAnswerLabel, fmtDate, formLabel } from "./types";

interface AnswerKeyProps {
  forms: { id: number; questions: Question[] }[];
  examTitle: string;
  bankTitle: string;
  subject: string;
  teacher: string;
  date: string;
  totalScore: number;
  pageNum: number;
  totalPages: number;
}

export function AnswerKey({
  forms, examTitle, bankTitle, subject, teacher, date, totalScore, pageNum, totalPages,
}: AnswerKeyProps) {
  if (!forms.length) return null;

  // refQuestions = الأسئلة الأصلية (قبل الخلط) — نستخدمها للمقالي فقط
  // لكن الأسئلة المقالية لا تتأثر بالخلط (لا options لها)، فنأخذها من forms[0]
  const refQuestions = forms[0].questions;
  const title = examTitle || bankTitle;
  const essayQs = refQuestions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => q.question_type === "essay");

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
      }}
    >

      {/* هيدر */}
      <div style={{ border: "2.5px solid #000", marginBottom: 18 }}>
        <div style={{
          borderBottom: "1.5px solid #000", padding: "10px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#f0f0f0",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: "bold", letterSpacing: 1 }}>
              مفتاح الإجابات النموذجية
            </div>
            <div style={{ fontSize: 12, marginTop: 3 }}>
              {title}{subject && title !== subject ? ` — ${subject}` : ""}
            </div>
          </div>
          <div style={{
            border: "2px solid #000", padding: "4px 14px",
            fontSize: 12, fontWeight: "bold", textAlign: "center", background: "#fff",
          }}>
            سري<br />خاص بالمدرس
          </div>
        </div>
        <div style={{ padding: "6px 14px", display: "flex", gap: 28, fontSize: 12, flexWrap: "wrap" }}>
          {teacher && <span><strong>المدرس:</strong> {teacher}</span>}
          {date    && <span><strong>التاريخ:</strong> {fmtDate(date)}</span>}
          <span><strong>عدد الأسئلة:</strong> {refQuestions.length}</span>
          <span><strong>الدرجة الكلية:</strong> {totalScore}</span>
          <span><strong>عدد النماذج:</strong> {forms.length}</span>
        </div>
      </div>

      {/* جداول الإجابات — كل نموذج عمود */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(forms.length, 3)}, 1fr)`,
        gap: 14,
        marginBottom: 20,
      }}>
        {forms.map(form => {
          const fLabel = formLabel(form.id - 1);
          return (
            <div key={form.id} style={{ border: "1.5px solid #000" }}>
              <div style={{
                borderBottom: "1.5px solid #000", padding: "5px 8px",
                textAlign: "center", fontWeight: "bold", fontSize: 14,
                background: "#e8e8e8", letterSpacing: 1,
              }}>
                نموذج &nbsp;( {fLabel} )
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    <th style={TH}>رقم</th>
                    <th style={TH}>الإجابة</th>
                    <th style={TH}>الدرجة</th>
                  </tr>
                </thead>
                <tbody>
                  {form.questions.map((q, idx) => {
                    const isEssay = q.question_type === "essay";
                    const qScore  = q.marks ?? (totalScore / form.questions.length);
                    return (
                      <tr key={q.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={TD}>{idx + 1}</td>
                        <td style={{ ...TD, fontWeight: isEssay ? "normal" : "bold", fontSize: 13, color: isEssay ? "#888" : "#000" }}>
                          {isEssay ? <em style={{ fontSize: 11 }}>مقالي ↓</em> : resolveAnswerLabel(q)}
                        </td>
                        <td style={TD}>
                          {Number(qScore) % 1 === 0 ? qScore : Number(qScore).toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #000", background: "#e8e8e8" }}>
                    <td colSpan={2} style={{ ...TD, fontWeight: "bold", textAlign: "right", paddingRight: 10 }}>
                      المجموع الكلي
                    </td>
                    <td style={{ ...TD, fontWeight: "bold" }}>{totalScore}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}
      </div>

      {/* الإجابات النموذجية للمقالي */}
      {essayQs.length > 0 && (
        <div style={{ border: "1.5px solid #000", marginBottom: 16 }}>
          <div style={{
            borderBottom: "1.5px solid #000", padding: "6px 12px",
            fontWeight: "bold", fontSize: 13, background: "#f0f0f0",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>الإجابات النموذجية — الأسئلة المقالية</span>
            <span style={{ fontSize: 11, fontWeight: "normal", color: "#555" }}>
              تنطبق على جميع النماذج بنفس ترتيب الأسئلة
            </span>
          </div>
          {essayQs.map(({ q, idx }) => (
            <div key={q.id} style={{
              borderBottom: "1px solid #ddd", padding: "8px 12px",
              fontSize: 12, lineHeight: 1.7,
            }}>
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                س {idx + 1}: {q.content}
              </div>
              <div style={{
                background: q.model_answer ? "#f6fff6" : "#fafafa",
                border: `1px solid ${q.model_answer ? "#a5d6a7" : "#ddd"}`,
                borderRadius: 4, padding: "5px 10px",
                color: q.model_answer ? "#1b5e20" : "#aaa",
                fontStyle: q.model_answer ? "normal" : "italic",
              }}>
                {q.model_answer || "لم تُحدد إجابة نموذجية"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ملاحظات المدرس */}
      {refQuestions.some(q => q.teacher_notes) && (
        <div style={{ border: "1px solid #000", padding: "8px 12px", marginBottom: 16 }}>
          <div style={{
            fontWeight: "bold", fontSize: 13,
            borderBottom: "1px solid #000", paddingBottom: 5, marginBottom: 8,
          }}>
            ملاحظات الأسئلة:
          </div>
          {refQuestions.filter(q => q.teacher_notes).map(q => {
            const idx = refQuestions.indexOf(q);
            return (
              <div key={q.id} style={{ fontSize: 12, marginBottom: 4, lineHeight: 1.6 }}>
                <strong>س {idx + 1} :</strong>&nbsp;{q.teacher_notes}
              </div>
            );
          })}
        </div>
      )}

      {/* فوتر */}
      <div style={{
        marginTop: 14, borderTop: "1.5px solid #000", paddingTop: 5,
        display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11,
      }}>
        <span>مفتاح الإجابات — {title}</span>
        <span style={{ fontWeight: "bold" }}>سري — خاص بالمدرس فقط</span>
        <span>صفحة {pageNum} من {totalPages}</span>
      </div>
    </div>
  );
}

const TH: React.CSSProperties = {
  padding: "5px 8px", border: "1px solid #000",
  textAlign: "center", fontWeight: "bold", fontSize: 12,
};

const TD: React.CSSProperties = {
  padding: "4px 8px", border: "1px solid #bbb",
  textAlign: "center", fontSize: 12,
};
