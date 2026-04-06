import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '@/context/HabitContext';
import { MOODS, MONTH_NAMES } from '@/constants/habits';
import { Habit } from '@/constants/habits';
import {
  isScheduledToday, formatDateKey, computeStreak,
  isDone, completionRate,
} from '@/constants/habitUtils';

const SCREEN_W = Dimensions.get('window').width;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Range = 'week' | 'month' | '6months' | 'year';

function buildDays(range: Range, selectedYear?: number): Date[] {
  if (range === 'year' && selectedYear) {
    // All days of the selected year
    const start = new Date(selectedYear, 0, 1);
    const end   = new Date(selectedYear, 11, 31);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let d = new Date(start); d <= end && d <= today; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }
  const n = range === 'week' ? 7 : range === 'month' ? 30 : range === '6months' ? 182 : 365;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (n - 1 - i)); return d;
  });
}

// ─── Year navigation ──────────────────────────────────────────────────────────

const EARLIEST_YEAR = 2020; // reasonable lower bound
const CURRENT_YEAR  = new Date().getFullYear();

type DayStatus = 'done' | 'partial' | 'missed' | 'none';

function getDayStatus(habit: Habit, date: Date, logs: ReturnType<typeof useHabits>['logs']): DayStatus {
  if (!isScheduledToday(habit, date)) return 'none';
  const log = logs[habit.id]?.[formatDateKey(date)];
  if (isDone(habit, log)) return 'done';
  if (habit.quantity && (log?.qty ?? 0) > 0) return 'partial';
  return 'missed';
}

function getAllStatus(habits: Habit[], date: Date, logs: ReturnType<typeof useHabits>['logs']): DayStatus {
  const sched = habits.filter(h => isScheduledToday(h, date));
  if (sched.length === 0) return 'none';
  const done = sched.filter(h => isDone(h, logs[h.id]?.[formatDateKey(date)])).length;
  if (done === sched.length) return 'done';
  if (done > 0) return 'partial';
  return 'missed';
}

const STATUS_COLOR: Record<DayStatus, string> = {
  done: '#2DC653',
  partial: '#F4A261',
  missed: '#FF6B6B44',
  none: 'transparent',
};

const STATUS_BORDER: Record<DayStatus, string> = {
  done: '#2DC65388',
  partial: '#F4A26188',
  missed: '#FF6B6B55',
  none: '#E5E5EA',
};

// ─── Habit Icon / Avatar ──────────────────────────────────────────────────────

function HabitAvatar({ habit, size = 36 }: { habit: Habit; size?: number }) {
  if (habit.icon) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: habit.color + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.52 }}>{habit.icon}</Text>
      </View>
    );
  }
  const initials = habit.name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: habit.color + '22', borderWidth: 1.5, borderColor: habit.color + '55', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: '600', color: habit.color }}>{initials}</Text>
    </View>
  );
}

// ─── Calendar Grid ─────────────────────────────────────────────────────────────

