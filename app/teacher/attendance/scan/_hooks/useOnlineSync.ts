"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AttendanceQueue } from "@/lib/offlineQueue";
import { AttendanceRepository } from "@/lib/repositories/attendanceRepository";

export function useOnlineSync(onSynced?: (count: number) => void) {
  const callbackRef = useRef(onSynced);
  useEffect(() => { callbackRef.current=onSynced; }, [onSynced]);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(() => AttendanceQueue.count());
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string|null>(null);
  const syncLock=useRef(false);

  const refreshPending = useCallback(() => {
    setPendingCount(AttendanceQueue.count());
  }, []);

  const syncQueue = useCallback(async () => {
    if (AttendanceQueue.count() === 0 || syncLock.current) return;
    syncLock.current=true;setSyncing(true);setSyncError(null);
    try {
      const synced = await AttendanceRepository.syncQueue();
      setPendingCount(AttendanceQueue.count());
      callbackRef.current?.(synced);
      if(AttendanceQueue.getAll().some(r=>r._error)) setSyncError("بعض السجلات لم تُقبل؛ افتح المعلق لمراجعة السبب.");
    } catch {setSyncError("تعذرت المزامنة؛ السجلات محفوظة على هذا الجهاز. أعد المحاولة.");}
    finally {
      syncLock.current=false;setSyncing(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("attendance-queue-changed", refreshPending);
    window.addEventListener("storage", refreshPending);
    let active=true;
    void Promise.resolve().then(()=>{if(active && navigator.onLine) return syncQueue();});
    return () => { active=false; window.removeEventListener("attendance-queue-changed", refreshPending); window.removeEventListener("storage", refreshPending); };
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

  return { isOnline, pendingCount, syncing, syncQueue, refreshPending, syncError };
}
