import { DATA_VERSION } from './models';
import { MigrationError, migrateStoredData } from './migrations';

describe('data migrations', () => {
  test('migrates the legacy web list shape and drops base64 photos', () => {
    const migrated = migrateStoredData(
      [
        {
          id: 'legacy-list',
          name: 'Study',
          icon: 'bi-book-fill',
          tasks: [
            { id: 'legacy-task', text: 'Read', done: true, photo: 'data:image/jpeg;base64,x' },
          ],
        },
      ],
      '2026-01-01T00:00:00.000Z',
    );

    expect(migrated.version).toBe(DATA_VERSION);
    expect(migrated.lists[0].iconId).toBe('study');
    expect(migrated.lists[0].tasks[0].completed).toBe(true);
    expect(migrated.lists[0].tasks[0].photo).toBeNull();
  });

  test('rejects unsupported future data', () => {
    expect(() => migrateStoredData({ version: 999, lists: [] })).toThrow(MigrationError);
  });

<<<<<<< HEAD
  test('migrates version one preferences with no custom background', () => {
    const migrated = migrateStoredData({
      version: 1,
      lists: [],
      preferences: { themeId: 'winter', language: 'uk' },
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(migrated.version).toBe(DATA_VERSION);
    expect(migrated.preferences).toEqual({
      themeId: 'winter',
      customBackground: null,
      language: 'uk',
    });
=======
  test('defaults schedule fields when missing and preserves them when present', () => {
    const withoutSchedule = migrateStoredData({
      version: DATA_VERSION,
      lists: [
        {
          id: 'list-1',
          title: 'Home',
          iconId: 'home',
          tasks: [
            {
              id: 'task-1',
              text: 'Water plants',
              completed: false,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      preferences: { themeId: 'twilight', language: 'uk' },
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(withoutSchedule.lists[0].scheduledAt).toBeNull();
    expect(withoutSchedule.lists[0].alarmEnabled).toBe(false);
    expect(withoutSchedule.lists[0].notificationId).toBeNull();
    expect(withoutSchedule.lists[0].tasks[0].scheduledAt).toBeNull();

    const withSchedule = migrateStoredData({
      version: DATA_VERSION,
      lists: [
        {
          id: 'list-1',
          title: 'Home',
          iconId: 'home',
          scheduledAt: '2030-01-01T10:00:00.000Z',
          alarmEnabled: true,
          notificationId: 'n-1',
          tasks: [],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      preferences: { themeId: 'twilight', language: 'uk' },
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(withSchedule.lists[0].scheduledAt).toBe('2030-01-01T10:00:00.000Z');
    expect(withSchedule.lists[0].alarmEnabled).toBe(true);
    expect(withSchedule.lists[0].notificationId).toBe('n-1');
>>>>>>> 7ea1644 (add new features)
  });
});
