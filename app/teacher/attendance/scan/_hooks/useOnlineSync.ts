"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { appCache } from "@/lib/appCache";
import type { QueuedRecord } from "@/lib/offlineQueue";
import { AttendanceQueue } from "@/lib/offlineQueue";
import { AttendanceRepository } from "@/lib/repositories/attendanceRepository";

export function useOnlineSync(onSynced?: (count: number) => void) {
  const callbackRef = useRef(onSynced);
  useEffect(() => {
    callbackRef.current = onSynced;
  }, [onSynced]);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [pendingCount, setPendingCount] = useState(() =>
    AttendanceQueue.count(),
  );
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncLock = useRef(false);

  const refreshPending = useCallback(() => {
    setPendingCount(AttendanceQueue.count());
  }, []);

  const syncQueue = useCallback(async () => {
    if (AttendanceQueue.count() === 0 || syncLock.current) return;
    syncLock.current = true;
    setSyncing(true);
    setSyncError(null);
    try {
      const synced = await AttendanceRepository.syncQueue();
      setPendingCount(AttendanceQueue.count());
      callbackRef.current?.(synced);
      if (AttendanceQueue.getAll().some((r) => r._error))
        setSyncError("بعض السجلات لم تُقبل؛ افتح المعلق لمراجعة السبب.");
    } catch {
      setSyncError(
        "تعذرت المزامنة؛ السجلات محفوظة على هذا الجهاز. أعد المحاولة.",
      );
    } finally {
      syncLock.current = false;
      setSyncing(false);
    }
  }, []);

  const retryRecord = useCallback(async (record: QueuedRecord) => {
    if (
      syncLock.current ||
      AttendanceRepository.isSyncing() ||
      !navigator.onLine
    )
      return;
    syncLock.current = true;
    setSyncing(true);
    setSyncError(null);
    const generation = appCache.generation();
    try {
      const { _queuedAt, _queueId, _error, ...payload } = record;
      const saved = await AttendanceRepository.upsertAttendanceRecord(payload);
      if (saved.state === "saved" && generation === appCache.generation()) {
        AttendanceQueue.acknowledge([record]);
        callbackRef.current?.(1);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "تعذر رفع السجل؛ أعد المحاولة";
      if (generation === appCache.generation())
        AttendanceQueue.reject(record, message);
      setSyncError(message);
    } finally {
      syncLock.current = false;
      setSyncing(false);
      setPendingCount(AttendanceQueue.count());
    }
  }, []);

  const cancelPending = useCallback((record: QueuedRecord) => {
    if (syncLock.current || AttendanceRepository.isSyncing()) return;
    if (
      !window.confirm(
        "إزالة هذا التسجيل من المعلق على الجهاز فقط؟ لا يحذف ذلك سجلًا مؤكدًا على الخادم.",
      )
    )
      return;
    AttendanceQueue.acknowledge([record]);
    setPendingCount(AttendanceQueue.count());
    callbackRef.current?.(0);
  }, []);

  useEffect(() => {
    window.addEventListener("attendance-queue-changed", refreshPending);
    window.addEventListener("storage", refreshPending);
    let active = true;
    void Promise.resolve().then(() => {
      if (active && navigator.onLine) return syncQueue();
    });
    return () => {
      active = false;
      window.removeEventListener("attendance-queue-changed", refreshPending);
      window.removeEventListener("storage", refreshPending);
    };
  }, [refreshPending, syncQueue]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncQueue]);

  return {
    isOnline,
    pendingCount,
    syncing,
    syncQueue,
    refreshPending,
    syncError,
    retryRecord,
    cancelPending,
  };
}
