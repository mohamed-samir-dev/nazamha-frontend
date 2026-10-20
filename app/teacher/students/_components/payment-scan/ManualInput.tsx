"use client";

import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled?: boolean;
}

export function ManualInput({ value, onChange, onSubmit, loading, disabled = false }: Props) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        <input
          className="w-full pr-9 pl-3 py-2.5 bg-slate-900/80 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-teal-500 transition-all"
          type="text"
          aria-label="كود الطالب"
          autoComplete="off"
          placeholder="أدخل كود الطالب…"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onSubmit()}
          disabled={loading || disabled}
        />
      </div>
      <button
        className="px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold min-w-[64px] flex items-center justify-center gap-1.5 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_2px_10px_rgba(20,184,166,0.25)]"
        onClick={onSubmit}
        disabled={!value.trim() || loading || disabled}
      >
        {loading ? <Spinner /> : "عرض المستحقات"}
      </button>
    </div>
  );
}

function Spinner() {
  return <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/25 border-t-white animate-spin" />;
}
