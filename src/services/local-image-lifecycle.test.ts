import { LocalImageAttachment } from '@/domain/models';

import {
  LocalImageLifecyclePort,
  removeLocalImage,
  replaceLocalImage,
} from './local-image-lifecycle';

class FakeImages implements LocalImageLifecyclePort {
  deleted: string[] = [];
  async delete(uri: string): Promise<void> {
    this.deleted.push(uri);
  }
}

const image = (uri: string): LocalImageAttachment => ({
  uri,
  width: 100,
  height: 100,
  mimeType: 'image/jpeg',
});

describe('custom background lifecycle', () => {
  test('applies a new background before deleting the previous file', async () => {
    const events: string[] = [];
    const port = new FakeImages();
    port.delete = async (uri) => {
      events.push(`delete:${uri}`);
    };
    await replaceLocalImage(
      image('old'),
      async () => image('new'),
      (next) => events.push(`apply:${next.uri}`),
      port,
    );
    expect(events).toEqual(['apply:new', 'delete:old']);
  });

  test('keeps the current background when the picker is cancelled', async () => {
    const port = new FakeImages();
    const applied = jest.fn();
    await expect(replaceLocalImage(image('old'), async () => null, applied, port)).resolves.toBe(
      false,
    );
    expect(applied).not.toHaveBeenCalled();
    expect(port.deleted).toEqual([]);
  });

  test('clears metadata before deleting a removed background', async () => {
    const events: string[] = [];
    const port = new FakeImages();
    port.delete = async (uri) => {
      events.push(`delete:${uri}`);
    };
    await removeLocalImage(image('old'), () => events.push('apply:null'), port);
    expect(events).toEqual(['apply:null', 'delete:old']);
  });
});
