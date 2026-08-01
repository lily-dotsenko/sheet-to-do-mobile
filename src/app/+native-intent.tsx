import { incomingFileRoute } from '@/services/incoming-file-route';

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return incomingFileRoute(path) ?? path;
}
