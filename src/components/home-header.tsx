import { Href, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Language } from '@/domain/models';
import { useApp } from '@/state/app-context';
import { ThemeDefinition } from '@/theme/themes';

import { ActionButton } from './ui-buttons';

export function HomeHeader({
  theme,
  onCreate,
  onImport,
  onThemes,
  busyImport = false,
}: {
  theme: ThemeDefinition;
  onCreate: () => void;
  onImport: () => void;
  onThemes: () => void;
  busyImport?: boolean;
}) {
  const { language, setLanguage, t } = useApp();
  const router = useRouter();
  const nextLanguage: Language = language === 'uk' ? 'en' : 'uk';
  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.titleColor }]}>{t('appTitle')}</Text>
      <Text style={[styles.subtitle, { color: theme.titleColor }]}>{t('appSubtitle')}</Text>
      <View style={styles.actions}>
        <ActionButton icon="+" label={t('addList')} onPress={onCreate} variant="primary" />
        <ActionButton icon="⇩" label={t('importList')} loading={busyImport} onPress={onImport} />
        <ActionButton
          icon="📅"
          label={t('calendar')}
          onPress={() => router.push('/calendar' as Href)}
        />
        <ActionButton icon="🎨" label={t('themes')} onPress={onThemes} />
        <ActionButton label={t('switchLanguage')} onPress={() => setLanguage(nextLanguage)} />
      </View>
    </View>
  );
}

export function EmptyState() {
  const { t } = useApp();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>{t('emptyTitle')}</Text>
      <Text style={styles.emptyBody}>{t('emptyBody')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: 12, paddingBottom: 24 },
  title: {
    fontSize: 42,
    lineHeight: 50,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(26, 31, 43, 0.25)',
    textShadowRadius: 8,
  },
  subtitle: { marginTop: 4, fontSize: 16, fontWeight: '700', textAlign: 'center', opacity: 0.96 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  empty: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 250, 244, 0.94)',
    padding: 28,
    marginTop: 20,
  },
  emptyIcon: { fontSize: 42 },
  emptyTitle: { color: '#34415a', fontSize: 23, fontWeight: '800', marginTop: 8 },
  emptyBody: { color: '#746762', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 6 },
});
