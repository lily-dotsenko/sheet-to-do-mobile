import * as Haptics from 'expo-haptics';
import { useLocales } from 'expo-localization';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutAnimation } from 'react-native';

import {
  AppData,
  Language,
  TaskList,
  ThemeId,
  addList,
  addTask as addTaskToData,
  createEmptyData,
  createTask,
  createTaskList,
  removeList as removeListFromData,
  removeTask as removeTaskFromData,
  setTaskPhoto,
  toggleTask as toggleTaskInData,
} from '@/domain/models';
import { TranslationKey, translate } from '@/i18n/translations';
import { appStorage } from '@/services/native-storage';
import { backgroundFiles } from '@/services/background-files';
import { removeLocalImage, replaceLocalImage } from '@/services/local-image-lifecycle';
import { deletePhotoSafely } from '@/services/photo-cleanup';
import { photoFiles } from '@/services/photo-files';

type Notice = 'storageRecovered' | 'missingPhotos' | 'saveError' | 'photoError' | 'listLimitError';

type AppContextValue = {
  data: AppData | null;
  language: Language;
  notice: Notice | null;
  busyPhotoTaskId: string | null;
  busyBackground: boolean;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  dismissNotice: () => void;
  createList: (title: string, iconId: string) => void;
  deleteList: (listId: string) => Promise<void>;
  addTask: (listId: string, text: string) => void;
  toggleTask: (listId: string, taskId: string) => void;
  deleteTask: (listId: string, taskId: string) => Promise<void>;
  attachPhoto: (listId: string, taskId: string) => Promise<void>;
  removePhoto: (listId: string, taskId: string) => Promise<void>;
  clearMissingPhoto: (listId: string, taskId: string) => void;
  importList: (list: TaskList) => boolean;
  setTheme: (themeId: ThemeId) => Promise<void>;
  pickCustomBackground: () => Promise<void>;
  removeCustomBackground: () => Promise<void>;
  setLanguage: (language: Language) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const locales = useLocales();
  const deviceLanguage: Language = locales[0].languageCode === 'uk' ? 'uk' : 'en';
  const [data, setData] = useState<AppData | null>(null);
  const dataRef = useRef<AppData | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyPhotoTaskId, setBusyPhotoTaskId] = useState<string | null>(null);
  const [busyBackground, setBusyBackground] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await appStorage.load();
        const scrubbed = await scrubMissingFiles(result.data);
        if (!active) return;
        dataRef.current = scrubbed.data;
        setData(scrubbed.data);
        if (scrubbed.count > 0) {
          setNotice('missingPhotos');
          await appStorage.save(scrubbed.data);
        } else if (result.recoveredFromError) {
          setNotice('storageRecovered');
        }
      } catch {
        if (!active) return;
        const empty = createEmptyData();
        dataRef.current = empty;
        setData(empty);
        setNotice('storageRecovered');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((update: (current: AppData) => AppData) => {
    const current = dataRef.current;
    if (!current) return;
    const next = update(current);
    if (next === current) return;
    dataRef.current = next;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setData(next);
    void appStorage.save(next).catch(() => setNotice('saveError'));
  }, []);

  const createList = useCallback(
    (title: string, iconId: string) => {
      try {
        commit((current) => addList(current, createTaskList(title, iconId)));
      } catch {
        setNotice('listLimitError');
        return;
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    },
    [commit],
  );

  const deleteList = useCallback(
    async (listId: string) => {
      const list = dataRef.current?.lists.find((item) => item.id === listId);
      if (!list) return;
      await Promise.all(
        list.tasks.map((task) => deletePhotoSafely(photoFiles, task.photo?.uri ?? null)),
      );
      commit((current) => removeListFromData(current, listId));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => undefined,
      );
    },
    [commit],
  );

  const addTask = useCallback(
    (listId: string, text: string) => {
      try {
        commit((current) => addTaskToData(current, listId, createTask(text)));
      } catch {
        setNotice('listLimitError');
        return;
      }
      void Haptics.selectionAsync().catch(() => undefined);
    },
    [commit],
  );

  const toggleTask = useCallback(
    (listId: string, taskId: string) => {
      commit((current) => toggleTaskInData(current, listId, taskId));
      void Haptics.selectionAsync().catch(() => undefined);
    },
    [commit],
  );

  const deleteTask = useCallback(
    async (listId: string, taskId: string) => {
      const task = dataRef.current?.lists
        .find((list) => list.id === listId)
        ?.tasks.find((item) => item.id === taskId);
      await deletePhotoSafely(photoFiles, task?.photo?.uri ?? null);
      commit((current) => removeTaskFromData(current, listId, taskId));
    },
    [commit],
  );

  const attachPhoto = useCallback(
    async (listId: string, taskId: string) => {
      setBusyPhotoTaskId(taskId);
      try {
        const result = await photoFiles.pickAndSave();
        if (result.status === 'picked') {
          commit((current) => setTaskPhoto(current, listId, taskId, result.photo));
        }
      } catch {
        setNotice('photoError');
      } finally {
        setBusyPhotoTaskId(null);
      }
    },
    [commit],
  );

  const removePhoto = useCallback(
    async (listId: string, taskId: string) => {
      const task = dataRef.current?.lists
        .find((list) => list.id === listId)
        ?.tasks.find((item) => item.id === taskId);
      await deletePhotoSafely(photoFiles, task?.photo?.uri ?? null);
      commit((current) => setTaskPhoto(current, listId, taskId, null));
    },
    [commit],
  );

  const clearMissingPhoto = useCallback(
    (listId: string, taskId: string) => {
      commit((current) => setTaskPhoto(current, listId, taskId, null));
      setNotice('missingPhotos');
    },
    [commit],
  );

  const importList = useCallback(
    (list: TaskList) => {
      try {
        commit((current) => addList(current, list));
      } catch {
        setNotice('listLimitError');
        return false;
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      return true;
    },
    [commit],
  );

  const setTheme = useCallback(
    async (themeId: ThemeId) => {
      const previous = dataRef.current?.preferences.customBackground ?? null;
      commit((current) => ({
        ...current,
        preferences: { ...current.preferences, themeId, customBackground: null },
        updatedAt: new Date().toISOString(),
      }));
      await removeLocalImage(previous, () => undefined, backgroundFiles);
    },
    [commit],
  );

  const pickCustomBackground = useCallback(async () => {
    const previous = dataRef.current?.preferences.customBackground ?? null;
    setBusyBackground(true);
    try {
      await replaceLocalImage(
        previous,
        () => backgroundFiles.pickAndSave(),
        (next) =>
          commit((current) => ({
            ...current,
            preferences: { ...current.preferences, customBackground: next },
            updatedAt: new Date().toISOString(),
          })),
        backgroundFiles,
      );
    } catch {
      setNotice('photoError');
    } finally {
      setBusyBackground(false);
    }
  }, [commit]);

  const removeCustomBackground = useCallback(async () => {
    const previous = dataRef.current?.preferences.customBackground ?? null;
    setBusyBackground(true);
    try {
      await removeLocalImage(
        previous,
        () =>
          commit((current) => ({
            ...current,
            preferences: { ...current.preferences, customBackground: null },
            updatedAt: new Date().toISOString(),
          })),
        backgroundFiles,
      );
    } finally {
      setBusyBackground(false);
    }
  }, [commit]);

  const setLanguage = useCallback(
    (language: Language) => {
      commit((current) => ({
        ...current,
        preferences: { ...current.preferences, language },
        updatedAt: new Date().toISOString(),
      }));
    },
    [commit],
  );

  const language = data?.preferences.language ?? deviceLanguage;
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      language,
      notice,
      busyPhotoTaskId,
      busyBackground,
      t,
      dismissNotice: () => setNotice(null),
      createList,
      deleteList,
      addTask,
      toggleTask,
      deleteTask,
      attachPhoto,
      removePhoto,
      clearMissingPhoto,
      importList,
      setTheme,
      pickCustomBackground,
      removeCustomBackground,
      setLanguage,
    }),
    [
      addTask,
      attachPhoto,
      busyPhotoTaskId,
      busyBackground,
      clearMissingPhoto,
      createList,
      data,
      deleteList,
      deleteTask,
      importList,
      language,
      notice,
      removePhoto,
      pickCustomBackground,
      removeCustomBackground,
      setLanguage,
      setTheme,
      t,
      toggleTask,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

async function scrubMissingFiles(data: AppData): Promise<{ data: AppData; count: number }> {
  let count = 0;
  const lists = await Promise.all(
    data.lists.map(async (list) => ({
      ...list,
      tasks: await Promise.all(
        list.tasks.map(async (task) => {
          if (!task.photo || (await photoFiles.exists(task.photo.uri))) return task;
          count += 1;
          return { ...task, photo: null };
        }),
      ),
    })),
  );
  const customBackground = data.preferences.customBackground;
  const backgroundMissing =
    customBackground !== null && !(await backgroundFiles.exists(customBackground.uri));
  if (backgroundMissing) count += 1;
  return count === 0
    ? { data, count }
    : {
        data: {
          ...data,
          lists,
          preferences: {
            ...data.preferences,
            customBackground: backgroundMissing ? null : customBackground,
          },
          updatedAt: new Date().toISOString(),
        },
        count,
      };
}
