import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarGrid } from '@/components/calendar-grid';
import { IconButton } from '@/components/ui-buttons';
import {
  dateKey,
  formatScheduleLabel,
  ScheduledItem,
  scheduledItemsByDate,
} from '@/domain/schedule';
import { useApp } from '@/state/app-context';
import { getTheme } from '@/theme/themes';

export default function CalendarScreen() {
  const router = useRouter();
  const { data, language, t } = useApp();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const itemsByDate = useMemo(() => scheduledItemsByDate(data?.lists ?? []), [data]);
  const markedDateKeys = useMemo(() => new Set(itemsByDate.keys()), [itemsByDate]);
  const selectedKey = dateKey(selectedDate.toISOString());
  const agenda = itemsByDate.get(selectedKey) ?? [];

  if (!data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#c45e43" size="large" />
      </View>
    );
  }

  const theme = getTheme(data.preferences.themeId, data.preferences.customBackground);

  return (
    <ImageBackground resizeMode="cover" source={theme.image} style={styles.background}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }]}
      />
      <StatusBar style={theme.statusBar} />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <IconButton icon="←" label={t('close')} onPress={() => router.back()} />
          <Text style={[styles.title, { color: theme.titleColor }]}>{t('calendar')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <CalendarGrid
            language={language}
            markedDateKeys={markedDateKeys}
            month={month}
            onChangeMonth={(delta) =>
              setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
            }
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        </View>

        <FlatList
          contentContainerStyle={styles.agendaContent}
          data={agenda}
          keyExtractor={(item, index) => `${item.kind}-${item.listId}-${item.taskId ?? index}`}
          ListEmptyComponent={<Text style={styles.emptyAgenda}>{t('noSchedule')}</Text>}
          renderItem={({ item }: { item: ScheduledItem }) => (
            <View style={styles.agendaItem}>
              <Text style={styles.agendaIcon}>{item.alarmEnabled ? '🔔' : '🕒'}</Text>
              <View style={styles.agendaText}>
                <Text style={styles.agendaTitle}>{item.title}</Text>
                <Text style={styles.agendaTime}>
                  {formatScheduleLabel(item.scheduledAt, language)}
                </Text>
              </View>
            </View>
          )}
          style={styles.agenda}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%', backgroundColor: '#f2d4c4' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7d5c4' },
  safeArea: { flex: 1, paddingHorizontal: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerSpacer: { width: 44 },
  title: { fontSize: 22, fontWeight: '900' },
  card: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 250, 244, 0.96)',
    padding: 16,
    marginBottom: 14,
  },
  agenda: { flex: 1 },
  agendaContent: { paddingBottom: 24 },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 250, 244, 0.9)',
    padding: 12,
    marginBottom: 8,
  },
  agendaIcon: { fontSize: 22 },
  agendaText: { flex: 1 },
  agendaTitle: { color: '#34415a', fontSize: 16, fontWeight: '800' },
  agendaTime: { color: '#8b5848', fontSize: 13, fontWeight: '700', marginTop: 2 },
  emptyAgenda: {
    color: '#8b5848',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
  },
});
