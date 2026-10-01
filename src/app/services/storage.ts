export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
}
const browserStorage = (): StorageAdapter | null => {
  try { return typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? (globalThis.localStorage as StorageAdapter) : null; }
  catch { return null; }
};
let adapter: StorageAdapter = browserStorage() ?? new MemoryStorageAdapter();
export const storage = {
  getItem(key: string) { try { return adapter.getItem(key); } catch { return null; } },
  setItem(key: string, value: string) { try { adapter.setItem(key, value); } catch {} },
  removeItem(key: string) { try { adapter.removeItem(key); } catch {} },
  readJson<T>(key: string, fallback: T): T { try { const raw = adapter.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } },
  writeJson<T>(key: string, value: T) { try { adapter.setItem(key, JSON.stringify(value)); } catch {} },
};
export function setStorageAdapter(next: StorageAdapter) { adapter = next; }
export class MemoryStorage extends MemoryStorageAdapter {}