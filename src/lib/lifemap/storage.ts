import type { LifeMapEntry } from "@/types/lifemap";

// 人生体験マップの記録をIndexedDBに保存する。
// 画像データURLを含むためlocalStorageでは容量が不足するのでIndexedDBを使用。
// すべて端末内に保存され、サーバーや第三者へは一切送信しない（非公開）。

const DB_NAME = "lifeMapDB";
const STORE = "entries";
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("このブラウザは保存機能（IndexedDB）に対応していません"));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("保存領域を開けませんでした"));
  });
}

export async function getAllEntries(): Promise<LifeMapEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as LifeMapEntry[]) ?? []);
    req.onerror = () => reject(req.error ?? new Error("記録の読み込みに失敗しました"));
    tx.oncomplete = () => db.close();
  });
}

export async function putEntry(entry: LifeMapEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error("記録の保存に失敗しました"));
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error("記録の削除に失敗しました"));
  });
}
