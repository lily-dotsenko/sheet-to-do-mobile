import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Task } from '@/domain/models';
import { formatScheduleLabel } from '@/domain/schedule';
import { useApp } from '@/state/app-context';

import { ScheduleModal } from './schedule-modal';
import { IconButton } from './ui-buttons';

export function TaskRow({
  listId,
  task,
  onViewPhoto,
}: {
  listId: string;
  task: Task;
  onViewPhoto: (uri: string) => void;
}) {
  const {
    attachPhoto,
    busyPhotoTaskId,
    clearMissingPhoto,
    deleteTask,
    language,
    removePhoto,
    scheduleTask,
    t,
    toggleTask,
  } = useApp();
  const photoBusy = busyPhotoTaskId === task.id;
  const [scheduleVisible, setScheduleVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, task.completed && styles.rowDone]}>
        <Pressable
          accessibilityLabel={task.completed ? t('reopenTask') : t('completeTask')}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.completed }}
          hitSlop={4}
          onPress={() => toggleTask(listId, task.id)}
          style={({ pressed }) => [styles.checkTarget, pressed && styles.pressed]}
        >
          <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
            {task.completed ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
        </Pressable>

        <Text style={[styles.text, task.completed && styles.textDone]}>{task.text}</Text>

        <View style={styles.actions}>
          <IconButton
            active={task.alarmEnabled}
            icon={task.alarmEnabled ? '🔔' : '🔕'}
            label={t('scheduleTask')}
            onPress={() => setScheduleVisible(true)}
          />
          {task.photo ? (
            <View style={styles.photoWrap}>
              <Pressable
                accessibilityLabel={t('viewPhoto')}
                accessibilityRole="imagebutton"
                onPress={() => onViewPhoto(task.photo!.uri)}
              >
                <Image
                  onError={() => clearMissingPhoto(listId, task.id)}
                  source={{ uri: task.photo.uri }}
                  style={styles.thumbnail}
                />
              </Pressable>
              <Pressable
                accessibilityLabel={t('removePhoto')}
                accessibilityRole="button"
                hitSlop={6}
                onPress={() => void removePhoto(listId, task.id)}
                style={styles.removePhoto}
              >
                <Text style={styles.removePhotoText}>×</Text>
              </Pressable>
            </View>
          ) : photoBusy ? (
            <View style={styles.photoLoading}>
              <ActivityIndicator color="#c65d42" size="small" />
            </View>
          ) : (
            <IconButton
              icon="📷"
              label={t('addPhoto')}
              onPress={() => void attachPhoto(listId, task.id)}
            />
          )}
          <IconButton
            danger
            icon="×"
            label={t('deleteTask')}
            onPress={() => void deleteTask(listId, task.id)}
          />
        </View>
      </View>

      {task.scheduledAt ? (
        <Text style={styles.scheduleLabel}>
          {t('scheduledFor', { date: formatScheduleLabel(task.scheduledAt, language) })}
        </Text>
      ) : null}

      <ScheduleModal
        alarmEnabled={task.alarmEnabled}
        onClose={() => setScheduleVisible(false)}
        onSave={(date, alarmEnabled) => void scheduleTask(listId, task.id, date, alarmEnabled)}
        scheduledAt={task.scheduledAt}
        title={t('scheduleTask')}
        visible={scheduleVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8ddd4',
    paddingVertical: 7,
  },
  row: {
    minHeight: 144,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleLabel: {
    marginTop: 4,
    marginLeft: 44,
    color: '#8b5848',
    fontSize: 12,
    fontWeight: '700',
  },
  rowDone: { opacity: 0.72 },
  checkTarget: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d3785e',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#d86d4c', borderColor: '#d86d4c' },
  checkmark: { color: '#ffffff', fontSize: 17, fontWeight: '900', lineHeight: 20 },
  text: { flex: 1, color: '#303844', fontSize: 16, fontWeight: '600', lineHeight: 22 },
  textDone: { color: '#8e8c8a', textDecorationLine: 'line-through' },
  actions: { flexDirection: 'column', gap: 4, alignItems: 'center' },
  photoWrap: { width: 44, height: 44 },
  thumbnail: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#eee3da' },
  removePhoto: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#bb513e',
    borderWidth: 2,
    borderColor: '#fffaf4',
  },
  removePhotoText: { color: '#ffffff', fontSize: 18, fontWeight: '800', lineHeight: 18 },
  photoLoading: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.55 },
});
