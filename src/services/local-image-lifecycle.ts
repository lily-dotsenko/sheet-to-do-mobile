import { LocalImageAttachment } from '@/domain/models';

export interface LocalImageLifecyclePort {
  delete(uri: string): Promise<void>;
}

export async function replaceLocalImage(
  previous: LocalImageAttachment | null,
  createNext: () => Promise<LocalImageAttachment | null>,
  applyNext: (next: LocalImageAttachment) => void,
  port: LocalImageLifecyclePort,
): Promise<boolean> {
  const next = await createNext();
  if (!next) return false;
  applyNext(next);
  if (previous && previous.uri !== next.uri) {
    await Promise.allSettled([port.delete(previous.uri)]);
  }
  return true;
}

export async function removeLocalImage(
  image: LocalImageAttachment | null,
  applyRemoval: () => void,
  port: LocalImageLifecyclePort,
): Promise<void> {
  applyRemoval();
  if (image) await Promise.allSettled([port.delete(image.uri)]);
}
