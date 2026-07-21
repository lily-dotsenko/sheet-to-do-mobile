export const DATA_VERSION = 1 as const;
export const MAX_LIST_TITLE_LENGTH = 60;
export const MAX_TASK_TEXT_LENGTH = 160;
export const MAX_LISTS = 100;
export const MAX_TASKS_PER_LIST = 500;

export type Language = 'uk' | 'en';
export type ThemeId = 'twilight' | 'winter' | 'spring' | 'autumn';

export type PhotoAttachment = {
  uri: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
};

export type Task = {
  id: string;
  text: string;
  completed: boolean;
  photo: PhotoAttachment | null;
  createdAt: string;
};

export type TaskList = {
  id: string;
  title: string;
  iconId: string;
  tasks: Task[];
  createdAt: string;
};

export type AppPreferences = {
  themeId: ThemeId;
  language: Language | null;
};

export type AppData = {
  version: typeof DATA_VERSION;
  lists: TaskList[];
  preferences: AppPreferences;
  updatedAt: string;
};

export class DomainError extends Error {}

export function createId(): string {
  const random = Math.random().toString(36).slice(2, 11);
  return `${Date.now().toString(36)}-${random}`;
}

function cleanText(value: string, maxLength: number, label: string): string {
  const text = value.trim();
  if (!text) {
    throw new DomainError(`${label} must not be empty`);
  }
  if (text.length > maxLength) {
    throw new DomainError(`${label} is too long`);
  }
  return text;
}

export function createTask(
  text: string,
  overrides: Partial<Pick<Task, 'id' | 'completed' | 'photo' | 'createdAt'>> = {},
): Task {
  return {
    id: overrides.id ?? createId(),
    text: cleanText(text, MAX_TASK_TEXT_LENGTH, 'Task text'),
    completed: overrides.completed ?? false,
    photo: overrides.photo ?? null,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

export function createTaskList(
  title: string,
  iconId = 'general',
  overrides: Partial<Pick<TaskList, 'id' | 'tasks' | 'createdAt'>> = {},
): TaskList {
  const tasks = overrides.tasks ?? [];
  if (tasks.length > MAX_TASKS_PER_LIST) {
    throw new DomainError('Too many tasks');
  }
  return {
    id: overrides.id ?? createId(),
    title: cleanText(title, MAX_LIST_TITLE_LENGTH, 'List title'),
    iconId,
    tasks,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

export function createEmptyData(now = new Date().toISOString()): AppData {
  return {
    version: DATA_VERSION,
    lists: [],
    preferences: { themeId: 'twilight', language: null },
    updatedAt: now,
  };
}

export function addList(data: AppData, list: TaskList): AppData {
  if (data.lists.length >= MAX_LISTS) {
    throw new DomainError('Too many lists');
  }
  return touch(data, [...data.lists, list]);
}

export function removeList(data: AppData, listId: string): AppData {
  return touch(
    data,
    data.lists.filter((list) => list.id !== listId),
  );
}

export function addTask(data: AppData, listId: string, task: Task): AppData {
  return updateList(data, listId, (list) => {
    if (list.tasks.length >= MAX_TASKS_PER_LIST) {
      throw new DomainError('Too many tasks');
    }
    return { ...list, tasks: [...list.tasks, task] };
  });
}

export function toggleTask(data: AppData, listId: string, taskId: string): AppData {
  return updateTask(data, listId, taskId, (task) => ({
    ...task,
    completed: !task.completed,
  }));
}

export function setTaskPhoto(
  data: AppData,
  listId: string,
  taskId: string,
  photo: PhotoAttachment | null,
): AppData {
  return updateTask(data, listId, taskId, (task) => ({ ...task, photo }));
}

export function removeTask(data: AppData, listId: string, taskId: string): AppData {
  return updateList(data, listId, (list) => ({
    ...list,
    tasks: list.tasks.filter((task) => task.id !== taskId),
  }));
}

export function doneCount(list: TaskList): number {
  return list.tasks.reduce((count, task) => count + (task.completed ? 1 : 0), 0);
}

export function completionProgress(list: TaskList): number {
  return list.tasks.length === 0 ? 0 : doneCount(list) / list.tasks.length;
}

function updateList(data: AppData, listId: string, update: (list: TaskList) => TaskList): AppData {
  let found = false;
  const lists = data.lists.map((list) => {
    if (list.id !== listId) return list;
    found = true;
    return update(list);
  });
  return found ? touch(data, lists) : data;
}

function updateTask(
  data: AppData,
  listId: string,
  taskId: string,
  update: (task: Task) => Task,
): AppData {
  return updateList(data, listId, (list) => ({
    ...list,
    tasks: list.tasks.map((task) => (task.id === taskId ? update(task) : task)),
  }));
}

function touch(data: AppData, lists: TaskList[]): AppData {
  return { ...data, lists, updatedAt: new Date().toISOString() };
}
