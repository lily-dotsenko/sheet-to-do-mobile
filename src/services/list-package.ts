import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

import { MAX_TASKS_PER_LIST, TaskList, createTask, createTaskList } from '@/domain/models';

import { ListImportError } from './list-transfer';

export const PACKAGE_FORMAT = 'sheet-to-do-package' as const;
export const PACKAGE_VERSION = 1 as const;
export const PACKAGE_EXTENSION = '.sheettodo';
export const PACKAGE_MIME_TYPE = 'application/vnd.sheet-to-do.list';
export const PACKAGE_SHARE_MIME_TYPE = 'application/octet-stream';
export const MAX_PACKAGE_BYTES = 64 * 1024 * 1024;
export const MAX_PACKAGE_UNCOMPRESSED_BYTES = 80 * 1024 * 1024;
export const MAX_PACKAGE_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_PACKAGE_PHOTOS = 200;

const MANIFEST_PATH = 'manifest.json';
const MAX_MANIFEST_BYTES = 1_000_000;
const PHOTO_PATH_PATTERN = /^photos\/[0-9]{4}\.jpg$/;

type PackagePhotoDescriptor = {
  path: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
  byteSize: number;
  crc32: string;
};

type PackageManifest = {
  format: typeof PACKAGE_FORMAT;
  version: typeof PACKAGE_VERSION;
  exportedAt: string;
  list: {
    title: string;
    iconId: string;
    tasks: {
      text: string;
      completed: boolean;
      photo: PackagePhotoDescriptor | null;
    }[];
  };
};

export type PackagePhotoInput = {
  taskId: string;
  bytes: Uint8Array;
  width: number;
  height: number;
};

export type ParsedPackagePhoto = {
  taskId: string;
  bytes: Uint8Array;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
};

export type ParsedListPackage = {
  list: TaskList;
  photos: ParsedPackagePhoto[];
  missingPhotos: number;
};

export function createListPackage(list: TaskList, photoInputs: PackagePhotoInput[]): Uint8Array {
  if (photoInputs.length > MAX_PACKAGE_PHOTOS) throw new ListImportError('tooLarge');
  const photosByTask = new Map<string, PackagePhotoInput>();
  for (const photo of photoInputs) {
    if (
      photosByTask.has(photo.taskId) ||
      photo.bytes.length === 0 ||
      photo.bytes.length > MAX_PACKAGE_PHOTO_BYTES ||
      !isJpeg(photo.bytes) ||
      !validDimension(photo.width) ||
      !validDimension(photo.height)
    ) {
      throw new ListImportError('invalidFormat');
    }
    photosByTask.set(photo.taskId, photo);
  }

  const knownTaskIds = new Set(list.tasks.map((task) => task.id));
  if ([...photosByTask.keys()].some((taskId) => !knownTaskIds.has(taskId))) {
    throw new ListImportError('invalidFormat');
  }

  const zipEntries: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {};
  let photoIndex = 0;
  const manifest: PackageManifest = {
    format: PACKAGE_FORMAT,
    version: PACKAGE_VERSION,
    exportedAt: new Date().toISOString(),
    list: {
      title: list.title,
      iconId: list.iconId,
      tasks: list.tasks.map((task) => {
        const photo = photosByTask.get(task.id);
        if (!photo) return { text: task.text, completed: task.completed, photo: null };
        photoIndex += 1;
        const path = `photos/${String(photoIndex).padStart(4, '0')}.jpg`;
        zipEntries[path] = [photo.bytes, { level: 0 }];
        return {
          text: task.text,
          completed: task.completed,
          photo: {
            path,
            width: photo.width,
            height: photo.height,
            mimeType: 'image/jpeg',
            byteSize: photo.bytes.length,
            crc32: crc32Hex(photo.bytes),
          },
        };
      }),
    },
  };
  zipEntries[MANIFEST_PATH] = strToU8(JSON.stringify(manifest, null, 2));
  const archive = zipSync(zipEntries, { level: 6 });
  if (archive.length > MAX_PACKAGE_BYTES) throw new ListImportError('tooLarge');
  return archive;
}

