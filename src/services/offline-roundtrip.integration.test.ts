import {
  addList,
  addTask,
  createEmptyData,
  createTask,
  createTaskList,
  toggleTask,
} from '@/domain/models';

import { parseListJson, serializeList } from './list-transfer';
import { AppStorage, KeyValueStorage } from './storage';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

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

describe('offline data round-trip', () => {
  test('persists work, restarts, exports a list and imports it as a separate aggregate', async () => {
    const nativeStorage = new MemoryStorage();
    const firstSession = new AppStorage(nativeStorage);
    const list = createTaskList('Weekend', 'general', { id: 'list-1' });
    const task = createTask('Buy milk', { id: 'task-1' });
    let data = addList(createEmptyData('2026-01-01T00:00:00.000Z'), list);
    data = addTask(data, list.id, task);
    data = toggleTask(data, list.id, task.id);

    await firstSession.save(data);
    await firstSession.flush();

    const secondSession = new AppStorage(nativeStorage);
    const restored = await secondSession.load();
    expect(restored.recoveredFromError).toBe(false);
    expect(restored.data.lists[0].tasks[0].completed).toBe(true);

    const exported = serializeList(restored.data.lists[0], false);
    const imported = parseListJson(exported);
    expect(imported.id).not.toBe(list.id);
    expect(imported.tasks[0].id).not.toBe(task.id);

    const withImportedCopy = addList(restored.data, imported);
    await secondSession.save(withImportedCopy);
    const thirdSession = new AppStorage(nativeStorage);
    const afterSecondRestart = await thirdSession.load();

    expect(afterSecondRestart.data.lists).toHaveLength(2);
    expect(afterSecondRestart.data.lists.map((item) => item.title)).toEqual(['Weekend', 'Weekend']);
    expect(afterSecondRestart.data.version).toBe(2);
  });
});
