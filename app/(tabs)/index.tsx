import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Pressable, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '@/context/HabitContext';
import { Habit } from '@/constants/habits';
import { DAY_FULL, MONTH_NAMES, MOODS, DIFFICULTIES } from '@/constants/habits';
import { isScheduledToday, formatDateKey, computeStreak, isDone } from '@/constants/habitUtils';

function todayDate(): Date {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

function Avatar({ color, name, icon, size = 40 }: { color: string; name: string; icon?: string; size?: number }) {
  if (icon) {
    return (
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', borderColor: color + '33' }]}>
        <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
      </View>
    );
  }
  const initials = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36, color }]}>{initials}</Text>
    </View>
  );
}

function ProgressRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: color }}>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={{ fontSize: size * 0.26, fontWeight: '700', color, width: size * 0.72, textAlign: 'center' }}
      >{pct}%</Text>
    </View>
  );
}

// ─── Mood Modal ───────────────────────────────────────────────────────────────

function MoodModal({ visible, onClose, currentMood, onSave }: {
  visible: boolean;
  onClose: () => void;
  currentMood?: { score: number; note?: string };
  onSave: (score: number, note: string) => void;
}) {
  const [score, setScore] = useState(currentMood?.score ?? 3);
  const [note, setNote] = useState(currentMood?.note ?? '');

  // Sync state when modal opens with existing mood
  React.useEffect(() => {
    if (visible) {
      setScore(currentMood?.score ?? 3);
      setNote(currentMood?.note ?? '');
    }
  }, [visible]);

  const save = () => {
    onSave(score, note);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>How are you feeling?</Text>

            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity key={m.score} onPress={() => setScore(m.score)}
                  style={[styles.moodBtn, score === m.score && styles.moodBtnActive]}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, score === m.score && { color: '#6C63FF' }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.noteInput}
              placeholder="Add a note... (optional)"
              placeholderTextColor="#8E8E93"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={save}>
              <Text style={styles.primaryBtnText}>Save</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Qty Modal ────────────────────────────────────────────────────────────────

function QtyModal({ visible, habit, current, onClose, onSave }: {
  visible: boolean;
  habit: Habit | null;
  current: number;
  onClose: () => void;
  onSave: (v: number) => void;
}) {
  const [val, setVal] = useState('');

  // Reset input each time modal opens
  React.useEffect(() => {
    if (visible) setVal(current > 0 ? String(current) : '');
  }, [visible, current]);

  const save = () => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) onSave(n);
    onClose();
  };

  if (!habit) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{habit.name}</Text>
            <Text style={styles.modalSubtitle}>Goal: {habit.goalQty} {habit.unit}</Text>

            <View style={styles.qtyInputRow}>
              <TextInput
                style={[styles.bigInput, { borderColor: habit.color, flex: 1 }]}
                value={val}
                onChangeText={setVal}
                keyboardType="decimal-pad"
                autoFocus
                placeholder="0"
                placeholderTextColor="#C7C7CC"
                returnKeyType="done"
                onSubmitEditing={save}
              />
              <Text style={[styles.unitLabel, { color: habit.color }]}>{habit.unit}</Text>
            </View>

            <View style={styles.qtyShortcuts}>
              {[0.25, 0.5, 1].map(step => {
                const newVal = parseFloat(val || '0') + step;
                return (
                  <TouchableOpacity key={step} onPress={() => setVal(String(newVal))}
                    style={[styles.shortcutBtn, { borderColor: habit.color + '55' }]}>
                    <Text style={[styles.shortcutText, { color: habit.color }]}>+{step}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: habit.color }]} onPress={save}>
              <Text style={styles.primaryBtnText}>Set Amount</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Habit Card ───────────────────────────────────────────────────────────────

function HabitCard({ habit, log, onToggle, onQtyChange, onOpenQty }: {
  habit: Habit;
  log: { done?: boolean; qty?: number };
  onToggle: () => void;
  onQtyChange: (delta: number) => void;
  onOpenQty: () => void;
}) {
  const done = isDone(habit, log);
  const { logs } = useHabits();
  const { current } = computeStreak(habit, logs);
  const qty = log.qty ?? 0;
  const pct = habit.quantity ? Math.min(100, Math.round((qty / habit.goalQty) * 100)) : (done ? 100 : 0);

  return (
    <View style={[styles.card, done && { borderColor: habit.color + '55', backgroundColor: habit.color + '08' }]}>
      <View style={styles.cardRow}>
        <Avatar color={habit.color} name={habit.name} icon={habit.icon} size={40} />
        <View style={styles.cardContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardName} numberOfLines={1}>{habit.name}</Text>
            {current > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: habit.color + '22' }]}>
                <Text style={[styles.streakText, { color: habit.color }]}>🔥 {current}</Text>
              </View>
            )}
          </View>
          {habit.quantity
            ? <Text style={[styles.cardSub, done && { color: habit.color, fontWeight: '600' }]}>
                {qty} / {habit.goalQty} {habit.unit}
              </Text>
            : <Text style={styles.cardSub}>{DIFFICULTIES[habit.difficulty]}</Text>
          }
        </View>

        {!habit.quantity && (
          <TouchableOpacity onPress={onToggle}
            style={[styles.checkCircle, done && { backgroundColor: habit.color, borderColor: habit.color }]}>
            {done && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>}
          </TouchableOpacity>
        )}
      </View>

      {habit.quantity && (
        <View style={{ marginTop: 10 }}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: habit.color }]} />
          </View>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => onQtyChange(-1)}>
              <Text style={[styles.qtyBtnText, { color: '#FF6B6B' }]}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qtyEnterBtn} onPress={onOpenQty}>
              <Text style={styles.qtyEnterText}>✎ enter amount</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: habit.color + '22' }]} onPress={() => onQtyChange(1)}>
              <Text style={[styles.qtyBtnText, { color: habit.color }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Today Page ───────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const { habits, logs, moods, setDone, setQty, setMood } = useHabits();
  const [moodOpen, setMoodOpen] = useState(false);
  const [qtyHabit, setQtyHabit] = useState<Habit | null>(null);

  // ── Date navigation ──────────────────────────────────────────────────────────
  const [offset, setOffset] = useState(0); // 0 = today, -1 = yesterday, etc.
  const realToday = todayDate();
  const selectedDate = new Date(realToday);
  selectedDate.setDate(realToday.getDate() + offset);
  const key = formatDateKey(selectedDate);
  const isToday = offset === 0;

  const goBack    = () => setOffset(o => o - 1);
  const goForward = () => { if (offset < 0) setOffset(o => o + 1); };

  const todayHabits = habits.filter(h => isScheduledToday(h, selectedDate));
  const currentMood = moods[key];

  const completedCount = todayHabits.filter(h => isDone(h, logs[h.id]?.[key])).length;
  const pct = todayHabits.length > 0 ? Math.round((completedCount / todayHabits.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header with date navigation */}
        <View style={styles.header}>
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={goBack} style={styles.dateNavBtn}>
              <Text style={styles.dateNavArrow}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.headerDate}>
                {DAY_FULL[selectedDate.getDay()]}, {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}
              </Text>
              {!isToday && (
                <TouchableOpacity onPress={() => setOffset(0)}>
                  <Text style={styles.backToToday}>Back to today</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={goForward}
              style={[styles.dateNavBtn, isToday && styles.dateNavBtnDisabled]}
              disabled={isToday}
            >
              <Text style={[styles.dateNavArrow, isToday && { color: '#3A3A3C' }]}>›</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>{isToday ? "Today's Habits" : 'Habits'}</Text>
        </View>

        {/* Progress summary */}
        <View style={styles.summaryCard}>
          <ProgressRing pct={pct} color="#6C63FF" size={60} />
          <View style={{ marginLeft: 16 }}>
            <Text>
              <Text style={styles.summaryBig}>{completedCount}</Text>
              <Text style={styles.summarySub}>/{todayHabits.length} completed</Text>
            </Text>
            <Text style={styles.summaryPct}>{pct}% of today's habits done</Text>
          </View>
        </View>

        {/* Mood Tracker */}
        <TouchableOpacity style={styles.moodCard} onPress={() => setMoodOpen(true)}>
          <Text style={styles.moodEmojiBig}>
            {currentMood ? MOODS.find(m => m.score === currentMood.score)?.emoji : '😶'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.moodCardTitle}>Mood Tracker</Text>
            <Text style={styles.moodCardSub}>
              {currentMood
                ? `Feeling ${MOODS.find(m => m.score === currentMood.score)?.label}${currentMood.note ? ' · ' + currentMood.note : ''}`
                : 'How are you feeling?'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Habits */}
        <Text style={styles.sectionLabel}>HABITS</Text>

        {todayHabits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyText}>No habits scheduled today</Text>
          </View>
        ) : (
          todayHabits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              log={logs[habit.id]?.[key] ?? {}}
              onToggle={() => setDone(habit.id, selectedDate, !(logs[habit.id]?.[key]?.done ?? false))}
              onQtyChange={delta => setQty(habit.id, selectedDate, (logs[habit.id]?.[key]?.qty ?? 0) + delta)}
              onOpenQty={() => setQtyHabit(habit)}
            />
          ))
        )}

      </ScrollView>

      <MoodModal
        visible={moodOpen}
        onClose={() => setMoodOpen(false)}
        currentMood={currentMood}
        onSave={(score, note) => setMood(selectedDate, { score, note })}
      />

      <QtyModal
        visible={!!qtyHabit}
        habit={qtyHabit}
        current={qtyHabit ? (logs[qtyHabit.id]?.[key]?.qty ?? 0) : 0}
        onClose={() => setQtyHabit(null)}
        onSave={val => qtyHabit && setQty(qtyHabit.id, selectedDate, val)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scroll: { paddingBottom: 100 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  dateNav: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dateNavBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dateNavBtnDisabled: { opacity: 0.3 },
  dateNavArrow: { fontSize: 28, color: '#FFFFFF', fontWeight: '300', lineHeight: 34 },
  headerDate: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  backToToday: { fontSize: 11, color: '#6C63FF', fontWeight: '600', marginTop: 2 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },

  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  summaryBig: { fontWeight: '700', color: '#FFFFFF', fontSize: 24 },
  summarySub: { color: '#8E8E93', fontWeight: '400', fontSize: 16 },
  summaryPct: { color: '#8E8E93', fontSize: 13, marginTop: 2 },

  moodCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: '#1C1C1E', borderRadius: 16,
    padding: 16, borderWidth: 0.5, borderColor: '#3A3A3C',
  },
  moodEmojiBig: { fontSize: 32, marginRight: 12 },
  moodCardTitle: { fontWeight: '600', fontSize: 15, color: '#FFFFFF' },
  moodCardSub: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  chevron: { fontSize: 22, color: '#C7C7CC', marginLeft: 8 },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: '#8E8E93',
    letterSpacing: 0.8, marginHorizontal: 20, marginBottom: 10,
  },

  card: {
    backgroundColor: '#1C1C1E', borderRadius: 16,
    marginHorizontal: 20, marginBottom: 10,
    padding: 16, borderWidth: 0.5, borderColor: '#3A3A3C',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: 12, marginRight: 8 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  cardSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },

  streakBadge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  streakText: { fontSize: 11, fontWeight: '600' },

  checkCircle: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: '#C7C7CC',
    alignItems: 'center', justifyContent: 'center',
  },

  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: '#2C2C2E',
    overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 2 },

  qtyRow: { flexDirection: 'row', gap: 8 },
  qtyBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 22, fontWeight: '600', lineHeight: 26 },
  qtyEnterBtn: {
    flex: 2, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center',
  },
  qtyEnterText: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#8E8E93' },

  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatarText: { fontWeight: '600' },

  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#C7C7CC',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#8E8E93', marginBottom: 16 },

  moodRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  moodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#3A3A3C', backgroundColor: '#111111',
  },
  moodBtnActive: { borderColor: '#6C63FF', backgroundColor: '#6C63FF11' },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 10, fontWeight: '600', color: '#8E8E93', marginTop: 3 },

  noteInput: {
    borderWidth: 0.5, borderColor: '#3A3A3C', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#FFFFFF',
    backgroundColor: '#111111', marginBottom: 16, minHeight: 80,
  },

  // Qty modal
  qtyInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  bigInput: {
    fontSize: 42, fontWeight: '700', textAlign: 'center',
    borderBottomWidth: 2.5, paddingVertical: 8,
    color: '#FFFFFF',
  },
  unitLabel: { fontSize: 22, fontWeight: '600', minWidth: 40 },
  qtyShortcuts: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  shortcutBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, backgroundColor: '#111111', alignItems: 'center',
  },
  shortcutText: { fontSize: 14, fontWeight: '600' },

  primaryBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});