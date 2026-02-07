import { useEffect, useState, useCallback } from "react";
import { syncOfflineChanges, resolveConflict, type SyncConflict } from "@/lib/offline/sync";
import { addToSyncQueue } from "@/lib/offline/idb";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncChanges = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const detectedConflicts = await syncOfflineChanges();
      setConflicts(detectedConflicts);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  const handleConflictResolution = useCallback(
    async (
      conflict: SyncConflict,
      resolution: "local" | "server" | "merge",
      mergedData?: any
    ) => {
      try {
        await resolveConflict(conflict, resolution, mergedData);
        setConflicts((prev) => prev.filter((c) => c.id !== conflict.id));
        await syncChanges();
      } catch (error) {
        console.error("Failed to resolve conflict:", error);
      }
    },
    [syncChanges]
  );

  const queueChange = useCallback(
    async (
      type: string,
      entity: string,
      action: string,
      data: any
    ) => {
      await addToSyncQueue(type, entity, action, data);
      
      if (isOnline) {
        await syncChanges();
      }
    },
    [isOnline, syncChanges]
  );

  return {
    isOnline,
    isSyncing,
    conflicts,
    syncChanges,
    handleConflictResolution,
    queueChange,
  };
}

