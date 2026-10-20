"use client";
import React, { ReactNode, useEffect, useEffectEvent, useId, useRef } from 'react';
import { X } from 'lucide-react';

// Replaces all the custom modal HTML blocks across the app
// Examples:
// - Edit student modal in app/dashboard/students/page.tsx
// - Add group modal in app/dashboard/page.tsx

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  closeDisabled?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  closeDisabled = false,
  children,
  footer,
  maxWidth = '500px'
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useEffectEvent(() => { if (!closeDisabled) onClose(); });
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') || []).filter(el => !el.hidden);
    (focusable()[0] || panel)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      const items = focusable(); const first = items[0]; const last = items[items.length - 1];
      if (!first) { event.preventDefault(); panel?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    panel?.addEventListener('keydown', onKey);
    return () => { panel?.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center sm:p-4 animate-[fadeIn_0.2s_ease-out]">
      <div
        ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] sm:rounded-2xl w-screen sm:w-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUpModal_0.3s_cubic-bezier(0.16,1,0.3,1)]"
        style={{ maxWidth: `min(${maxWidth}, 100vw)` }}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 bg-black/20">
          <h2 id={titleId} className="text-[1.05rem] sm:text-[1.1rem] font-bold m-0">{title}</h2>
          <button type="button" disabled={closeDisabled} aria-label="إغلاق" className="btn btn-secondary btn-icon border-none bg-transparent" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="p-3 sm:p-6">
          {children}
        </div>
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/5 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
