import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

import { TaskList, doneCount } from '@/domain/models';

import {
  MAX_PACKAGE_BYTES,
  PACKAGE_EXTENSION,
  PACKAGE_MIME_TYPE,
  PACKAGE_SHARE_MIME_TYPE,
  PackagePhotoInput,
  ParsedListPackage,
  createListPackage,
  parseListPackage,
} from './list-package';
import {
  ListImportError,
  createImportDeepLink,
  formatListAsText,
  parseListJson,
  serializeList,
} from './list-transfer';
import { photoFiles } from './photo-files';

export type PickedListImport =
  | { kind: 'json'; list: TaskList; photos: []; missingPhotos: 0 }
  | ({ kind: 'package' } & ParsedListPackage);

export async function shareListAsText(
  list: TaskList,
  title: string,
  labels: { progress: string; empty: string },
): Promise<void> {
  await Share.share({ message: formatListAsText(list, labels), title });
}

export async function shareListAsJson(list: TaskList, dialogTitle: string): Promise<void> {
  const file = createCacheFile(`${safeFileName(list.title)}-sheet-to-do.json`);
  try {
    file.write(serializeList(list));
    if (!(await Sharing.isAvailableAsync())) {
      await Share.share({ message: await file.text(), title: dialogTitle });
      return;
    }
    await Sharing.shareAsync(file.uri, {
      dialogTitle,
      mimeType: 'application/json',
      UTI: 'public.json',
    });
  } finally {
    if (file.exists) file.delete();
  }
}

export async function shareListAsSheetFile(
  list: TaskList,
  dialogTitle: string,
): Promise<{ includedPhotos: number; omittedPhotos: number }> {
  const photoInputs: PackagePhotoInput[] = [];
  let omittedPhotos = 0;
  for (const task of list.tasks) {
    if (!task.photo) continue;
    const bytes = await photoFiles.read(task.photo.uri);
    if (!bytes) {
      omittedPhotos += 1;
      continue;
    }
    photoInputs.push({
      taskId: task.id,
      bytes,
      width: task.photo.width,
      height: task.photo.height,
    });
  }

  if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is unavailable');
  const file = createCacheFile(`${safeFileName(list.title)}${PACKAGE_EXTENSION}`);
  try {
    file.write(createListPackage(list, photoInputs));
    await Sharing.shareAsync(file.uri, {
      dialogTitle,
      // A generic MIME type preserves the custom extension in common messengers.
      mimeType: PACKAGE_SHARE_MIME_TYPE,
      UTI: 'public.data',
    });
  } finally {
    if (file.exists) file.delete();
  }
  return { includedPhotos: photoInputs.length, omittedPhotos };
}

export async function shareListAsDeepLink(list: TaskList, title: string): Promise<void> {
  await Share.share({ message: createImportDeepLink(list), title });
}

export async function pickListImport(): Promise<PickedListImport | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/zip',
      'application/x-zip-compressed',
      PACKAGE_MIME_TYPE,
      'application/octet-stream',
      'application/json',
      'text/json',
      'text/plain',
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const file = new File(asset.uri);
  try {
    if ((asset.size ?? file.size ?? 0) > MAX_PACKAGE_BYTES) {
      throw new ListImportError('tooLarge');
    }
    const bytes = await file.bytes();
    if (isZip(bytes)) return { kind: 'package', ...parseListPackage(bytes) };
    const json = await file.text();
    return { kind: 'json', list: parseListJson(json), photos: [], missingPhotos: 0 };
  } finally {
    if (file.exists && file.uri.includes('/cache/')) file.delete();
  }
}

export async function readIncomingSheetFile(uri: string): Promise<PickedListImport> {
  const file = new File(uri);
  let bytes: Uint8Array;
  try {
    if ((file.size ?? 0) > MAX_PACKAGE_BYTES) throw new ListImportError('tooLarge');
    bytes = await file.bytes();
  } catch (error) {
    if (error instanceof ListImportError) throw error;
    throw new ListImportError('invalidFormat');
  }
  if (!isZip(bytes)) throw new ListImportError('invalidArchive');
  return { kind: 'package', ...parseListPackage(bytes) };
}

export function listTextLabels(
  list: TaskList,
  t: (key: 'progress' | 'noTasks', params?: Record<string, number>) => string,
) {
  return {
    progress: t('progress', { done: doneCount(list), total: list.tasks.length }),
    empty: t('noTasks'),
  };
}

function createCacheFile(name: string): File {
  const directory = new Directory(Paths.cache, 'exports');
  directory.create({ intermediates: true, idempotent: true });
  const file = new File(directory, name);
  file.create({ intermediates: true, overwrite: true });
  return file;
}

function safeFileName(title: string): string {
  return (
    title
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}-]+/gu, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'sheet'
  );
}

function isZip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
}
