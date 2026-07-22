import { PhotoAttachment, TaskList } from '@/domain/models';

import { ParsedPackagePhoto } from './list-package';

export interface PackagePhotoImportPort {
  save(photo: ParsedPackagePhoto): Promise<PhotoAttachment>;
  delete(uri: string): Promise<void>;
}

export async function attachPackagePhotos(
  list: TaskList,
  photos: ParsedPackagePhoto[],
  port: PackagePhotoImportPort,
): Promise<TaskList> {
  const saved = new Map<string, PhotoAttachment>();
  try {
    for (const photo of photos) {
      if (saved.has(photo.taskId) || !list.tasks.some((task) => task.id === photo.taskId)) {
        throw new Error('Package photo does not match a unique task');
      }
      saved.set(photo.taskId, await port.save(photo));
    }
  } catch (error) {
    await Promise.allSettled([...saved.values()].map((photo) => port.delete(photo.uri)));
    throw error;
  }

  return {
    ...list,
    tasks: list.tasks.map((task) => ({ ...task, photo: saved.get(task.id) ?? null })),
  };
}

export async function deleteListPhotos(
  list: TaskList,
  port: PackagePhotoImportPort,
): Promise<void> {
  await Promise.allSettled(
    list.tasks.flatMap((task) => (task.photo ? [port.delete(task.photo.uri)] : [])),
  );
}
