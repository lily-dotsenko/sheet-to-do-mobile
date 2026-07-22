import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { PhotoAttachment, createId } from '@/domain/models';

import { PhotoFilePort } from './photo-cleanup';
import { ParsedPackagePhoto } from './list-package';
import { PackagePhotoImportPort } from './package-photo-import';

const PHOTO_DIRECTORY = 'task-photos';
const MAX_PHOTO_EDGE = 1600;

export type PickPhotoResult =
  { status: 'picked'; photo: PhotoAttachment } | { status: 'cancelled' };

export class PhotoFileStore implements PhotoFilePort, PackagePhotoImportPort {
  async pickAndSave(): Promise<PickPhotoResult> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      selectionLimit: 1,
    });
    if (result.canceled) return { status: 'cancelled' };
    const asset = result.assets[0];
    const context = ImageManipulator.manipulate(asset.uri);
    if (asset.width > MAX_PHOTO_EDGE || asset.height > MAX_PHOTO_EDGE) {
      context.resize(
        asset.width >= asset.height ? { width: MAX_PHOTO_EDGE } : { height: MAX_PHOTO_EDGE },
      );
    }
    const rendered = await context.renderAsync();
    const compressed = await rendered.saveAsync({
      compress: 0.76,
      format: SaveFormat.JPEG,
    });

    const directory = this.directory();
    directory.create({ intermediates: true, idempotent: true });
    const source = new File(compressed.uri);
    const destination = new File(directory, `task-${createId()}.jpg`);
    await source.copy(destination);
    if (source.exists) source.delete();

    return {
      status: 'picked',
      photo: {
        uri: destination.uri,
        width: compressed.width,
        height: compressed.height,
        mimeType: 'image/jpeg',
      },
    };
  }

  async exists(uri: string): Promise<boolean> {
    return this.isManagedUri(uri) && new File(uri).exists;
  }

  async read(uri: string): Promise<Uint8Array | null> {
    if (!(await this.exists(uri))) return null;
    return new File(uri).bytes();
  }

  async save(photo: ParsedPackagePhoto): Promise<PhotoAttachment> {
    const directory = this.directory();
    directory.create({ intermediates: true, idempotent: true });
    const destination = new File(directory, `task-${createId()}.jpg`);
    destination.create({ intermediates: true, overwrite: false });
    destination.write(photo.bytes);
    return {
      uri: destination.uri,
      width: photo.width,
      height: photo.height,
      mimeType: 'image/jpeg',
    };
  }

  async delete(uri: string): Promise<void> {
    if (!this.isManagedUri(uri)) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  }

  isManagedUri(uri: string): boolean {
    const root = `${this.directory().uri.replace(/\/?$/, '')}/`;
    return uri.startsWith(root);
  }

  private directory(): Directory {
    return new Directory(Paths.document, PHOTO_DIRECTORY);
  }
}

export const photoFiles = new PhotoFileStore();
