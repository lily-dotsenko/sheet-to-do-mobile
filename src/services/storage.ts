import { AppData, createEmptyData } from '@/domain/models';
import { migrateStoredData } from '@/domain/migrations';

export const STORAGE_KEY = 'sheet-to-do:data';
export const CORRUPT_BACKUP_KEY = 'sheet-to-do:data:corrupt';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type LoadResult = {
  data: AppData;
  recoveredFromError: boolean;
};

export class AppStorage {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly key = STORAGE_KEY,
  ) {}

  async load(): Promise<LoadResult> {
    const stored = await this.storage.getItem(this.key);
    if (stored === null) {
      return { data: createEmptyData(), recoveredFromError: false };
    }
    try {
      return { data: migrateStoredData(JSON.parse(stored)), recoveredFromError: false };
    } catch {
      await this.storage.setItem(CORRUPT_BACKUP_KEY, stored);
      await this.storage.removeItem(this.key);
      return { data: createEmptyData(), recoveredFromError: true };
    }
  }

  save(data: AppData): Promise<void> {
    const serialized = JSON.stringify(data);
    this.writeQueue = this.writeQueue
      .catch(() => undefined)
      .then(() => this.storage.setItem(this.key, serialized));
    return this.writeQueue;
  }

  flush(): Promise<void> {
    return this.writeQueue;
  }
}
