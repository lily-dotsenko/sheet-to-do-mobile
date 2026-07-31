import { StatusBar } from 'expo-status-bar';
import { RefObject, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { FlatList } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreateListModal } from '@/components/create-list-modal';
import { EmptyState, HomeHeader } from '@/components/home-header';
import { ListCard } from '@/components/list-card';
import { PhotoViewerModal } from '@/components/photo-viewer-modal';
import { ShareListModal } from '@/components/share-list-modal';
import { ThemePickerModal } from '@/components/theme-picker-modal';
import { TaskList } from '@/domain/models';
import { importErrorTranslationKey } from '@/i18n/translations';
<<<<<<< HEAD
import { ListImportError } from '@/services/list-transfer';
import {
  listTextLabels,
  pickListImport,
  shareListAsDeepLink,
  shareListAsJson,
  shareListAsPackage,
  shareListAsText,
} from '@/services/native-transfer';
import { attachPackagePhotos, deleteListPhotos } from '@/services/package-photo-import';
import { photoFiles } from '@/services/photo-files';
import { useApp } from '@/state/app-context';
import { getTheme } from '@/theme/themes';
=======
import { useApp } from '@/state/app-context';
import { KeyboardScrollProvider, useKeyboardScroll } from '@/state/keyboard-scroll';
import { ListImportError } from '@/services/list-transfer';
import { pickListJson, shareListAsDeepLink, shareListAsJson } from '@/services/native-transfer';
import { ThemeDefinition, getTheme } from '@/theme/themes';
>>>>>>> 7ea1644 (add new features)

export default function HomeScreen() {
  const { data, dismissNotice, importList, notice, reorderLists, t } = useApp();
  const { width } = useWindowDimensions();
  const columns = width >= 760 ? 2 : 1;
  const [createVisible, setCreateVisible] = useState(false);
  const [themesVisible, setThemesVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [shareList, setShareList] = useState<TaskList | null>(null);
<<<<<<< HEAD
  const [transferBusy, setTransferBusy] = useState(false);
=======
  const flatListRef = useRef<FlatList<TaskList>>(null);
>>>>>>> 7ea1644 (add new features)

  useEffect(() => {
    if (!notice) return;
    Alert.alert(t('attention'), t(notice), [{ text: t('close'), onPress: dismissNotice }], {
      onDismiss: dismissNotice,
    });
  }, [dismissNotice, notice, t]);

  if (!data)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#c45e43" size="large" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  const theme = getTheme(data.preferences.themeId, data.preferences.customBackground);

  const handleImport = async () => {
    setTransferBusy(true);
    try {
      const picked = await pickListImport();
      if (!picked) return;
      const baseBody =
        picked.kind === 'package'
          ? t('importPackageBody', {
              name: picked.list.title,
              total: picked.list.tasks.length,
              photos: picked.photos.length,
            })
          : t('importBody', { name: picked.list.title, total: picked.list.tasks.length });
      const body =
        picked.missingPhotos > 0
          ? `${baseBody}\n\n${t('importMissingPhotos', { count: picked.missingPhotos })}`
          : baseBody;
      Alert.alert(t('importTitle'), body, [
        { text: t('cancel'), style: 'cancel' },
        { text: t('importConfirm'), onPress: () => void finalizeImport(picked) },
      ]);
    } catch (error) {
      showTransferError(error, t);
    } finally {
      setTransferBusy(false);
    }
  };

  const finalizeImport = async (
    picked: NonNullable<Awaited<ReturnType<typeof pickListImport>>>,
  ) => {
    setTransferBusy(true);
    let importedList = picked.list;
    try {
      if (picked.kind === 'package')
        importedList = await attachPackagePhotos(picked.list, picked.photos, photoFiles);
      if (!importList(importedList)) await deleteListPhotos(importedList, photoFiles);
    } catch (error) {
      showTransferError(error, t);
    } finally {
      setTransferBusy(false);
    }
  };

  const runShare = async (operation: () => Promise<void>) => {
    setTransferBusy(true);
    try {
      await operation();
      setShareList(null);
    } catch (error) {
      showTransferError(error, t, 'shareError');
    } finally {
      setTransferBusy(false);
    }
  };

  return (
    <ImageBackground resizeMode="cover" source={theme.image} style={styles.background}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }]}
      />
      <StatusBar style={theme.statusBar} />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
