import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { useApp } from '@/state/app-context';
import { formatScheduleLabel } from '@/domain/schedule';

import { CalendarGrid } from './calendar-grid';
import { ModalFrame } from './modal-frame';
import { ActionButton } from './ui-buttons';

export function ScheduleModal({
  visible,
  title,
  scheduledAt,
  alarmEnabled: initialAlarmEnabled,
  onClose,
  onSave,
}: {
  visible: boolean;
  title: string;
  scheduledAt: string | null;
  alarmEnabled: boolean;
  onClose: () => void;
  onSave: (date: Date | null, alarmEnabled: boolean) => void;
}) {
  const { language, t } = useApp();
  const initialDate = scheduledAt ? new Date(scheduledAt) : null;
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [calendarMonth, setCalendarMonth] = useState<Date>(initialDate ?? new Date());
  const [hourText, setHourText] = useState(String(initialDate?.getHours() ?? 9).padStart(2, '0'));
  const [minuteText, setMinuteText] = useState(
    String(initialDate?.getMinutes() ?? 0).padStart(2, '0'),
  );
  const [alarmEnabled, setAlarmEnabled] = useState(initialAlarmEnabled);
  const [wasVisible, setWasVisible] = useState(visible);

  // Each opening starts from the latest saved schedule.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      const date = scheduledAt ? new Date(scheduledAt) : null;
      setSelectedDate(date);
      setCalendarMonth(date ?? new Date());
      setHourText(String(date?.getHours() ?? 9).padStart(2, '0'));
      setMinuteText(String(date?.getMinutes() ?? 0).padStart(2, '0'));
      setAlarmEnabled(initialAlarmEnabled);
    }
  }

  const applyTime = (date: Date, hour: number, minute: number) => {
    const next = new Date(date);
    next.setHours(hour, minute, 0, 0);
    return next;
  };

  const handleSelectDate = (date: Date) => {
    const hour = clamp(parseInt(hourText, 10) || 0, 0, 23);
    const minute = clamp(parseInt(minuteText, 10) || 0, 0, 59);
    setSelectedDate(applyTime(date, hour, minute));
  };

  const commitHour = (value: string) => {
    const hour = clamp(parseInt(value, 10) || 0, 0, 23);
    setHourText(String(hour).padStart(2, '0'));
    if (selectedDate) {
      setSelectedDate(applyTime(selectedDate, hour, clamp(parseInt(minuteText, 10) || 0, 0, 59)));
    }
  };

  const commitMinute = (value: string) => {
    const minute = clamp(parseInt(value, 10) || 0, 0, 59);
    setMinuteText(String(minute).padStart(2, '0'));
    if (selectedDate) {
      setSelectedDate(applyTime(selectedDate, clamp(parseInt(hourText, 10) || 0, 0, 23), minute));
    }
  };

  const handleSave = () => {
    onSave(selectedDate, selectedDate ? alarmEnabled : false);
    onClose();
  };

  const handleClear = () => {
    onSave(null, false);
    onClose();
  };

  return (
    <ModalFrame onClose={onClose} title={title} visible={visible}>
      <CalendarGrid
        language={language}
        markedDateKeys={new Set()}
        month={calendarMonth}
        onChangeMonth={(delta) =>
          setCalendarMonth(
            (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1),
          )
        }
        onSelectDate={handleSelectDate}
        selectedDate={selectedDate}
      />

      <View style={styles.timeRow}>
        <Text style={styles.label}>{t('pickTime')}</Text>
        <View style={styles.timeInputs}>
          <TextInput
            accessibilityLabel={t('pickTime')}
            keyboardType="number-pad"
            maxLength={2}
            onChangeText={setHourText}
            onEndEditing={(e) => commitHour(e.nativeEvent.text)}
            style={styles.timeInput}
            value={hourText}
          />
          <Text style={styles.timeSeparator}>:</Text>
          <TextInput
            accessibilityLabel={t('pickTime')}
            keyboardType="number-pad"
            maxLength={2}
            onChangeText={setMinuteText}
            onEndEditing={(e) => commitMinute(e.nativeEvent.text)}
            style={styles.timeInput}
            value={minuteText}
          />
        </View>
      </View>

      <View style={styles.alarmRow}>
        <Text style={styles.label}>{t('setAlarm')}</Text>
        <Switch
          onValueChange={setAlarmEnabled}
          thumbColor="#ffffff"
          trackColor={{ false: '#e1d3ca', true: '#dd7252' }}
          value={alarmEnabled}
        />
      </View>

      <Text style={styles.summary}>
        {selectedDate ? formatScheduleLabel(selectedDate.toISOString(), language) : t('noSchedule')}
      </Text>

      <View style={styles.actions}>
        <ActionButton label={t('removeSchedule')} onPress={handleClear} />
        <ActionButton label={t('save')} onPress={handleSave} variant="primary" />
      </View>
    </ModalFrame>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  timeRow: { marginTop: 18 },
  label: { color: '#8b5848', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: {
    width: 64,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e1d3ca',
    backgroundColor: '#ffffff',
    color: '#303844',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeSeparator: { fontSize: 20, fontWeight: '800', color: '#303844' },
  alarmRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summary: { marginTop: 12, color: '#3f4553', fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
