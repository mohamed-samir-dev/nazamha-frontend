"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangle, Copy, Check, Users } from "lucide-react";

export interface UnpaidStudent {
  id: string;
  name: string;
  code?: string;
  gradeName?: string;
  groupName?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: UnpaidStudent[];
  currentMonthName: string;
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

function CopyCodeBtn({ code }: { code?: string }) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="نسخ الكود"
      className={`flex items-center p-0.5 bg-transparent border-none cursor-pointer transition-colors duration-200 ${copied ? "text-emerald-500" : "text-[var(--text-muted)]"}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export function UnpaidStudentsModal({ isOpen, onClose, students, currentMonthName, loading, error, hasMore, onLoadMore }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`طلاب لم يدفعوا — ${currentMonthName}`} maxWidth="560px">
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">جاري تحميل الطلاب…</p>}
      {students.length === 0 && !loading && !error ? (
        <div className="text-center py-8 text-[var(--text-muted)]">
          🎉 جميع الطلاب دفعوا هذا الشهر!
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[60vh] sm:max-h-[440px] overflow-y-auto">
          {students.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-2.5 rounded-lg bg-red-500/[0.04] border border-red-500/[0.12] transition-colors hover:bg-red-500/[0.07]"
            >
              <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[0.88rem] sm:text-[0.92rem] m-0 text-white truncate min-w-0" title={s.name}>
                    {s.name}
                  </p>
                  {s.code && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="student-code-badge text-[0.72rem] sm:text-[0.78rem] px-1.5 py-0.5">{s.code}</span>
                      <CopyCodeBtn code={s.code} />
                    </div>
                  )}
                </div>

                {(s.gradeName || s.groupName) && (
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.74rem] sm:text-[0.78rem] text-[var(--text-muted)] mt-1.5 leading-normal">
                    {s.gradeName && (
                      <span className="shrink-0">{s.gradeName}</span>
                    )}
                    {s.gradeName && s.groupName && (
                      <span className="opacity-30 select-none">·</span>
                    )}
                    {s.groupName && (
                      <span
                        className="inline-flex items-center gap-1 font-medium text-slate-200 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08] break-words"
                        title={s.groupName}
                      >
                        <Users size={11} className="text-slate-400 shrink-0" />
                        <span>{s.groupName}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {hasMore && <button type="button" className="btn btn-secondary mt-3" disabled={loading} onClick={onLoadMore}>عرض المزيد</button>}
    </Modal>
  );
}
