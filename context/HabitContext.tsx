import React, {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitLogs, MoodLogs, MoodEntry, DayLog } from '@/constants/habits';
import { formatDateKey } from '@/constants/habitUtils';
import { scheduleHabitReminder, cancelHabitReminder, syncAllReminders } from '@/constants/notifications';

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_HABITS: Habit[] = [
  {
    id: 'h1', name: 'Morning Run', icon: '🏃', description: 'Start the day with energy',
    color: '#6C63FF', frequency: 'specific', days: [1, 3, 5],
    timesPerDay: 1, quantity: false, unit: 'km', goalQty: 0,
    nDays: 1, reminder: false, notes: '', difficulty: 2, createdAt: Date.now(),
  },
  {
    id: 'h2', name: 'Drink Water', icon: '💧', description: 'Stay hydrated all day',
    color: '#48CAE4', frequency: 'daily', days: [],
    timesPerDay: 1, quantity: true, unit: 'L', goalQty: 3,
    nDays: 1, reminder: false, notes: '', difficulty: 0, createdAt: Date.now(),
  },
  {
    id: 'h3', name: 'Read', icon: '📚', description: '',
    color: '#F4A261', frequency: 'daily', days: [],
    timesPerDay: 1, quantity: true, unit: 'pages', goalQty: 20,
    nDays: 1, reminder: false, notes: '', difficulty: 1, createdAt: Date.now(),
  },
];

// ─── Keys — prefixed per user so accounts are isolated ───────────────────────

function makeKeys(userId: string) {
  return {
    HABITS: `@ht_habits_${userId}`,
    LOGS:   `@ht_logs_${userId}`,
    MOODS:  `@ht_moods_${userId}`,
  };
}

// ─── Context types ────────────────────────────────────────────────────────────

interface HabitContextValue {
  habits: Habit[];
  logs: HabitLogs;
  moods: MoodLogs;
  loading: boolean;

