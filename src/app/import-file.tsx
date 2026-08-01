import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ui-buttons';
import { importErrorTranslationKey } from '@/i18n/translations';
import { ParsedListPackage } from '@/services/list-package';
import { ListImportError } from '@/services/list-transfer';
import { readIncomingSheetFile } from '@/services/native-transfer';
import { attachPackagePhotos, deleteListPhotos } from '@/services/package-photo-import';
import { photoFiles } from '@/services/photo-files';
import { useApp } from '@/state/app-context';
import { iconGlyph } from '@/theme/icons';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; value: ParsedListPackage }
  | { status: 'error'; error: unknown };

export default function ImportFileScreen() {
  const params = useLocalSearchParams<{ uri?: string | string[] }>();
  const router = useRouter();
  const { importList, t } = useApp();
  const uri = Array.isArray(params.uri) ? params.uri[0] : params.uri;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const load = uri
      ? readIncomingSheetFile(uri)
      : Promise.reject(new ListImportError('invalidFormat'));
    void load
      .then((value) => {
        if (active) setState({ status: 'ready', value });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', error });
      });
    return () => {
      active = false;
    };
  }, [uri]);

  const finishImport = async (value: ParsedListPackage) => {
    setBusy(true);
    let importedList = value.list;
    try {
      importedList = await attachPackagePhotos(value.list, value.photos, photoFiles);
      if (!importList(importedList)) await deleteListPhotos(importedList, photoFiles);
      router.replace('/');
    } catch (error) {
      await deleteListPhotos(importedList, photoFiles);
      setState({ status: 'error', error });
    } finally {
      setBusy(false);
    }
  };

  const errorKey =
    state.status === 'error' && state.error instanceof ListImportError
      ? importErrorTranslationKey(state.error.code)
      : 'importError';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        {state.status === 'loading' ? (
          <>
            <ActivityIndicator color="#c45e43" size="large" />
            <Text style={styles.body}>{t('working')}</Text>
          </>
        ) : state.status === 'ready' ? (
          <>
            <Text style={styles.icon}>{iconGlyph(state.value.list.iconId)}</Text>
            <Text style={styles.title}>{t('importTitle')}</Text>
            <Text style={styles.body}>
              {t('importPackageBody', {
                name: state.value.list.title,
                total: state.value.list.tasks.length,
                photos: state.value.photos.length,
              })}
            </Text>
            {state.value.missingPhotos > 0 ? (
              <Text style={styles.warning}>
                {t('importMissingPhotos', { count: state.value.missingPhotos })}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <ActionButton
                disabled={busy}
                label={t('cancel')}
                onPress={() => router.replace('/')}
              />
              <ActionButton
                disabled={busy}
                label={t('importConfirm')}
                loading={busy}
                onPress={() => void finishImport(state.value)}
                variant="primary"
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>{t('attention')}</Text>
            <Text style={styles.body}>{t(errorKey)}</Text>
            <ActionButton
              label={t('close')}
              onPress={() => router.replace('/')}
              variant="primary"
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7d5c4',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 26,
    backgroundColor: '#fffaf4',
    padding: 24,
    alignItems: 'center',
    elevation: 6,
  },
  icon: { fontSize: 44 },
  title: { color: '#34415a', fontSize: 25, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  body: { color: '#6f625e', fontSize: 16, lineHeight: 23, textAlign: 'center', marginVertical: 16 },
  warning: {
    color: '#8b553f',
    backgroundColor: '#fff0e6',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  actions: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'center', gap: 10 },
});
