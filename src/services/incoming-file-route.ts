export function incomingFileRoute(path: string): string | null {
  const normalized = path.trim();
  if (!/^(content|file):\/\//i.test(normalized)) return null;
  return `/import-file?uri=${encodeURIComponent(normalized)}`;
}
