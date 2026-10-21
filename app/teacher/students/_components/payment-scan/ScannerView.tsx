"use client";

import { Camera, CameraOff, QrCode } from "lucide-react";
import { SCANNER_DIV_ID } from "./types";
import type { ReactNode } from "react";

interface Props {
  scanning: boolean;
  isStarting: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  overlay?: ReactNode;
}

export function ScannerView({ scanning, isStarting, onStart, onStop, disabled = false, overlay }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {/* Viewfinder */}
      <div
        className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-black/40 border border-[var(--border-color)] flex items-center justify-center transition-all duration-300"
        style={{ 
          minHeight: scanning ? 200 : 140,
          maxHeight: scanning ? 280 : undefined,
        }}
      >
        {/* Idle overlay */}
        {!scanning && !overlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-teal-500/8 border border-teal-500/15 flex items-center justify-center">
              <QrCode size={28} className="text-teal-500/40 sm:w-[30px]" />
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] px-4 text-center">
              {isStarting ? "جاري تشغيل الكاميرا…" : "اضغط «تشغيل» لبدء السكان"}
            </p>
          </div>
        )}

        {/* QR reader div */}
        <div
          id={SCANNER_DIV_ID}
          className="w-full h-full"
          style={{ 
            minHeight: scanning ? 200 : 1,
            opacity: scanning ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />

        {/* Corner brackets */}
        {scanning && (
          <>
            <span className="absolute top-2 sm:top-3 right-2 sm:right-3 w-5 sm:w-6 h-5 sm:h-6 border-t-2 border-l-2 border-teal-400 rounded-tl-sm opacity-70 z-10" />
            <span className="absolute top-2 sm:top-3 left-2 sm:left-3 w-5 sm:w-6 h-5 sm:h-6 border-t-2 border-r-2 border-teal-400 rounded-tr-sm opacity-70 z-10" />
            <span className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-5 sm:w-6 h-5 sm:h-6 border-b-2 border-l-2 border-teal-400 rounded-bl-sm opacity-70 z-10" />
            <span className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-5 sm:w-6 h-5 sm:h-6 border-b-2 border-r-2 border-teal-400 rounded-br-sm opacity-70 z-10" />
            {/* Scan line animation */}
            <span className="absolute inset-x-4 sm:inset-x-6 h-px bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-60 z-10 animate-[scanline_2s_ease-in-out_infinite]" style={{ top: "50%" }} />
          </>
        )}
        {overlay && <div data-scan-feedback className="absolute inset-0 z-20 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">{overlay}</div>}
      </div>

      {/* Toggle button */}
      <button
        className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-55 disabled:cursor-not-allowed ${
          scanning
            ? "bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/18"
            : "bg-teal-500 text-white shadow-[0_4px_14px_rgba(20,184,166,0.3)] hover:bg-teal-600 hover:-translate-y-px active:translate-y-0"
        }`}
        onClick={scanning ? onStop : onStart}
        disabled={isStarting || disabled}
      >
        {scanning
          ? <><CameraOff size={16} /> إيقاف الكاميرا</>
          : isStarting
          ? <><Spinner /> جاري التشغيل…</>
          : <><Camera size={16} /> تشغيل الكاميرا</>}
      </button>
    </div>
  );
}

function Spinner() {
  return <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/25 border-t-white animate-spin" />;
}
