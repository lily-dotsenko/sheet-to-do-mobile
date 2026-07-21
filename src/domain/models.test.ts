import {
  addList,
  addTask,
  completionProgress,
  createEmptyData,
  createTask,
  createTaskList,
  doneCount,
  removeList,
  removeTask,
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
});
