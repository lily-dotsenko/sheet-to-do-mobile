import { strToU8, unzipSync, zipSync } from 'fflate';

import { createTask, createTaskList } from '@/domain/models';

import { ListImportError } from './list-transfer';
import { createListPackage, parseListPackage } from './list-package';

const jpeg = new Uint8Array([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]);

describe('versioned list packages', () => {
  test('round-trips tasks and JPEG photos with new IDs', () => {
    const task = createTask('Receipt', { completed: true });
    const list = createTaskList('Shopping', 'shopping', { tasks: [task] });

    const parsed = parseListPackage(
      createListPackage(list, [{ taskId: task.id, bytes: jpeg, width: 640, height: 480 }]),
    );

    expect(parsed.list.id).not.toBe(list.id);
    expect(parsed.list.tasks[0].id).not.toBe(task.id);
    expect(parsed.list.tasks[0]).toMatchObject({ text: 'Receipt', completed: true, photo: null });
    expect(parsed.photos).toHaveLength(1);
    expect(parsed.photos[0]).toMatchObject({
      taskId: parsed.list.tasks[0].id,
      width: 640,
      height: 480,
    });
    expect(parsed.photos[0].bytes).toEqual(jpeg);
  });

  test('allows a partially missing referenced photo and reports it', () => {
    const task = createTask('Photo');
    const archive = createListPackage(createTaskList('List', 'general', { tasks: [task] }), [
      { taskId: task.id, bytes: jpeg, width: 10, height: 10 },
    ]);
    const entries = unzipSync(archive);
    delete entries['photos/0001.jpg'];

    const parsed = parseListPackage(zipSync(entries));
    expect(parsed.photos).toEqual([]);
    expect(parsed.missingPhotos).toBe(1);
  });

  test.each([
    new Uint8Array([1, 2, 3]),
    zipSync({ '../outside.jpg': jpeg, 'manifest.json': strToU8('{}') }),
    zipSync({ 'manifest.json': strToU8('{broken') }),
  ])('rejects damaged or unsafe archives', (archive) => {
    expect(() => parseListPackage(archive)).toThrow(ListImportError);
  });

  test('rejects a file declared as JPEG that is not JPEG', () => {
    const task = createTask('Photo');
    expect(() =>
      createListPackage(createTaskList('List', 'general', { tasks: [task] }), [
        { taskId: task.id, bytes: new Uint8Array([1, 2, 3]), width: 10, height: 10 },
      ]),
    ).toThrow(ListImportError);
  });
});
