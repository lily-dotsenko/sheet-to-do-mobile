import { PhotoFilePort, deletePhotoSafely } from './photo-cleanup';

class FakePhotoFiles implements PhotoFilePort {
  files = new Set<string>();
  deleted: string[] = [];

  async exists(uri: string): Promise<boolean> {
    return this.files.has(uri);
  }

  async delete(uri: string): Promise<void> {
    this.deleted.push(uri);
    this.files.delete(uri);
  }
}

describe('photo file cleanup', () => {
  test('deletes an existing local photo', async () => {
    const files = new FakePhotoFiles();
    files.files.add('file://photo.jpg');

    await expect(deletePhotoSafely(files, 'file://photo.jpg')).resolves.toBe(true);
    expect(files.deleted).toEqual(['file://photo.jpg']);
  });

  test('handles a photo that is already missing', async () => {
    const files = new FakePhotoFiles();

    await expect(deletePhotoSafely(files, 'file://missing.jpg')).resolves.toBe(false);
    expect(files.deleted).toEqual([]);
  });
});
