import { createEmptyData, createTaskList } from '@/domain/models';

import { AppStorage, CORRUPT_BACKUP_KEY, KeyValueStorage, STORAGE_KEY } from './storage';

class MemoryStorage implements KeyValueStorage {
  values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

describe('AppStorage', () => {
  test('saves and restores structured data', async () => {
    const memory = new MemoryStorage();
    const storage = new AppStorage(memory);
    const data = { ...createEmptyData(), lists: [createTaskList('Trips')] };

    await storage.save(data);
    const loaded = await storage.load();

    expect(loaded.recoveredFromError).toBe(false);
    expect(loaded.data.lists[0].title).toBe('Trips');
  });

  test('backs up invalid JSON and recovers with empty data', async () => {
    const memory = new MemoryStorage();
    memory.values.set(STORAGE_KEY, '{not json');
    const loaded = await new AppStorage(memory).load();

    expect(loaded.recoveredFromError).toBe(true);
    expect(loaded.data.lists).toEqual([]);
    expect(memory.values.get(CORRUPT_BACKUP_KEY)).toBe('{not json');
    expect(memory.values.has(STORAGE_KEY)).toBe(false);
  });
});
