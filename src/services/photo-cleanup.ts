export interface PhotoFilePort {
  exists(uri: string): Promise<boolean>;
  delete(uri: string): Promise<void>;
}

export async function deletePhotoSafely(port: PhotoFilePort, uri: string | null): Promise<boolean> {
  if (!uri) return false;
  try {
    if (!(await port.exists(uri))) return false;
    await port.delete(uri);
    return true;
  } catch {
    return false;
  }
}