  addHabit:      (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
  updateHabit:   (habit: Habit) => Promise<void>;
  deleteHabit:   (id: string) => Promise<void>;
  reorderHabits: (habits: Habit[]) => Promise<void>;

  setDone: (habitId: string, date: Date, done: boolean) => Promise<void>;
  setQty:  (habitId: string, date: Date, qty: number)  => Promise<void>;
  setMood: (date: Date, entry: MoodEntry) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const HabitContext = createContext<HabitContextValue | null>(null);

export function useHabits(): HabitContextValue {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error('useHabits must be used inside HabitProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface HabitProviderProps {
  children: ReactNode;
  userId?: string;   // passed from RootNavigator once user is known
}

export function HabitProvider({ children, userId }: HabitProviderProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs,   setLogs]   = useState<HabitLogs>({});
  const [moods,  setMoods]  = useState<MoodLogs>({});
  const [loading, setLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  // Reload whenever userId changes (login / logout / switch account)
  useEffect(() => {
    if (!userId) {
      // No user → reset to empty, keep loading false
      setHabits([]);
      setLogs({});
      setMoods({});
      setLoading(false);
      setLoadedUserId(null);
      return;
    }

    if (userId === loadedUserId) return; // already loaded for this user

    setLoading(true);
    const keys = makeKeys(userId);

    (async () => {
      try {
        const [rawHabits, rawLogs, rawMoods] = await Promise.all([
          AsyncStorage.getItem(keys.HABITS),
          AsyncStorage.getItem(keys.LOGS),
          AsyncStorage.getItem(keys.MOODS),
        ]);
        setHabits(rawHabits ? JSON.parse(rawHabits) : SEED_HABITS);
        setLogs(rawLogs    ? JSON.parse(rawLogs)    : {});
        setMoods(rawMoods  ? JSON.parse(rawMoods)   : {});
        setLoadedUserId(userId);
        // Sync notifications for loaded habits
        const loadedHabits = rawHabits ? JSON.parse(rawHabits) : SEED_HABITS;
        syncAllReminders(loadedHabits).catch(() => {});
      } catch (e) {
        console.error('HabitContext load error:', e);
        setHabits(SEED_HABITS);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // ── Persist helpers ────────────────────────────────────────────────────────

  const persistHabits = useCallback(async (next: Habit[]) => {
    if (!userId) return;
    setHabits(next);
    await AsyncStorage.setItem(makeKeys(userId).HABITS, JSON.stringify(next));
  }, [userId]);

  const persistLogs = useCallback(async (next: HabitLogs) => {
    if (!userId) return;
    setLogs(next);
    await AsyncStorage.setItem(makeKeys(userId).LOGS, JSON.stringify(next));
  }, [userId]);

  const persistMoods = useCallback(async (next: MoodLogs) => {
    if (!userId) return;
    setMoods(next);
    await AsyncStorage.setItem(makeKeys(userId).MOODS, JSON.stringify(next));
  }, [userId]);

  // ── Habits CRUD ────────────────────────────────────────────────────────────

  const addHabit = useCallback(async (data: Omit<Habit, 'id' | 'createdAt'>) => {
    const newHabit: Habit = { ...data, id: 'h' + Date.now(), createdAt: Date.now() };
    await persistHabits([...habits, newHabit]);
    if (newHabit.reminder) scheduleHabitReminder(newHabit).catch(() => {});
  }, [habits, persistHabits]);

  const updateHabit = useCallback(async (updated: Habit) => {
    await persistHabits(habits.map(h => h.id === updated.id ? updated : h));
    // Re-sync reminder: schedule if enabled, cancel if disabled
    if (updated.reminder) scheduleHabitReminder(updated).catch(() => {});
    else cancelHabitReminder(updated.id).catch(() => {});
  }, [habits, persistHabits]);

  const deleteHabit = useCallback(async (id: string) => {
    await persistHabits(habits.filter(h => h.id !== id));
    cancelHabitReminder(id).catch(() => {});
    const nextLogs = { ...logs };
    delete nextLogs[id];
    await persistLogs(nextLogs);
  }, [habits, logs, persistHabits, persistLogs]);

  const reorderHabits = useCallback(async (reordered: Habit[]) => {
    await persistHabits(reordered);
  }, [persistHabits]);

  // ── Logs ───────────────────────────────────────────────────────────────────

  const setDone = useCallback(async (habitId: string, date: Date, done: boolean) => {
    const key = formatDateKey(date);
    const nextLogs: HabitLogs = {
      ...logs,
      [habitId]: { ...(logs[habitId] ?? {}), [key]: { ...(logs[habitId]?.[key] ?? {}), done } },
    };
    await persistLogs(nextLogs);
  }, [logs, persistLogs]);

  const setQty = useCallback(async (habitId: string, date: Date, qty: number) => {
    const habit = habits.find(h => h.id === habitId);
    const key = formatDateKey(date);
    const safeQty = Math.max(0, qty);
    const done = habit ? safeQty >= habit.goalQty : false;
    const nextLogs: HabitLogs = {
      ...logs,
      [habitId]: {
        ...(logs[habitId] ?? {}),
        [key]: { ...(logs[habitId]?.[key] ?? {}), qty: safeQty, done },
      },
    };
    await persistLogs(nextLogs);
  }, [habits, logs, persistLogs]);

  // ── Mood ───────────────────────────────────────────────────────────────────

  const setMood = useCallback(async (date: Date, entry: MoodEntry) => {
    const key = formatDateKey(date);
    const nextMoods: MoodLogs = { ...moods, [key]: entry };
    await persistMoods(nextMoods);
  }, [moods, persistMoods]);

  return (
    <HabitContext.Provider value={{
      habits, logs, moods, loading,
      addHabit, updateHabit, deleteHabit, reorderHabits,
      setDone, setQty, setMood,
    }}>
      {children}
    </HabitContext.Provider>
  );
}