export function parseListPackage(archive: Uint8Array): ParsedListPackage {
  if (archive.length === 0 || archive.length > MAX_PACKAGE_BYTES || !hasZipSignature(archive)) {
    throw new ListImportError('invalidArchive');
  }

  const names = new Set<string>();
  let totalUncompressed = 0;
  let photoCount = 0;
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(archive, {
      filter: (entry) => {
        validateEntryName(entry.name);
        if (names.has(entry.name)) throw new ListImportError('unsafeArchive');
        names.add(entry.name);
        if (entry.name === MANIFEST_PATH) {
          if (entry.originalSize > MAX_MANIFEST_BYTES) throw new ListImportError('tooLarge');
        } else {
          photoCount += 1;
          if (photoCount > MAX_PACKAGE_PHOTOS || entry.originalSize > MAX_PACKAGE_PHOTO_BYTES) {
            throw new ListImportError('tooLarge');
          }
        }
        totalUncompressed += entry.originalSize;
        if (totalUncompressed > MAX_PACKAGE_UNCOMPRESSED_BYTES) {
          throw new ListImportError('tooLarge');
        }
        return true;
      },
    });
  } catch (error) {
    if (error instanceof ListImportError) throw error;
    throw new ListImportError('invalidArchive');
  }

  const manifestBytes = entries[MANIFEST_PATH];
  if (!manifestBytes || manifestBytes.length > MAX_MANIFEST_BYTES) {
    throw new ListImportError('invalidArchive');
  }

  let raw: unknown;
  try {
    raw = JSON.parse(strFromU8(manifestBytes));
  } catch {
    throw new ListImportError('invalidArchive');
  }
  const manifest = parseManifest(raw);
  const referencedPaths = new Set<string>();
  const photos: ParsedPackagePhoto[] = [];
  let missingPhotos = 0;
  const tasks = manifest.list.tasks.map((rawTask) => {
    const task = createTask(rawTask.text, { completed: rawTask.completed });
    if (!rawTask.photo) return task;
    if (referencedPaths.has(rawTask.photo.path)) throw new ListImportError('invalidArchive');
    referencedPaths.add(rawTask.photo.path);
    const bytes = entries[rawTask.photo.path];
    if (!bytes) {
      missingPhotos += 1;
      return task;
    }
    if (
      bytes.length !== rawTask.photo.byteSize ||
      crc32Hex(bytes) !== rawTask.photo.crc32 ||
      !isJpeg(bytes)
    ) {
      throw new ListImportError('invalidArchive');
    }
    photos.push({
      taskId: task.id,
      bytes,
      width: rawTask.photo.width,
      height: rawTask.photo.height,
      mimeType: 'image/jpeg',
    });
    return task;
  });

  const archivedPhotoPaths = Object.keys(entries).filter((name) => name !== MANIFEST_PATH);
  if (archivedPhotoPaths.some((path) => !referencedPaths.has(path))) {
    throw new ListImportError('unsafeArchive');
  }

  return {
    list: createTaskList(manifest.list.title, manifest.list.iconId, { tasks }),
    photos,
    missingPhotos,
  };
}

function parseManifest(value: unknown): PackageManifest {
  if (!isRecord(value) || value.format !== PACKAGE_FORMAT) {
    throw new ListImportError('invalidArchive');
  }
  if (value.version !== PACKAGE_VERSION) throw new ListImportError('unsupportedVersion');
  if (typeof value.exportedAt !== 'string' || Number.isNaN(Date.parse(value.exportedAt))) {
    throw new ListImportError('invalidArchive');
  }
  if (!isRecord(value.list)) throw new ListImportError('invalidArchive');
  const title = parseText(value.list.title, 60);
  const iconId = parseText(value.list.iconId, 40);
  if (!Array.isArray(value.list.tasks) || value.list.tasks.length > MAX_TASKS_PER_LIST) {
    throw new ListImportError('invalidArchive');
  }
  const tasks = value.list.tasks.map((task) => {
    if (!isRecord(task) || typeof task.completed !== 'boolean') {
      throw new ListImportError('invalidArchive');
    }
    return {
      text: parseText(task.text, 160),
      completed: task.completed,
      photo: parsePhotoDescriptor(task.photo),
    };
  });
  return {
    format: PACKAGE_FORMAT,
    version: PACKAGE_VERSION,
    exportedAt: value.exportedAt,
    list: { title, iconId, tasks },
  };
}

function parsePhotoDescriptor(value: unknown): PackagePhotoDescriptor | null {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    typeof value.path !== 'string' ||
    !PHOTO_PATH_PATTERN.test(value.path) ||
    value.mimeType !== 'image/jpeg' ||
    !validDimension(value.width) ||
    !validDimension(value.height) ||
    !Number.isSafeInteger(value.byteSize) ||
    (value.byteSize as number) <= 0 ||
    (value.byteSize as number) > MAX_PACKAGE_PHOTO_BYTES ||
    typeof value.crc32 !== 'string' ||
    !/^[0-9a-f]{8}$/.test(value.crc32)
  ) {
    throw new ListImportError('invalidArchive');
  }
  return {
    path: value.path,
    width: value.width as number,
    height: value.height as number,
    mimeType: 'image/jpeg',
    byteSize: value.byteSize as number,
    crc32: value.crc32,
  };
}

function validateEntryName(name: string): void {
  if (name !== MANIFEST_PATH && !PHOTO_PATH_PATTERN.test(name)) {
    throw new ListImportError('unsafeArchive');
  }
}

function hasZipSignature(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

function isJpeg(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[bytes.length - 2] === 0xff &&
    bytes[bytes.length - 1] === 0xd9
  );
}

function validDimension(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 10_000;
}

function parseText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') throw new ListImportError('invalidArchive');
  const text = value.trim();
  if (!text || text.length > maxLength) throw new ListImportError('invalidArchive');
  return text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function crc32Hex(bytes: Uint8Array): string {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
}
