import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ui-buttons';
import { importErrorTranslationKey } from '@/i18n/translations';
import { ListImportError, parseDeepLinkData } from '@/services/list-transfer';
import { useApp } from '@/state/app-context';
import { iconGlyph } from '@/theme/icons';

export default function ImportScreen() {
  const params = useLocalSearchParams<{ data?: string | string[] }>();
  const router = useRouter();
  const { data, importList, t } = useApp();
  const encoded = Array.isArray(params.data) ? params.data[0] : params.data;
  const result = useMemo(() => {
    try {
      return { list: encoded ? parseDeepLinkData(encoded) : null, error: null };
    } catch (error) {
      return { list: null, error };
    }
  }, [encoded]);

  const errorKey =
    result.error instanceof ListImportError
      ? importErrorTranslationKey(result.error.code)
      : 'importError';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        {result.list ? (
          <>
            <Text style={styles.icon}>{iconGlyph(result.list.iconId)}</Text>
            <Text style={styles.title}>{t('importTitle')}</Text>
            <Text style={styles.body}>
              {t('importBody', { name: result.list.title, total: result.list.tasks.length })}
            </Text>
            <View style={styles.actions}>
              <ActionButton label={t('cancel')} onPress={() => router.replace('/')} />
              <ActionButton
                disabled={!data}
                label={t('importConfirm')}
                onPress={() => {
                  importList(result.list!);
                  router.replace('/');
                }}
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
  actions: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'center', gap: 10 },
});
