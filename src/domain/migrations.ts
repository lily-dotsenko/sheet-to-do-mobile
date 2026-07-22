import {
  AppData,
  DATA_VERSION,
  Language,
  LocalImageAttachment,
  MAX_LISTS,
  MAX_TASKS_PER_LIST,
  Task,
  TaskList,
  ThemeId,
  createEmptyData,
  createId,
} from './models';

export class MigrationError extends Error {}

const THEME_IDS = new Set<ThemeId>(['twilight', 'winter', 'spring', 'autumn']);
const LANGUAGES = new Set<Language>(['uk', 'en']);

const legacyThemeMap: Record<string, ThemeId> = {
  girl_and_cats_chill: 'twilight',
  black_cat: 'autumn',
  house_with_cats: 'spring',
  snow: 'winter',
};

const legacyIconMap: Record<string, string> = {
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

export function migrateStoredData(raw: unknown, now = new Date().toISOString()): AppData {
  if (Array.isArray(raw)) {
    return migrateLegacyLists(raw, {}, now);
  }
  if (!isRecord(raw)) {
    throw new MigrationError('Stored data must be an object');
  }
  if (raw.version === DATA_VERSION) {
    return parseVersionTwo(raw);
  }
  if (raw.version === 1) {
    return migrateVersionOne(raw);
  }
  if (raw.version === 0 || raw.version === undefined) {
    const lists = Array.isArray(raw.lists) ? raw.lists : [];
    return migrateLegacyLists(lists, raw, now);
  }
  throw new MigrationError('Unsupported data version');
}

function parseVersionTwo(raw: Record<string, unknown>): AppData {
  if (!Array.isArray(raw.lists) || raw.lists.length > MAX_LISTS) {
    throw new MigrationError('Invalid lists');
  }
  if (!isRecord(raw.preferences)) {
    throw new MigrationError('Invalid preferences');
  }
  const themeId = parseTheme(raw.preferences.themeId);
  const customBackground = parseLocalImage(raw.preferences.customBackground);
  const language = parseLanguage(raw.preferences.language);
  return {
    version: DATA_VERSION,
    lists: raw.lists.map(parseList),
    preferences: { themeId, customBackground, language },
    updatedAt: parseDate(raw.updatedAt),
  };
}

function migrateVersionOne(raw: Record<string, unknown>): AppData {
  if (!Array.isArray(raw.lists) || raw.lists.length > MAX_LISTS) {
    throw new MigrationError('Invalid lists');
  }
  if (!isRecord(raw.preferences)) {
    throw new MigrationError('Invalid preferences');
  }
  return {
    version: DATA_VERSION,
    lists: raw.lists.map(parseList),
    preferences: {
      themeId: parseTheme(raw.preferences.themeId),
      customBackground: null,
      language: parseLanguage(raw.preferences.language),
    },
    updatedAt: parseDate(raw.updatedAt),
  };
}

function migrateLegacyLists(
  rawLists: unknown[],
  container: Record<string, unknown>,
  now: string,
): AppData {
  if (rawLists.length > MAX_LISTS) {
    throw new MigrationError('Too many lists');
  }
  const base = createEmptyData(now);
  const legacyTheme =
    typeof container.backgroundId === 'string' ? legacyThemeMap[container.backgroundId] : undefined;
  return {
    ...base,
    lists: rawLists.map((raw) => parseLegacyList(raw, now)),
    preferences: {
      themeId: legacyTheme ?? parseTheme(container.themeId, 'twilight'),
      customBackground: null,
      language: parseLanguage(container.language, null),
    },
  };
}

function parseList(value: unknown): TaskList {
  if (!isRecord(value) || !Array.isArray(value.tasks)) {
    throw new MigrationError('Invalid list');
  }
  if (value.tasks.length > MAX_TASKS_PER_LIST) {
    throw new MigrationError('Too many tasks');
  }
  return {
    id: parseNonEmptyString(value.id, 100),
    title: parseNonEmptyString(value.title, 60),
    iconId: parseNonEmptyString(value.iconId, 40),
    tasks: value.tasks.map(parseTask),
    createdAt: parseDate(value.createdAt),
  };
}

function parseLegacyList(value: unknown, now: string): TaskList {
  if (!isRecord(value)) {
    throw new MigrationError('Invalid legacy list');
  }
  const rawTasks = Array.isArray(value.tasks) ? value.tasks : [];
  if (rawTasks.length > MAX_TASKS_PER_LIST) {
    throw new MigrationError('Too many tasks');
  }
  const rawIcon = typeof value.icon === 'string' ? value.icon : value.iconId;
  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId(),
    title: parseNonEmptyString(value.title ?? value.name, 60),
    iconId:
      typeof rawIcon === 'string' ? (legacyIconMap[rawIcon] ?? rawIcon.slice(0, 40)) : 'general',
    tasks: rawTasks.map((task) => parseLegacyTask(task, now)),
    createdAt: typeof value.createdAt === 'string' ? parseDate(value.createdAt) : now,
  };
}

function parseTask(value: unknown): Task {
  if (!isRecord(value)) {
    throw new MigrationError('Invalid task');
  }
  if (typeof value.completed !== 'boolean') {
    throw new MigrationError('Invalid task state');
  }
  return {
    id: parseNonEmptyString(value.id, 100),
    text: parseNonEmptyString(value.text, 160),
    completed: value.completed,
    photo: parseLocalImage(value.photo),
    createdAt: parseDate(value.createdAt),
  };
}

function parseLegacyTask(value: unknown, now: string): Task {
  if (!isRecord(value)) {
    throw new MigrationError('Invalid legacy task');
  }
  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId(),
    text: parseNonEmptyString(value.text, 160),
    completed: typeof value.completed === 'boolean' ? value.completed : value.done === true,
    // Browser base64 images cannot safely become durable files during a synchronous migration.
    photo: isRecord(value.photo) ? parseLocalImage(value.photo) : null,
    createdAt: typeof value.createdAt === 'string' ? parseDate(value.createdAt) : now,
  };
}

function parseLocalImage(value: unknown): LocalImageAttachment | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) throw new MigrationError('Invalid photo');
  const uri = parseNonEmptyString(value.uri, 1000);
  if (!uri.startsWith('file://')) throw new MigrationError('Invalid photo path');
  if (!isPositiveNumber(value.width) || !isPositiveNumber(value.height)) {
    throw new MigrationError('Invalid photo size');
  }
  if (value.mimeType !== 'image/jpeg') throw new MigrationError('Invalid photo type');
  return { uri, width: value.width, height: value.height, mimeType: 'image/jpeg' };
}

function parseTheme(value: unknown, fallback?: ThemeId): ThemeId {
  if (typeof value === 'string' && THEME_IDS.has(value as ThemeId)) return value as ThemeId;
  if (fallback) return fallback;
  throw new MigrationError('Invalid theme');
}

function parseLanguage(value: unknown, fallback?: null): Language | null {
  if (value === null && fallback === undefined) return null;
  if (typeof value === 'string' && LANGUAGES.has(value as Language)) return value as Language;
  if (fallback === null) return null;
  throw new MigrationError('Invalid language');
}

function parseDate(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new MigrationError('Invalid date');
  }
  return value;
}

function parseNonEmptyString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') throw new MigrationError('Expected text');
  const text = value.trim();
  if (!text || text.length > maxLength) throw new MigrationError('Invalid text');
  return text;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
