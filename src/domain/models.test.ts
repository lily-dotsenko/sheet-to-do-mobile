import {
  addList,
  addTask,
  completionProgress,
  createEmptyData,
  createTask,
  createTaskList,
  doneCount,
  editTaskText,
  removeList,
  removeTask,
  renameList,
  reorderLists,
  setListSchedule,
  setTaskSchedule,
  toggleTask,
} from './models';

describe('Task and TaskList models', () => {
  test('creates and toggles a task without mutating the previous data', () => {
    const list = createTaskList('Робота', 'work', { id: 'list-1' });
    const task = createTask('Надіслати лист', { id: 'task-1' });
    const initial = addTask(addList(createEmptyData(), list), list.id, task);
    const toggled = toggleTask(initial, list.id, task.id);

    expect(initial.lists[0].tasks[0].completed).toBe(false);
    expect(toggled.lists[0].tasks[0].completed).toBe(true);
    expect(doneCount(toggled.lists[0])).toBe(1);
    expect(completionProgress(toggled.lists[0])).toBe(1);
  });

  test('creates and removes lists and tasks', () => {
    const list = createTaskList('Home', 'home', { id: 'list-1' });
    const task = createTask('Water plants', { id: 'task-1' });
    const withTask = addTask(addList(createEmptyData(), list), list.id, task);
    const withoutTask = removeTask(withTask, list.id, task.id);
    const withoutList = removeList(withoutTask, list.id);

    expect(withTask.lists[0].tasks).toHaveLength(1);
    expect(withoutTask.lists[0].tasks).toHaveLength(0);
    expect(withoutList.lists).toHaveLength(0);
  });

  test('renames a list and edits a task text', () => {
    const list = createTaskList('Home', 'home', { id: 'list-1' });
    const task = createTask('Water plants', { id: 'task-1' });
    const data = addTask(addList(createEmptyData(), list), list.id, task);

    const renamed = renameList(data, list.id, '  Garden  ');
    expect(renamed.lists[0].title).toBe('Garden');

    const edited = editTaskText(renamed, list.id, task.id, '  Water the plants  ');
    expect(edited.lists[0].tasks[0].text).toBe('Water the plants');
  });

  test('sets and clears schedule for a list and a task', () => {
    const list = createTaskList('Home', 'home', { id: 'list-1' });
    const task = createTask('Water plants', { id: 'task-1' });
    const data = addTask(addList(createEmptyData(), list), list.id, task);

    const schedule = {
      scheduledAt: '2030-01-01T10:00:00.000Z',
      alarmEnabled: true,
      notificationId: 'n-1',
    };
    const withListSchedule = setListSchedule(data, list.id, schedule);
    expect(withListSchedule.lists[0].scheduledAt).toBe(schedule.scheduledAt);
    expect(withListSchedule.lists[0].alarmEnabled).toBe(true);
    expect(withListSchedule.lists[0].notificationId).toBe('n-1');

    const withTaskSchedule = setTaskSchedule(data, list.id, task.id, schedule);
    expect(withTaskSchedule.lists[0].tasks[0].scheduledAt).toBe(schedule.scheduledAt);

    const cleared = setListSchedule(withListSchedule, list.id, {
      scheduledAt: null,
      alarmEnabled: false,
      notificationId: null,
    });
    expect(cleared.lists[0].scheduledAt).toBeNull();
    expect(cleared.lists[0].alarmEnabled).toBe(false);
  });

  test('reorders lists by id and leaves data unchanged when ids do not match', () => {
    const listA = createTaskList('A', 'general', { id: 'list-a' });
    const listB = createTaskList('B', 'general', { id: 'list-b' });
    const data = addList(addList(createEmptyData(), listA), listB);

    const reordered = reorderLists(data, ['list-b', 'list-a']);
    expect(reordered.lists.map((list) => list.id)).toEqual(['list-b', 'list-a']);

    const unchanged = reorderLists(data, ['list-a']);
    expect(unchanged).toBe(data);
  });
});
