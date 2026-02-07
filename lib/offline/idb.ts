import { openDB, DBSchema, IDBPDatabase } from "idb";

interface RewriteDB extends DBSchema {
  stories: {
    key: string;
    value: any;
  };
  chapters: {
    key: string;
    value: any;
  };
  scenes: {
    key: string;
    value: any;
  };
  sceneVersions: {
    key: string;
    value: any;
  };
  chapterVersions: {
    key: string;
    value: any;
  };
  syncQueue: {
    key: number;
    value: {
      id: number;
      type: string;
      entity: string;
      action: string;
      data: any;
      timestamp: number;
    };
    indexes: { "by-timestamp": number };
  };
}

let dbPromise: Promise<IDBPDatabase<RewriteDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RewriteDB>("rewrite-db", 1, {
      upgrade(db) {
        // Stories store
        if (!db.objectStoreNames.contains("stories")) {
          db.createObjectStore("stories");
        }

        // Chapters store
        if (!db.objectStoreNames.contains("chapters")) {
          db.createObjectStore("chapters");
        }

        // Scenes store
        if (!db.objectStoreNames.contains("scenes")) {
          db.createObjectStore("scenes");
        }

        // Scene versions store
        if (!db.objectStoreNames.contains("sceneVersions")) {
          db.createObjectStore("sceneVersions");
        }

        // Chapter versions store
        if (!db.objectStoreNames.contains("chapterVersions")) {
          db.createObjectStore("chapterVersions");
        }

        // Sync queue store
        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          syncStore.createIndex("by-timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveToIndexedDB(store: string, key: string, value: any) {
  const db = await getDB();
  await db.put(store, value, key);
}

export async function getFromIndexedDB(store: string, key: string) {
  const db = await getDB();
  return db.get(store, key);
}

export async function getAllFromIndexedDB(store: string) {
  const db = await getDB();
  return db.getAll(store);
}

export async function deleteFromIndexedDB(store: string, key: string) {
  const db = await getDB();
  await db.delete(store, key);
}

export async function addToSyncQueue(
  type: string,
  entity: string,
  action: string,
  data: any
) {
  const db = await getDB();
  const syncStore = db.transaction("syncQueue", "readwrite").objectStore("syncQueue");
  await syncStore.add({
    type,
    entity,
    action,
    data,
    timestamp: Date.now(),
  });
}

export async function getSyncQueue() {
  const db = await getDB();
  const syncStore = db.transaction("syncQueue", "readonly").objectStore("syncQueue");
  const index = syncStore.index("by-timestamp");
  return index.getAll();
}

export async function removeFromSyncQueue(id: number) {
  const db = await getDB();
  await db.delete("syncQueue", id);
}

export async function clearSyncQueue() {
  const db = await getDB();
  const syncStore = db.transaction("syncQueue", "readwrite").objectStore("syncQueue");
  await syncStore.clear();
}

