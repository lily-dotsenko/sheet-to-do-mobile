import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { LocalImageAttachment, createId } from '@/domain/models';

import { LocalImageLifecyclePort } from './local-image-lifecycle';

const BACKGROUND_DIRECTORY = 'custom-backgrounds';
const MAX_BACKGROUND_EDGE = 2400;

export class BackgroundFileStore implements LocalImageLifecyclePort {
  async pickAndSave(): Promise<LocalImageAttachment | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      selectionLimit: 1,
    });
    if (result.canceled) return null;

    const asset = result.assets[0];
    const context = ImageManipulator.manipulate(asset.uri);
    if (asset.width > MAX_BACKGROUND_EDGE || asset.height > MAX_BACKGROUND_EDGE) {
      context.resize(
        asset.width >= asset.height
          ? { width: MAX_BACKGROUND_EDGE }
          : { height: MAX_BACKGROUND_EDGE },
      );
    }
    const rendered = await context.renderAsync();
    const compressed = await rendered.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
    const directory = this.directory();
    directory.create({ intermediates: true, idempotent: true });
    const source = new File(compressed.uri);
    const destination = new File(directory, `background-${createId()}.jpg`);
    await source.copy(destination);
    if (source.exists) source.delete();
    return {
      uri: destination.uri,
      width: compressed.width,
      height: compressed.height,
      mimeType: 'image/jpeg',
    };
  }

  async exists(uri: string): Promise<boolean> {
    return this.isManagedUri(uri) && new File(uri).exists;
  }

  async delete(uri: string): Promise<void> {
    if (!this.isManagedUri(uri)) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  }

  private isManagedUri(uri: string): boolean {
    return uri.startsWith(`${this.directory().uri.replace(/\/?$/, '')}/`);
  }

  private directory(): Directory {
    return new Directory(Paths.document, BACKGROUND_DIRECTORY);
  }
}

export const backgroundFiles = new BackgroundFileStore();
