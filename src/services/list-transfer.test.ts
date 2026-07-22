import { createTask, createTaskList } from '@/domain/models';

import {
  ListImportError,
  createImportDeepLink,
  formatListAsText,
  parseDeepLinkData,
  parseListJson,
  serializeList,
} from './list-transfer';

describe('list import and export', () => {
  test('round-trips Ukrainian text and completion state', () => {
    const list = createTaskList('Мої справи', 'home', {
      tasks: [createTask('Купити чай', { completed: true })],
    });

    const imported = parseListJson(serializeList(list));

    expect(imported.title).toBe('Мої справи');
    expect(imported.iconId).toBe('home');
    expect(imported.tasks[0]).toMatchObject({ text: 'Купити чай', completed: true });
    expect(imported.id).not.toBe(list.id);
  });

  test('imports a legacy browser list', () => {
    const imported = parseListJson(
      JSON.stringify({
        name: 'Work',
        icon: 'bi-briefcase-fill',
        tasks: [{ text: 'Reply', done: true }],
      }),
    );

    expect(imported.iconId).toBe('work');
    expect(imported.tasks[0].completed).toBe(true);
  });

  test('round-trips a deep link payload', () => {
    const list = createTaskList('旅行', 'travel', { tasks: [createTask('切符')] });
    const link = createImportDeepLink(list);
    const encoded = new URL(link).searchParams.get('data');

    expect(encoded).not.toBeNull();
    expect(parseDeepLinkData(encoded!).title).toBe('旅行');
  });

  test.each(['{bad json', '{}', '{"format":"sheet-to-do","version":99,"list":{}}'])(
    'rejects invalid data: %s',
    (json) => {
      expect(() => parseListJson(json)).toThrow(ListImportError);
    },
  );

  test('formats a readable checklist with progress', () => {
    const list = createTaskList('Weekend', 'home', {
      tasks: [createTask('Tea', { completed: true }), createTask('Book')],
    });

    expect(formatListAsText(list, { progress: '1 of 2 complete', empty: 'No tasks' })).toBe(
      'Weekend\n1 of 2 complete\n\n[✓] Tea\n[ ] Book',
    );
  });
});
