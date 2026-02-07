import {
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  saveToIndexedDB,
  getFromIndexedDB,
} from "./idb";

export interface SyncConflict {
  id: string;
  type: string;
  localData: any;
  serverData: any;
  localTimestamp: number;
  serverTimestamp: number;
}

export async function syncOfflineChanges(): Promise<SyncConflict[]> {
  const conflicts: SyncConflict[] = [];
  const queue = await getSyncQueue();

  for (const item of queue) {
    try {
      // Check for conflicts by comparing timestamps
      const serverData = await fetchFromServer(item.entity, item.data.id);
      
      if (serverData && serverData.updatedAt > item.timestamp) {
        // Conflict detected
        conflicts.push({
          id: item.data.id,
          type: item.type,
          localData: item.data,
          serverData,
          localTimestamp: item.timestamp,
          serverTimestamp: new Date(serverData.updatedAt).getTime(),
        });
        continue;
      }

      // No conflict, sync the change
      await syncItem(item);
      await removeFromSyncQueue(item.id);
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
    }
  }

  return conflicts;
}

async function fetchFromServer(entity: string, id: string) {
  const endpoint = getEndpoint(entity, id);
  const response = await fetch(endpoint);
  if (response.ok) {
    return response.json();
  }
  return null;
}

async function syncItem(item: any) {
  const endpoint = getEndpoint(item.entity, item.data.id);
  const method = getMethod(item.action);

  const response = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method !== "GET" ? JSON.stringify(item.data) : undefined,
  });

  if (response.ok) {
    const data = await response.json();
    // Update IndexedDB with server response
    await saveToIndexedDB(item.entity, item.data.id, data);
    return data;
  }

  throw new Error(`Sync failed: ${response.statusText}`);
}

function getEndpoint(entity: string, id: string): string {
  const endpoints: Record<string, (id: string) => string> = {
    chapters: (id) => `/api/chapters/${id}`,
    scenes: (id) => `/api/scenes/${id}`,
    stories: (id) => `/api/stories/${id}`,
  };

  const getter = endpoints[entity];
  return getter ? getter(id) : "";
}

function getMethod(action: string): string {
  const methods: Record<string, string> = {
    create: "POST",
    update: "PATCH",
    delete: "DELETE",
    read: "GET",
  };

  return methods[action] || "POST";
}

export async function resolveConflict(
  conflict: SyncConflict,
  resolution: "local" | "server" | "merge",
  mergedData?: any
) {
  const endpoint = getEndpoint(conflict.type, conflict.id);
  
  let dataToSave = conflict.localData;
  if (resolution === "server") {
    dataToSave = conflict.serverData;
  } else if (resolution === "merge" && mergedData) {
    dataToSave = mergedData;
  }

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataToSave),
  });

  if (response.ok) {
    const updated = await response.json();
    await saveToIndexedDB(conflict.type, conflict.id, updated);
    
    // Remove from sync queue
    const queue = await getSyncQueue();
    const item = queue.find((q) => q.data.id === conflict.id);
    if (item) {
      await removeFromSyncQueue(item.id);
    }
    
    return updated;
  }

  throw new Error("Failed to resolve conflict");
}

function getEndpoint(entity: string, id: string): string {
  const endpoints: Record<string, (id: string) => string> = {
    chapters: (id) => `/api/chapters/${id}`,
    scenes: (id) => `/api/scenes/${id}`,
    stories: (id) => `/api/stories/${id}`,
  };

  const getter = endpoints[entity];
  return getter ? getter(id) : "";
}

