import { MONTHS } from '@/i18n/calendar-locale';

import { Language, TaskList } from './models';

export type ScheduledItem = {
  kind: 'list' | 'task';
  listId: string;
  taskId: string | null;
  title: string;
  scheduledAt: string;
  alarmEnabled: boolean;
};

export function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function scheduledItemsByDate(lists: TaskList[]): Map<string, ScheduledItem[]> {
  const byDate = new Map<string, ScheduledItem[]>();
  const push = (item: ScheduledItem) => {
    const key = dateKey(item.scheduledAt);
    const items = byDate.get(key);
    if (items) items.push(item);
    else byDate.set(key, [item]);
  };

  for (const list of lists) {
    if (list.scheduledAt) {
      push({
        kind: 'list',
        listId: list.id,
        taskId: null,
        title: list.title,
        scheduledAt: list.scheduledAt,
        alarmEnabled: list.alarmEnabled,
      });
    }
    for (const task of list.tasks) {
      if (task.scheduledAt) {
        push({
          kind: 'task',
          listId: list.id,
          taskId: task.id,
          title: task.text,
          scheduledAt: task.scheduledAt,
          alarmEnabled: task.alarmEnabled,
        });
      }
    }
  }
  return byDate;
}

export function formatScheduleLabel(iso: string, language: Language): string {
  const date = new Date(iso);
  const day = date.getDate();
  const month = MONTHS[language][date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}`;
}
