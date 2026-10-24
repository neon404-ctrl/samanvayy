// SAMANVAY - In-Browser Database Layer (IndexedDB + localStorage)
// Simulates a PostgreSQL-backed system for demo purposes

const DB_NAME = 'samanvay_db';
const DB_VERSION = 1;

let db = null;

const STORES = {
  users: { keyPath: 'id', autoIncrement: true },
  institutions: { keyPath: 'id', autoIncrement: true },
  students: { keyPath: 'id', autoIncrement: true },
  import_jobs: { keyPath: 'id', autoIncrement: true },
  validation_issues: { keyPath: 'id', autoIncrement: true },
  match_candidates: { keyPath: 'id', autoIncrement: true },
  review_decisions: { keyPath: 'id', autoIncrement: true },
  credentials: { keyPath: 'id', autoIncrement: true },
  revocations: { keyPath: 'id', autoIncrement: true },
  audit_events: { keyPath: 'id', autoIncrement: true },
};

export function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      Object.entries(STORES).forEach(([name, opts]) => {
        if (!database.objectStoreNames.contains(name)) {
          database.createObjectStore(name, opts);
        }
      });
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function dbGet(store, id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetAll(store) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut(store, item) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbAdd(store, item) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    const req = tx.objectStore(store).add(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(store, id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbClear(store) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbCount(store) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly');
    const req = tx.objectStore(store).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
