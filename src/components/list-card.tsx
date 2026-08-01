import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { TaskList, completionProgress, doneCount } from '@/domain/models';
import { formatScheduleLabel } from '@/domain/schedule';
import { useApp } from '@/state/app-context';
import { useKeyboardScroll } from '@/state/keyboard-scroll';
import { iconGlyph } from '@/theme/icons';

import { ScheduleModal } from './schedule-modal';
import { TaskRow } from './task-row';
import { IconButton } from './ui-buttons';

export function ListCard({
  dragActive = false,
  list,
  onDragStart,
  onShare,
  onViewPhoto,
}: {
  dragActive?: boolean;
  list: TaskList;
  onDragStart?: () => void;
  onShare: (list: TaskList) => void;
  onViewPhoto: (uri: string) => void;
}) {
  const { addTask, deleteList, language, scheduleList, t } = useApp();
  const { scrollIntoView } = useKeyboardScroll();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const done = doneCount(list);
  const progress = completionProgress(list);

  const submit = () => {
    const clean = text.trim();
    if (!clean) return;
    addTask(list.id, clean);
    setText('');
  };

  const confirmDelete = () => {
    Alert.alert(t('deleteListTitle'), t('deleteListBody', { name: list.title }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => void deleteList(list.id),
      },
    ]);
  };

  return (
    <View style={[styles.card, dragActive && styles.cardDragging]}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          {onDragStart ? (
            <IconButton icon="⠿" label={t('dragList')} onLongPress={onDragStart} />
          ) : null}
          <Text style={styles.glyph}>{iconGlyph(list.iconId)}</Text>
          <Text style={styles.title}>{list.title}</Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            active={list.alarmEnabled}
            icon={list.alarmEnabled ? '🔔' : '🔕'}
            label={t('scheduleList')}
            onPress={() => setScheduleVisible(true)}
          />
          <IconButton icon="↗" label={t('shareList')} onPress={() => onShare(list)} />
          <IconButton danger icon="⌫" label={t('deleteListTitle')} onPress={confirmDelete} />
        </View>
      </View>

      {list.scheduledAt ? (
        <Text style={styles.scheduleLabel}>
          {t('scheduledFor', { date: formatScheduleLabel(list.scheduledAt, language) })}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {list.tasks.length === 0
            ? t('noTasks')
            : t('progress', { done, total: list.tasks.length })}
        </Text>
        {list.tasks.length > 0 ? (
          <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
        ) : null}
      </View>
      <View
        accessibilityLabel={t('progress', { done, total: list.tasks.length })}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        style={styles.progressTrack}
      >
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.tasks}>
        {list.tasks.map((task) => (
          <TaskRow key={task.id} listId={list.id} onViewPhoto={onViewPhoto} task={task} />
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          accessibilityLabel={t('newTask')}
          maxLength={160}
          onChangeText={setText}
          onFocus={() => scrollIntoView(inputRef)}
          onSubmitEditing={submit}
          placeholder={t('newTask')}
          placeholderTextColor="#9a8e89"
          ref={inputRef}
          returnKeyType="done"
          style={styles.input}
          value={text}
        />
        <IconButton disabled={!text.trim()} icon="＋" label={t('addTask')} onPress={submit} />
      </View>

      <ScheduleModal
        alarmEnabled={list.alarmEnabled}
        onClose={() => setScheduleVisible(false)}
        onSave={(date, alarmEnabled) => void scheduleList(list.id, date, alarmEnabled)}
        scheduledAt={list.scheduledAt}
        title={t('scheduleList')}
        visible={scheduleVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 250, 244, 0.96)',
    padding: 16,
    shadowColor: '#192237',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  cardDragging: {
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 12,
    opacity: 0.94,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleWrap: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 },
  glyph: { fontSize: 28 },
  title: { flex: 1, color: '#34415a', fontSize: 23, fontWeight: '800' },
  actions: { flexDirection: 'column', gap: 4 },
  scheduleLabel: {
    marginTop: 8,
    color: '#8b5848',
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  meta: { color: '#8b5848', fontSize: 13, fontWeight: '700' },
  percent: { color: '#8b5848', fontSize: 13, fontWeight: '800' },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#eadfd8', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#dd7252' },
  tasks: { marginTop: 12 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e1d3ca',
    backgroundColor: '#ffffff',
    color: '#303844',
    fontSize: 16,
    paddingHorizontal: 14,
  },
});
