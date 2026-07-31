import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dateKey } from '@/domain/schedule';
import { Language } from '@/domain/models';
import { MONTHS, WEEKDAYS } from '@/i18n/calendar-locale';

type CalendarGridProps = {
  month: Date;
  selectedDate: Date | null;
  markedDateKeys: Set<string>;
  onSelectDate: (date: Date) => void;
  onChangeMonth: (delta: number) => void;
  language: Language;
};

export function CalendarGrid({
  month,
  selectedDate,
  markedDateKeys,
  onSelectDate,
  onChangeMonth,
  language,
}: CalendarGridProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  // Monday-first weekday index (0 = Monday ... 6 = Sunday).
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, monthIndex, day));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const todayKey = dateKey(today.toISOString());
  const selectedKey = selectedDate ? dateKey(selectedDate.toISOString()) : null;

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={styles.wrap}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityLabel="‹"
          hitSlop={8}
          onPress={() => onChangeMonth(-1)}
          style={styles.monthNav}
        >
          <Text style={styles.monthNavText}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>
          {MONTHS[language][monthIndex]} {year}
        </Text>
        <Pressable
          accessibilityLabel="›"
          hitSlop={8}
          onPress={() => onChangeMonth(1)}
          style={styles.monthNav}
        >
          <Text style={styles.monthNavText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS[language].map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((cellDate, cellIndex) => {
            if (!cellDate) return <View key={cellIndex} style={styles.dayCell} />;
            const key = dateKey(cellDate.toISOString());
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            const isMarked = markedDateKeys.has(key);
            return (
              <Pressable
                key={cellIndex}
                accessibilityRole="button"
                onPress={() => onSelectDate(cellDate)}
                style={styles.dayCell}
              >
                <View style={[styles.dayInner, isSelected && styles.daySelected]}>
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.dayTextToday,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {cellDate.getDate()}
                  </Text>
                  {isMarked ? <View style={styles.dayDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthNav: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7f1',
  },
  monthNavText: { fontSize: 20, fontWeight: '800', color: '#b54f35' },
  monthTitle: { fontSize: 17, fontWeight: '800', color: '#34415a', textTransform: 'capitalize' },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#9a8e89',
  },
  weekRow: { flexDirection: 'row' },
  dayCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayInner: {
    width: '78%',
    height: '78%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: '#dd7252' },
  dayText: { fontSize: 14, fontWeight: '700', color: '#3f4553' },
  dayTextToday: { color: '#b54f35' },
  dayTextSelected: { color: '#ffffff' },
  dayDot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#b54f35',
  },
});
