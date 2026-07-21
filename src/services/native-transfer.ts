import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

import { TaskList } from '@/domain/models';

import { createImportDeepLink, parseListJson, serializeList } from './list-transfer';

export async function shareListAsJson(list: TaskList, dialogTitle: string): Promise<void> {
  const directory = new Directory(Paths.cache, 'exports');
  directory.create({ intermediates: true, idempotent: true });
  const safeName = list.title
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const file = new File(directory, `${safeName || 'sheet'}-sheet-to-do.json`);
  file.create({ intermediates: true, overwrite: true });
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
}

export async function shareListAsDeepLink(list: TaskList, title: string): Promise<void> {
  await Share.share({ message: createImportDeepLink(list), title });
}

export async function pickListJson(): Promise<TaskList | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  if ((result.assets[0].size ?? 0) > 1_000_000) {
    return parseListJson(' '.repeat(1_000_001));
  }
  return parseListJson(await new File(result.assets[0].uri).text());
}
