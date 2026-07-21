import { MAX_TASKS_PER_LIST, TaskList, createTask, createTaskList } from '@/domain/models';

export const TRANSFER_FORMAT = 'sheet-to-do' as const;
export const TRANSFER_VERSION = 1 as const;
export const MAX_IMPORT_JSON_LENGTH = 1_000_000;
export const MAX_DEEP_LINK_LENGTH = 50_000;

type ExportEnvelope = {
  format: typeof TRANSFER_FORMAT;
  version: typeof TRANSFER_VERSION;
  exportedAt: string;
  photosOmitted: number;
  list: {
    title: string;
    iconId: string;
    tasks: { text: string; completed: boolean }[];
  };
};

export type ImportErrorCode = 'invalidJson' | 'invalidFormat' | 'unsupportedVersion' | 'tooLarge';

export class ListImportError extends Error {
  constructor(readonly code: ImportErrorCode) {
    super(code);
  }
}

export function serializeList(list: TaskList, pretty = true): string {
  const envelope: ExportEnvelope = {
    format: TRANSFER_FORMAT,
    version: TRANSFER_VERSION,
    exportedAt: new Date().toISOString(),
    photosOmitted: list.tasks.filter((task) => task.photo !== null).length,
    list: {
      title: list.title,
      iconId: list.iconId,
      tasks: list.tasks.map((task) => ({ text: task.text, completed: task.completed })),
    },
  };
  return JSON.stringify(envelope, null, pretty ? 2 : 0);
}

export function parseListJson(json: string): TaskList {
  if (json.length > MAX_IMPORT_JSON_LENGTH) throw new ListImportError('tooLarge');
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new ListImportError('invalidJson');
  }
  if (!isRecord(raw)) throw new ListImportError('invalidFormat');

  if (raw.format === TRANSFER_FORMAT) {
    if (raw.version !== TRANSFER_VERSION) throw new ListImportError('unsupportedVersion');
    return parseListPayload(raw.list);
  }

  // Accept a list exported by the original browser version.
  if ('name' in raw || 'title' in raw) {
    return parseLegacyWebList(raw);
  }
  throw new ListImportError('invalidFormat');
}

export function createImportDeepLink(list: TaskList): string {
  const data = encodeBase64Url(serializeList(list, false));
  if (data.length > MAX_DEEP_LINK_LENGTH) throw new ListImportError('tooLarge');
  return `sheettodo:///import?data=${data}`;
}

export function parseDeepLinkData(data: string): TaskList {
  if (!data || data.length > MAX_DEEP_LINK_LENGTH || !/^[A-Za-z0-9_-]+$/.test(data)) {
    throw new ListImportError('invalidFormat');
  }
  try {
    return parseListJson(decodeBase64Url(data));
  } catch (error) {
    if (error instanceof ListImportError) throw error;
    throw new ListImportError('invalidFormat');
  }
}

function parseListPayload(value: unknown): TaskList {
  if (!isRecord(value)) throw new ListImportError('invalidFormat');
  const title = parseText(value.title, 60);
  const iconId = typeof value.iconId === 'string' ? value.iconId.slice(0, 40) : 'general';
  if (!Array.isArray(value.tasks) || value.tasks.length > MAX_TASKS_PER_LIST) {
    throw new ListImportError('invalidFormat');
  }
  const tasks = value.tasks.map((task) => {
    if (!isRecord(task) || typeof task.completed !== 'boolean') {
      throw new ListImportError('invalidFormat');
    }
    return createTask(parseText(task.text, 160), { completed: task.completed });
  });
  return createTaskList(title, iconId || 'general', { tasks });
}

function parseLegacyWebList(value: Record<string, unknown>): TaskList {
  const title = parseText(value.title ?? value.name, 60);
  const iconId = mapLegacyIcon(value.icon ?? value.iconId);
  if (!Array.isArray(value.tasks) || value.tasks.length > MAX_TASKS_PER_LIST) {
    throw new ListImportError('invalidFormat');
  }
  const tasks = value.tasks.map((task) => {
    if (!isRecord(task)) throw new ListImportError('invalidFormat');
    const completed = typeof task.completed === 'boolean' ? task.completed : task.done === true;
    return createTask(parseText(task.text, 160), { completed });
  });
  return createTaskList(title, iconId, { tasks });
}

function parseText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') throw new ListImportError('invalidFormat');
  const text = value.trim();
  if (!text || text.length > maxLength) throw new ListImportError('invalidFormat');
  return text;
}

function mapLegacyIcon(value: unknown): string {
  const icons: Record<string, string> = {
    'bi-list-task': 'general',
    'bi-briefcase-fill': 'work',
    'bi-house-fill': 'home',
    'bi-cart-fill': 'shopping',
    'bi-book-fill': 'study',
    'bi-heart-pulse-fill': 'health',
    'bi-airplane-fill': 'travel',
    'bi-piggy-bank-fill': 'finance',
    'bi-people-fill': 'family',
    'bi-star-fill': 'important',
    'bi-tools': 'diy',
    'bi-music-note-beamed': 'fun',
  };
  if (typeof value !== 'string') return 'general';
  return icons[value] ?? value.slice(0, 40) ?? 'general';
}

function encodeBase64Url(text: string): string {
  const bytes = encodeUtf8(text);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b !== undefined) output += alphabet[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c !== undefined) output += alphabet[c & 63];
  }
  return output;
}

function decodeBase64Url(value: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 4) {
    const a = alphabet.indexOf(value[index]);
    const b = alphabet.indexOf(value[index + 1]);
    const c = value[index + 2] === undefined ? -1 : alphabet.indexOf(value[index + 2]);
    const d = value[index + 3] === undefined ? -1 : alphabet.indexOf(value[index + 3]);
    if (a < 0 || b < 0 || c < -1 || d < -1) throw new Error('Invalid base64');
    bytes.push((a << 2) | (b >> 4));
    if (c >= 0) bytes.push(((b & 15) << 4) | (c >> 2));
    if (d >= 0) bytes.push(((c & 3) << 6) | d);
  }
  return decodeUtf8(bytes);
}

function encodeUtf8(text: string): number[] {
  const bytes: number[] = [];
  for (const character of text) {
    const codePoint = character.codePointAt(0)!;
    if (codePoint <= 0x7f) bytes.push(codePoint);
    else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return bytes;
}

function decodeUtf8(bytes: number[]): string {
  let output = '';
  for (let index = 0; index < bytes.length;) {
    const first = bytes[index++];
    if (first < 0x80) output += String.fromCodePoint(first);
    else if ((first & 0xe0) === 0xc0) {
      output += String.fromCodePoint(((first & 0x1f) << 6) | nextContinuation(bytes, index++));
    } else if ((first & 0xf0) === 0xe0) {
      output += String.fromCodePoint(
        ((first & 0x0f) << 12) |
          (nextContinuation(bytes, index++) << 6) |
          nextContinuation(bytes, index++),
      );
    } else if ((first & 0xf8) === 0xf0) {
      output += String.fromCodePoint(
        ((first & 0x07) << 18) |
          (nextContinuation(bytes, index++) << 12) |
          (nextContinuation(bytes, index++) << 6) |
          nextContinuation(bytes, index++),
      );
    } else throw new Error('Invalid UTF-8');
  }
  return output;
}

function nextContinuation(bytes: number[], index: number): number {
  const value = bytes[index];
  if (value === undefined || (value & 0xc0) !== 0x80) throw new Error('Invalid UTF-8');
  return value & 0x3f;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
