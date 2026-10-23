"use client";

import { Suspense, useState } from "react";
import { ScanLine, ArrowRight, Wifi, WifiOff, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Spinner } from "@/components/ui/Spinner";
import { SessionConfig } from "./_components/SessionConfig";
import { ScannedList } from "./_components/ScannedList";
import { ScannerPanel } from "./_components/ScannerPanel";
import { useScanSession } from "./_hooks/useScanSession";
import { useOnlineSync } from "./_hooks/useOnlineSync";
import { AttendanceQueue } from "@/lib/offlineQueue";

function QRScanPageInner() {
  const router = useRouter();
  const {
    loading,
    groups, grades,
    selectedGradeId, selectedGroupId, sessionDate,
    validSessionDates,
    scanning, isStarting, setIsStarting,
    scannedToday, lastScan,
    crossGroupConfirm, manualCode,
    manualPlaceholder, scannerDivId,
    groupStudentsCount,
    crossGroupCount,
    groupCode, manualMsg,
    sessionDateError,
    autoDetected,
    handleGradeChange, handleGroupChange, handleSessionDateChange,
    startScanner, stopScanner,
    handleManualSubmit, setManualCode,
    handleConfirmCrossGroup, handleCancelCrossGroup,
    handleRemoveScanned, refreshSessionAttendance,
  } = useScanSession();

  const [syncToast, setSyncToast] = useState<number | null>(null);
  function showSyncToast(count: number) {
    setSyncToast(count);
    setTimeout(() => setSyncToast(null), 3000);
  }

  const { isOnline, pendingCount, syncing, syncQueue } = useOnlineSync((count) => {
    if (count > 0) { showSyncToast(count); refreshSessionAttendance(); }
  });

  async function handleExit() {
    if (AttendanceQueue.count() > 0 && !window.confirm("يوجد حضور لم يُرفع بعد وسيظل محفوظًا للمزامنة. مغادرة السكان؟")) return;
    await stopScanner();
    router.push("/teacher/attendance");
  }

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="flex flex-col gap-6 pb-4 sm:pb-8 max-[900px]:pb-20">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/teacher/attendance" className="flex items-center gap-1.5 text-slate-500 no-underline text-sm transition-colors hover:text-slate-300">
            <ArrowRight size={14} />
            <span>الحضور والغياب</span>
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="flex items-center gap-2 text-[1.2rem] sm:text-[1.35rem] font-bold text-slate-100">
            <ScanLine size={18} />
            وضع السكرتارية
          </h1>
        </div>

        <div className="hidden sm:flex items-center gap-2.5 flex-wrap">
          <button
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-opacity hover:opacity-85"
            onClick={handleExit}
          >
            <ArrowRight size={15} />
            خروج من السكان
          </button>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
            isOnline
              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
              : "bg-red-500/10 border border-red-500/25 text-red-400"
          }`}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isOnline ? "متصل" : "غير متصل"}
          </span>
          {pendingCount > 0 && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400 cursor-pointer transition-all hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-[inherit]"
              onClick={syncQueue}
              disabled={!isOnline || syncing}
              title={isOnline ? "اضغط لرفع السجلات" : "في انتظار الاتصال"}
            >
              <RefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {pendingCount} في الانتظار
            </button>
          )}
          {syncToast !== null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              ✓ رُفع {syncToast} سجل
            </span>
          )}
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-[320px_1fr] gap-5 items-start max-[900px]:grid-cols-1">
        <aside className="flex flex-col gap-4 max-[900px]:order-2">
          <SessionConfig
            grades={grades}
            groups={groups}
            selectedGradeId={selectedGradeId}
            selectedGroupId={selectedGroupId}
            sessionDate={sessionDate}
            validSessionDates={validSessionDates}
            scanning={scanning}
            isStarting={isStarting}
            manualCode={manualCode}
            manualPlaceholder={manualPlaceholder}
            groupCode={groupCode}
            manualMsg={manualMsg}
            sessionDateError={sessionDateError}
            autoDetected={autoDetected}
            onGradeChange={handleGradeChange}
            onGroupChange={handleGroupChange}
            onSessionDateChange={handleSessionDateChange}
            onStartScanner={async () => {
              if (isStarting) return;
              setIsStarting(true);
              await startScanner();
              setIsStarting(false);
            }}
            onStopScanner={stopScanner}
            onManualCodeChange={setManualCode}
            onManualSubmit={handleManualSubmit}
          />
          <ScannedList
            entries={scannedToday}
            totalInGroup={groupStudentsCount}
            crossGroupCount={crossGroupCount}
            onRemove={handleRemoveScanned}
          />
        </aside>

        <div className="max-[900px]:order-1"><ScannerPanel
          scanning={scanning}
          selectedGroupId={selectedGroupId}
          scannerDivId={scannerDivId}
          lastScan={lastScan}
          crossGroupConfirm={crossGroupConfirm}
          onConfirmCrossGroup={handleConfirmCrossGroup}
          onCancelCrossGroup={handleCancelCrossGroup}
        /></div>
      </div>
      {pendingCount > 0 && <div className="glass-panel p-4 border border-amber-500/30 text-amber-300" role="status"><p className="font-bold mb-2">{pendingCount} حضور في انتظار الرفع</p><p className="text-sm mb-3">الحضور المعلق لم يُؤكد على الخادم بعد.</p>{AttendanceQueue.getAll().filter(r => r._error).map(r => <p key={`${r.student_id}-${r.session_date}`} className="text-sm text-red-300 py-2 border-t border-white/10">{r.session_date}: {r._error}</p>)}</div>}

      {/* Mobile sticky bottom bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center gap-2 px-3 py-2.5 bg-[rgba(8,12,20,0.97)] border-t border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
            isOnline
              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
              : "bg-red-500/10 border border-red-500/25 text-red-400"
          }`}>
            {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
            {isOnline ? "متصل" : "غير متصل"}
          </span>
          {scannedToday.length > 0 && (
            <span className="text-sm text-emerald-400 font-semibold truncate">
              ✓ حضر {scannedToday.length} طالب
            </span>
          )}
          {pendingCount > 0 && (
            <button
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400 cursor-pointer flex-shrink-0 font-[inherit]"
              onClick={syncQueue}
              disabled={!isOnline || syncing}
            >
              <RefreshCw size={11} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {pendingCount} معلق
            </button>
          )}
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white border-none rounded-lg text-sm font-semibold cursor-pointer flex-shrink-0"
          onClick={handleExit}
        >
          <ArrowRight size={14} />
          خروج من السكان
        </button>
      </div>
    </div>
  );
}

export default function QRScanPage() {
  return (
    <Suspense fallback={<Spinner fullScreen />}>
      <QRScanPageInner />
    </Suspense>
  );
}