function CalendarGrid({
  days, habits, logs, selectedHabit, selectedDay, onSelectDay,
}: {
  days: Date[];
  habits: Habit[];
  logs: ReturnType<typeof useHabits>['logs'];
  selectedHabit: Habit | null;
  selectedDay: string | null;
  onSelectDay: (k: string) => void;
}) {
  const n = days.length;
  const cellSize = n >= 365 ? 9 : n >= 182 ? 11 : n >= 30 ? 18 : 36;
  const gap = n >= 182 ? 2 : 3;

  return (
    <View style={styles.calGrid}>
      {days.map(d => {
        const k = formatDateKey(d);
        const status = selectedHabit
          ? getDayStatus(selectedHabit, d, logs)
          : getAllStatus(habits, d, logs);
        const isSelected = selectedDay === k;

        return (
          <TouchableOpacity
            key={k}
            onPress={() => onSelectDay(k)}
            style={{
              width: cellSize, height: cellSize,
              borderRadius: 3,
              backgroundColor: STATUS_COLOR[status],
              borderWidth: isSelected ? 2 : 0.5,
              borderColor: isSelected ? '#6C63FF' : STATUS_BORDER[status],
              margin: gap / 2,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Day Detail ───────────────────────────────────────────────────────────────

function DayDetail({
  dateKey, habits, logs, moods,
}: {
  dateKey: string;
  habits: Habit[];
  logs: ReturnType<typeof useHabits>['logs'];
  moods: ReturnType<typeof useHabits>['moods'];
}) {
  const date = new Date(dateKey + 'T00:00:00');
  const scheduled = habits.filter(h => isScheduledToday(h, date));
  const mood = moods[dateKey];

  return (
    <View style={styles.dayDetail}>
      <Text style={styles.dayDetailTitle}>{dateKey}</Text>
      {scheduled.map(h => {
        const log = logs[h.id]?.[dateKey];
        const done = isDone(h, log);
        return (
          <View key={h.id} style={styles.dayDetailRow}>
            <View style={[styles.dot, { backgroundColor: done ? '#2DC653' : '#FF6B6B' }]} />
            <Text style={styles.dayDetailHabit}>{h.name}</Text>
            {h.quantity && (
              <Text style={styles.dayDetailQty}>{log?.qty ?? 0}/{h.goalQty} {h.unit}</Text>
            )}
          </View>
        );
      })}
      {scheduled.length === 0 && <Text style={styles.noScheduled}>No habits scheduled</Text>}
      {mood && (
        <View style={styles.moodRow}>
          <Text style={{ fontSize: 18 }}>{MOODS.find(m => m.score === mood.score)?.emoji}</Text>
          <Text style={styles.moodNote}>{mood.note || MOODS.find(m => m.score === mood.score)?.label}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Mood Calendar ────────────────────────────────────────────────────────────

function MoodCalendar({
  moods, range, selectedYear,
}: {
  moods: ReturnType<typeof useHabits>['moods'];
  range: Range;
  selectedYear: number;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Build the same days array as the habits calendar
  const days = useMemo(() => buildDays(range, selectedYear), [range, selectedYear]);

  const selectedEntry = selectedDay ? moods[selectedDay] : null;
  const selectedMood  = selectedEntry ? MOODS.find(m => m.score === selectedEntry.score) : null;

  // Cell size mirrors the habit calendar
  const n = days.length;
  const cellSize = n >= 365 ? 14 : n >= 182 ? 16 : n >= 30 ? 24 : 40;
  const gap      = n >= 182 ? 2  : 3;

  const hasAny = days.some(d => moods[formatDateKey(d)]);

  if (!hasAny) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 13, color: '#8E8E93' }}>
          No mood logged yet — tap 😶 on the Today page
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {days.map(d => {
          const k     = formatDateKey(d);
          const entry = moods[k];
          const mood  = entry ? MOODS.find(m => m.score === entry.score) : null;
          const isSel = selectedDay === k;

          return (
            <TouchableOpacity
              key={k}
              onPress={() => setSelectedDay(prev => prev === k ? null : k)}
              style={{
                width: cellSize, height: cellSize,
                borderRadius: 4,
                backgroundColor: entry ? '#2C2C2E' : '#1A1A1A',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: isSel ? 2 : 0.5,
                borderColor: isSel ? '#6C63FF' : entry ? '#3A3A3C' : '#222',
              }}
            >
              {mood ? (
                <Text style={{ fontSize: cellSize * 0.62, lineHeight: cellSize }}>
                  {mood.emoji}
                </Text>
              ) : (
                <View style={{ width: cellSize * 0.35, height: cellSize * 0.35, borderRadius: 2, backgroundColor: '#2C2C2E' }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day detail */}
      {selectedDay && (
        <View style={moodStyles.detail}>
          <View style={moodStyles.detailHeader}>
            <Text style={moodStyles.detailDate}>{selectedDay}</Text>
            {selectedMood && (
              <View style={moodStyles.detailMoodBadge}>
                <Text style={moodStyles.detailEmoji}>{selectedMood.emoji}</Text>
                <Text style={moodStyles.detailLabel}>{selectedMood.label}</Text>
              </View>
            )}
          </View>
          {selectedEntry?.note ? (
            <Text style={moodStyles.detailNote}>"{selectedEntry.note}"</Text>
          ) : (
            <Text style={moodStyles.detailNoNote}>No note for this day</Text>
          )}
        </View>
      )}

      {/* Legend */}
      <View style={moodStyles.legend}>
        {MOODS.slice().reverse().map(m => (
          <View key={m.score} style={moodStyles.legendItem}>
            <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
            <Text style={moodStyles.legendLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const moodStyles = StyleSheet.create({
  detail: {
    marginTop: 12, backgroundColor: '#2C2C2E',
    borderRadius: 12, padding: 14,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  detailDate: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  detailMoodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3A3A3C', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  detailEmoji: { fontSize: 18 },
  detailLabel: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  detailNote: { fontSize: 14, color: '#FFFFFF', fontStyle: 'italic', lineHeight: 20 },
  detailNoNote: { fontSize: 13, color: '#48484A' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  legendItem: { alignItems: 'center', gap: 3 },
  legendLabel: { fontSize: 9, color: '#8E8E93', fontWeight: '500' },
});

// ─── Progress Page ────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const { habits, logs, moods } = useHabits();
  const [range, setRange] = useState<Range>('month');
  const [selectedId, setSelectedId] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const days = useMemo(() => buildDays(range, selectedYear), [range, selectedYear]);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const selectedHabit = selectedId !== 'all' ? habits.find(h => h.id === selectedId) ?? null : null;

  const overallRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const rates = habits.map(h => completionRate(h, logs, days));
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }, [habits, logs, days]);

  const todayHabitCount = habits.filter(h => isScheduledToday(h, today)).length;
  const completedToday  = habits.filter(h => isDone(h, logs[h.id]?.[formatDateKey(today)])).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          {[
            { label: 'Completion', value: `${overallRate}%` },
            { label: 'Habits', value: habits.length },
            { label: 'Today', value: `${completedToday}/${todayHabitCount}` },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Range selector */}
        <View style={styles.rangeRow}>
          {(['week', 'month', '6months', 'year'] as Range[]).map(r => (
            <TouchableOpacity key={r} onPress={() => setRange(r)} style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}>
              <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
                {r === '6months' ? '6 Mo' : r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Year selector — only shown when range === 'year' */}
        {range === 'year' && (
          <View style={styles.yearRow}>
            <TouchableOpacity
              onPress={() => setSelectedYear(y => y - 1)}
              disabled={selectedYear <= EARLIEST_YEAR}
              style={[styles.yearArrow, selectedYear <= EARLIEST_YEAR && { opacity: 0.2 }]}
            >
              <Text style={styles.yearArrowText}>‹</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.yearLabel}>{selectedYear}</Text>
              {selectedYear === CURRENT_YEAR && (
                <Text style={{ fontSize: 10, color: '#6C63FF', fontWeight: '600' }}>current</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setSelectedYear(y => y + 1)}
              disabled={selectedYear >= CURRENT_YEAR}
              style={[styles.yearArrow, selectedYear >= CURRENT_YEAR && { opacity: 0.2 }]}
            >
              <Text style={styles.yearArrowText}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Habit selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.habitSelector} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          <TouchableOpacity onPress={() => setSelectedId('all')} style={[styles.habitChip, selectedId === 'all' && styles.habitChipActive]}>
            <Text style={[styles.habitChipText, selectedId === 'all' && styles.habitChipTextActive]}>All</Text>
          </TouchableOpacity>
          {habits.map(h => (
            <TouchableOpacity key={h.id} onPress={() => setSelectedId(h.id)} style={[styles.habitChip, selectedId === h.id && { backgroundColor: h.color + '22', borderColor: h.color }]}>
              <Text style={[styles.habitChipText, selectedId === h.id && { color: h.color }]}>{h.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Calendar */}
        <View style={styles.calCard}>
          <CalendarGrid
            days={days}
            habits={habits}
            logs={logs}
            selectedHabit={selectedHabit}
            selectedDay={selectedDay}
            onSelectDay={k => setSelectedDay(prev => prev === k ? null : k)}
          />
          {/* Legend */}
          <View style={styles.legend}>
            {(['done', 'partial', 'missed'] as DayStatus[]).map(s => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: STATUS_COLOR[s] }]} />
                <Text style={styles.legendText}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected day detail */}
        {selectedDay && (
          <DayDetail dateKey={selectedDay} habits={habits} logs={logs} moods={moods} />
        )}

        {/* Streaks */}
        <Text style={styles.sectionLabel}>STREAKS</Text>
        {habits.map(h => {
          const { current, best } = computeStreak(h, logs);
          const rate = completionRate(h, logs, days);
          return (
            <View key={h.id} style={styles.streakCard}>
              <HabitAvatar habit={h} size={38} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.streakName}>{h.name}</Text>
                <View style={styles.streakTrack}>
                  <View style={[styles.streakFill, { width: `${rate}%` as any, backgroundColor: h.color }]} />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                <Text style={styles.streakCurrent}>🔥 {current}</Text>
                <Text style={styles.streakBest}>best {best}</Text>
              </View>
            </View>
          );
        })}

        {/* Mood calendar */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>MOOD</Text>
        <View style={styles.calCard}>
          <MoodCalendar moods={moods} range={range} selectedYear={selectedYear} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scroll: { paddingBottom: 100 },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },

  statsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14,
    alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '500', marginTop: 2 },

  rangeRow: { flexDirection: 'row', marginHorizontal: 20, gap: 8, marginBottom: 12 },
  rangeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2C2C2E', alignItems: 'center' },
  rangeBtnActive: { backgroundColor: '#6C63FF' },
  rangeBtnText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  rangeBtnTextActive: { color: '#fff' },

  yearRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 4,
  },
  yearArrow: { paddingHorizontal: 20, paddingVertical: 8 },
  yearArrowText: { fontSize: 24, color: '#FFFFFF', fontWeight: '300' },
  yearLabel: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', minWidth: 60, textAlign: 'center' },

  habitSelector: { marginBottom: 12 },
  habitChip: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: '#2C2C2E', borderWidth: 1, borderColor: 'transparent',
  },
  habitChipActive: { backgroundColor: '#6C63FF22', borderColor: '#6C63FF' },
  habitChipText: { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  habitChipTextActive: { color: '#6C63FF' },

  calCard: {
    marginHorizontal: 20, backgroundColor: '#1C1C1E', borderRadius: 16,
    padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },

  legend: { flexDirection: 'row', gap: 14, marginTop: 12, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11, color: '#8E8E93' },

  dayDetail: {
    marginHorizontal: 20, backgroundColor: '#2C2C2E', borderRadius: 14,
    padding: 14, marginBottom: 14,
  },
  dayDetailTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  dayDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  dayDetailHabit: { fontSize: 13, color: '#FFFFFF', flex: 1 },
  dayDetailQty: { fontSize: 12, color: '#8E8E93' },
  noScheduled: { fontSize: 13, color: '#8E8E93' },
  moodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#3A3A3C',
  },
  moodNote: { fontSize: 12, color: '#8E8E93', flex: 1 },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: '#8E8E93',
    letterSpacing: 0.8, marginHorizontal: 20, marginBottom: 10, marginTop: 6,
  },

  streakCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: '#1C1C1E', borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: '#3A3A3C',
  },
  streakName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 6 },
  streakTrack: { height: 3, borderRadius: 2, backgroundColor: '#2C2C2E', overflow: 'hidden' },
  streakFill: { height: '100%', borderRadius: 2 },
  streakCurrent: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  streakBest: { fontSize: 11, color: '#8E8E93' },

  moodChart: {
    height: 90, position: 'relative',
    backgroundColor: '#111111', borderRadius: 8, overflow: 'hidden',
  },
  moodDot: {
    position: 'absolute', width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#6C63FF',
  },
  moodYLabel: {
    position: 'absolute', left: 0, fontSize: 14,
  },
  moodLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  moodLegendItem: { fontSize: 11, color: '#8E8E93' },
});