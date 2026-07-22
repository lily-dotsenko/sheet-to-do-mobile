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
  });
});
