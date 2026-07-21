import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreateListModal } from '@/components/create-list-modal';
import { EmptyState, HomeHeader } from '@/components/home-header';
import { ListCard } from '@/components/list-card';
import { PhotoViewerModal } from '@/components/photo-viewer-modal';
import { ShareListModal } from '@/components/share-list-modal';
import { ThemePickerModal } from '@/components/theme-picker-modal';
import { TaskList } from '@/domain/models';
import { importErrorTranslationKey } from '@/i18n/translations';
import { useApp } from '@/state/app-context';
import { ListImportError } from '@/services/list-transfer';
import { pickListJson, shareListAsDeepLink, shareListAsJson } from '@/services/native-transfer';
import { getTheme } from '@/theme/themes';

export default function HomeScreen() {
  const { data, dismissNotice, importList, notice, t } = useApp();
  const { width } = useWindowDimensions();
  const columns = width >= 760 ? 2 : 1;
  const [createVisible, setCreateVisible] = useState(false);
  const [themesVisible, setThemesVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [shareList, setShareList] = useState<TaskList | null>(null);

  useEffect(() => {
    if (!notice) return;
    Alert.alert(t('attention'), t(notice), [{ text: t('close'), onPress: dismissNotice }], {
      onDismiss: dismissNotice,
    });
  }, [dismissNotice, notice, t]);

  if (!data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#c45e43" size="large" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  const theme = getTheme(data.preferences.themeId);

  const handleImport = async () => {
    try {
      const list = await pickListJson();
      if (!list) return;
      Alert.alert(
        t('importTitle'),
        t('importBody', { name: list.title, total: list.tasks.length }),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('importConfirm'), onPress: () => importList(list) },
        ],
      );
    } catch (error) {
      showTransferError(error, t);
    }
  };

  const handleShareFile = async (list: TaskList) => {
    setShareList(null);
    try {
      await shareListAsJson(list, t('shareList'));
    } catch {
      Alert.alert(t('attention'), t('shareError'));
    }
  };

  const handleShareLink = async (list: TaskList) => {
    setShareList(null);
    try {
      await shareListAsDeepLink(list, t('shareList'));
    } catch (error) {
      showTransferError(error, t, 'shareError');
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
        </KeyboardAvoidingView>
      </SafeAreaView>

      <CreateListModal onClose={() => setCreateVisible(false)} visible={createVisible} />
      <ThemePickerModal onClose={() => setThemesVisible(false)} visible={themesVisible} />
      <ShareListModal
        list={shareList}
        onClose={() => setShareList(null)}
        onShareFile={(list) => void handleShareFile(list)}
        onShareLink={(list) => void handleShareLink(list)}
      />
      <PhotoViewerModal onClose={() => setPhotoUri(null)} uri={photoUri} />
    </ImageBackground>
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
