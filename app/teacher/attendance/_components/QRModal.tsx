"use client";

import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useState, useEffect } from "react";
import { Student } from "@/lib/types";
import { getStudentQRValue } from "@/lib/utils/qrParser";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, X } from "lucide-react";

interface Props {
  student: Student | null;
  onClose: () => void;
}

export function QRModal({ student, onClose }: Props) {
  if (!student) return null;

  const handlePrint = () => {
    const svg = document.getElementById("qr-modal-svg");
    if (!svg) return;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(sanitizeHtml(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"/>
      <title>QR - ${student!.name}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px}
        .card{border:2px solid #e5e7eb;border-radius:16px;padding:24px 32px;text-align:center;max-width:300px;width:100%}
        .name{font-size:18px;font-weight:700;color:#111;margin-bottom:16px}
        .qr-wrap{background:#fff;padding:12px;border-radius:10px;display:inline-block;margin-bottom:12px}
        .code{font-size:13px;color:#555;font-family:monospace;margin-bottom:20px}
        .print-btn{padding:10px 28px;background:#111;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}
        @media print{.print-btn{display:none!important}@page{size:A6;margin:8mm}}
      </style>
    </head><body>
      <div class="card">
        <div class="name">${student!.name}</div>
        <div class="qr-wrap">${svgStr}</div>
        ${student!.code ? `<div class="code">كود: ${student!.code}</div>` : ""}
      </div>
      <button class="print-btn" onclick="window.print()">🖨 طباعة</button>
    </body></html>`));
    win.document.close();
    win.document.querySelector(".print-btn")?.addEventListener("click", () => win.print());
  };

  const handleDownload = () => {
    const svg = document.getElementById("qr-modal-svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const canvas = document.createElement("canvas");
    canvas.width = 300; canvas.height = 340;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 300, 340);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 25, 15, 250, 250);
      ctx.fillStyle = "#111827";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(student.name, 150, 300);
      const link = document.createElement("a");
      link.download = `QR-${student.name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[340px] rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="text-[0.95rem] font-bold text-slate-100 truncate ml-2">
            QR — {student.name}
          </h2>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors flex-shrink-0"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-4 px-5 py-6">
          {/* QR Box */}
          <div className="p-4 rounded-xl bg-white shadow-lg">
            <QRCodeSVG
              id="qr-modal-svg"
              value={getStudentQRValue(student)}
              size={180} level="M"
            />
          </div>

          {student.code && (
            <div className="px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-sm font-mono font-bold">
              كود: {student.code}
            </div>
          )}

          <p className="text-[0.78rem] text-slate-500 text-center">
            السكرتارية تسكان هذا الكود عند دخول الطالب
          </p>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-teal-500 text-white text-sm font-semibold transition-all hover:bg-teal-600"
              onClick={handleDownload}
            >
              <Download size={15} />
              تحميل
            </button>
            <button
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] border border-white/10 bg-white/[0.04] text-slate-300 text-sm font-semibold transition-all hover:bg-white/[0.08] cursor-pointer"
              onClick={handlePrint}
            >
              <Printer size={15} />
              طباعة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