<<<<<<< HEAD
          <FlatList
            columnWrapperStyle={columns > 1 ? styles.columns : undefined}
            contentContainerStyle={styles.content}
            data={data.lists}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyboardShouldPersistTaps="handled"
            key={`list-columns-${columns}`}
            keyExtractor={(list) => list.id}
            ListEmptyComponent={<EmptyState />}
            ListHeaderComponent={
              <HomeHeader
                busyImport={transferBusy}
                onCreate={() => setCreateVisible(true)}
                onImport={() => void handleImport()}
                onThemes={() => setThemesVisible(true)}
                theme={theme}
              />
            }
            numColumns={columns}
            removeClippedSubviews={false}
            renderItem={({ item }) => (
              <View style={[styles.cardSlot, columns === 1 && styles.singleCard]}>
                <ListCard list={item} onShare={setShareList} onViewPhoto={setPhotoUri} />
              </View>
            )}
          />
=======
          <KeyboardScrollProvider listRef={flatListRef}>
            <ListsView
              columns={columns}
              flatListRef={flatListRef}
              lists={data.lists}
              onCreate={() => setCreateVisible(true)}
              onImport={() => void handleImport()}
              onReorder={reorderLists}
              onShare={setShareList}
              onThemes={() => setThemesVisible(true)}
              onViewPhoto={setPhotoUri}
              theme={theme}
            />
          </KeyboardScrollProvider>
>>>>>>> 7ea1644 (add new features)
        </KeyboardAvoidingView>
      </SafeAreaView>

      <CreateListModal onClose={() => setCreateVisible(false)} visible={createVisible} />
      <ThemePickerModal
        onClose={() => setThemesVisible(false)}
        onViewCustom={(uri) => {
          setThemesVisible(false);
          setPhotoUri(uri);
        }}
        visible={themesVisible}
      />
      <ShareListModal
        busy={transferBusy}
        list={shareList}
        onClose={() => setShareList(null)}
        onShareFile={(list) => void runShare(() => shareListAsJson(list, t('shareList')))}
        onShareLink={(list) => void runShare(() => shareListAsDeepLink(list, t('shareList')))}
        onSharePackage={(list) =>
          void runShare(async () => {
            const result = await shareListAsPackage(list, t('shareList'));
            if (result.omittedPhotos > 0)
              Alert.alert(
                t('attention'),
                t('packagePhotosOmitted', { count: result.omittedPhotos }),
              );
          })
        }
        onShareText={(list) =>
          void runShare(() => shareListAsText(list, t('shareList'), listTextLabels(list, t)))
        }
      />
      <PhotoViewerModal onClose={() => setPhotoUri(null)} uri={photoUri} />
    </ImageBackground>
  );
}

function ListsView({
  columns,
  flatListRef,
  lists,
  onCreate,
  onImport,
  onReorder,
  onShare,
  onThemes,
  onViewPhoto,
  theme,
}: {
  columns: number;
  flatListRef: RefObject<FlatList<TaskList> | null>;
  lists: TaskList[];
  onCreate: () => void;
  onImport: () => void;
  onReorder: (orderedIds: string[]) => void;
  onShare: (list: TaskList) => void;
  onThemes: () => void;
  onViewPhoto: (uri: string) => void;
  theme: ThemeDefinition;
}) {
  const { handleScroll } = useKeyboardScroll();
  return (
    <DraggableFlatList
      columnWrapperStyle={columns > 1 ? styles.columns : undefined}
      contentContainerStyle={styles.content}
      data={lists}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyboardShouldPersistTaps="handled"
      key={`list-columns-${columns}`}
      keyExtractor={(list) => list.id}
      ListEmptyComponent={<EmptyState />}
      ListHeaderComponent={
        <HomeHeader onCreate={onCreate} onImport={onImport} onThemes={onThemes} theme={theme} />
      }
      numColumns={columns}
      onDragEnd={({ data }) => onReorder(data.map((list) => list.id))}
      onScroll={handleScroll}
      ref={flatListRef}
      removeClippedSubviews={false}
      renderItem={({ item, drag, isActive }: RenderItemParams<TaskList>) => (
        <View style={[styles.cardSlot, columns === 1 && styles.singleCard]}>
          <ListCard
            dragActive={isActive}
            list={item}
            onDragStart={drag}
            onShare={onShare}
            onViewPhoto={onViewPhoto}
          />
        </View>
      )}
      scrollEventThrottle={16}
    />
  );
}

function showTransferError(
  error: unknown,
  t: ReturnType<typeof useApp>['t'],
  fallback: 'importError' | 'shareError' = 'importError',
) {
  const key = error instanceof ListImportError ? importErrorTranslationKey(error.code) : fallback;
  Alert.alert(t('attention'), t(key));
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  background: { flex: 1, width: '100%', height: '100%', backgroundColor: '#f2d4c4' },
  safeArea: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 1160,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingBottom: 36,
  },
  columns: { gap: 14 },
  cardSlot: { flex: 1, minWidth: 0, marginBottom: 14 },
  singleCard: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  separator: { height: 0 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#f7d5c4',
  },
  loadingText: { color: '#4a5366', fontSize: 16, fontWeight: '700' },
});
