import { PhotoAttachment, createTask, createTaskList } from '@/domain/models';

import { ParsedPackagePhoto } from './list-package';
import { PackagePhotoImportPort, attachPackagePhotos } from './package-photo-import';

class FakePort implements PackagePhotoImportPort {
  saved: string[] = [];
  deleted: string[] = [];
  failAt = Number.POSITIVE_INFINITY;

  async save(photo: ParsedPackagePhoto): Promise<PhotoAttachment> {
    if (this.saved.length === this.failAt) throw new Error('disk full');
    const uri = `file://${photo.taskId}.jpg`;
    this.saved.push(uri);
    return { uri, width: photo.width, height: photo.height, mimeType: 'image/jpeg' };
  }

  async delete(uri: string): Promise<void> {
    this.deleted.push(uri);
  }
}

const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe('package photo import', () => {
  test('attaches saved private files to their new task IDs', async () => {
    const task = createTask('One');
    const list = createTaskList('List', 'general', { tasks: [task] });
    const port = new FakePort();
    const result = await attachPackagePhotos(
      list,
      [{ taskId: task.id, bytes, width: 1, height: 1, mimeType: 'image/jpeg' }],
      port,
    );
    expect(result.tasks[0].photo?.uri).toBe(`file://${task.id}.jpg`);
  });

  test('removes all already-written files when a later write fails', async () => {
    const first = createTask('One');
    const second = createTask('Two');
    const list = createTaskList('List', 'general', { tasks: [first, second] });
    const port = new FakePort();
    port.failAt = 1;

    await expect(
      attachPackagePhotos(
        list,
        [first, second].map((task) => ({
          taskId: task.id,
          bytes,
          width: 1,
          height: 1,
          mimeType: 'image/jpeg' as const,
        })),
        port,
      ),
    ).rejects.toThrow('disk full');
    expect(port.deleted).toEqual([`file://${first.id}.jpg`]);
  });
});
