import { addList, createEmptyData, createTask, createTaskList, setListSchedule } from './models';
import { dateKey, formatScheduleLabel, scheduledItemsByDate } from './schedule';

describe('schedule helpers', () => {
  test('dateKey extracts the yyyy-mm-dd portion of an ISO string', () => {
    expect(dateKey('2030-03-05T14:30:00.000Z')).toBe('2030-03-05');
  });

  test('collects scheduled lists and tasks grouped by date', () => {
    const task = createTask('Water plants', {
      id: 'task-1',
      scheduledAt: '2030-03-05T18:00:00.000Z',
      alarmEnabled: false,
    });
    const list = createTaskList('Home', 'home', { id: 'list-1', tasks: [task] });
    const data = setListSchedule(addList(createEmptyData(), list), 'list-1', {
      scheduledAt: '2030-03-05T09:00:00.000Z',
      alarmEnabled: true,
      notificationId: 'n-list',
    });

    const byDate = scheduledItemsByDate(data.lists);
    const items = byDate.get('2030-03-05');
    expect(items).toHaveLength(2);
    expect(items?.[0]).toMatchObject({ kind: 'list', listId: 'list-1' });
    expect(items?.[1]).toMatchObject({ kind: 'task', listId: 'list-1', taskId: 'task-1' });
  });

  test('formats a schedule label using the given language month names', () => {
    const iso = '2030-08-12T09:05:00.000Z';
    const date = new Date(iso);
    const label = formatScheduleLabel(iso, 'uk');
    expect(label).toContain(String(date.getDate()));
    expect(label).toContain('серпня');
  });
});
