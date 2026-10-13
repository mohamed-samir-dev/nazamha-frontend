"use client";

import { CheckCircle, AlertCircle, Users } from "lucide-react";
import { Student } from "@/lib/types";

export interface FamilyMatch {
  familyId: string | null;
  members: Student[];
  matchReason?: string;
}

interface Props {
  familyMatch: FamilyMatch | null;
  familyLookupLoading: boolean;
  familyChoice: "join" | "skip";
  parentPhone: string;
  onChoiceChange: (c: "join" | "skip") => void;
}

export function FamilyMatchBox({ familyMatch, familyLookupLoading, familyChoice, parentPhone, onChoiceChange }: Props) {
  if (familyMatch && !familyLookupLoading) {
    return (
      <div className="mt-3 rounded-xl border border-teal-500/35 bg-teal-500/[0.07] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-teal-500/[0.13] border-b border-teal-500/20">
          <CheckCircle size={15} className="text-teal-400 shrink-0" />
          <span className="font-semibold text-sm text-teal-400">تم العثور على طلاب بنفس رقم ولي الأمر</span>
        </div>

        {/* Body */}
        <div className="px-3.5 py-2.5">
          <p className="text-xs text-slate-500 mb-2">الأبناء المسجلون:</p>
          <div className="flex flex-col gap-1.5 mb-2.5">
            {familyMatch.members.map((m, i) => (
              <div key={m.id ?? i} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${familyMatch.matchReason === "name" ? "bg-amber-400" : "bg-teal-400"}`} />
                <span className="text-sm text-white font-semibold">{m.name}</span>
                {m.code && (
                  <span className="font-mono text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-px rounded">{m.code}</span>
                )}
              </div>
            ))}
          </div>

          {/* Radio choices */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-[0.83rem]">
              <input type="radio" name="familyChoice" value="join" checked={familyChoice === "join"} onChange={() => onChoiceChange("join")} className="w-3.5 h-3.5 accent-teal-400" />
              <span className="text-white">ربط بنفس العائلة</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[0.83rem]">
              <input type="radio" name="familyChoice" value="skip" checked={familyChoice === "skip"} onChange={() => onChoiceChange("skip")} className="w-3.5 h-3.5 accent-amber-400" />
              <span className="text-slate-400">عدم الربط (إضافة كطالب مستقل)</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-3.5 py-2 border-t border-white/[0.06] flex items-center gap-1.5 text-xs ${
          familyChoice === "join"
            ? "bg-teal-500/10 text-teal-400"
            : "bg-amber-500/[0.08] text-amber-400"
        }`}>
          {familyChoice === "join" ? (
            <><CheckCircle size={13} /> سيتم ربط الطالب بنفس العائلة عند الإضافة</>
          ) : (
            <><AlertCircle size={13} /> سيتم إضافة الطالب بدون ربط بهذه العائلة</>
          )}
        </div>
      </div>
    );
  }

  if (!familyMatch && !familyLookupLoading && /^01\d{9}$/.test(parentPhone)) {
    return (
      <div className="mt-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.07] flex items-center gap-1.5 text-xs text-slate-500">
        <Users size={13} />
        لا توجد عائلة مسجلة بهذا الرقم
      </div>
    );
  }

  return null;
}
