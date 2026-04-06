import { Habit, HabitLogs, DayLog } from '@/constants/habits';

// ─── Date helpers ────────────────────────────────────────────────────────────

export function todayKey(): string {
  const d = new Date();
  return formatDateKey(d);
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export function isScheduledToday(habit: Habit, date: Date): boolean {
  const dow = date.getDay();
  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'specific':
      return (habit.days ?? []).includes(dow);
    case 'every_n': {
      const start = new Date(habit.createdAt ?? Date.now());
      start.setHours(0, 0, 0, 0);
      const target = new Date(date); target.setHours(0, 0, 0, 0);
      const diff = Math.round((target.getTime() - start.getTime()) / 86_400_000);
      return diff >= 0 && diff % (habit.nDays || 1) === 0;
    }
    default:
      return true;
  }
}

// ─── Completion check ────────────────────────────────────────────────────────

export function isDone(habit: Habit, log: DayLog | undefined): boolean {
  if (!log) return false;
  if (habit.quantity) return (log.qty ?? 0) >= habit.goalQty;
  return log.done === true;
}

// ─── Streak ──────────────────────────────────────────────────────────────────

export function computeStreak(
  habit: Habit,
  logs: HabitLogs,
): { current: number; best: number } {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Collect scheduled days (newest first) for up to 365 days
  const scheduled: string[] = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    if (isScheduledToday(habit, d)) scheduled.push(formatDateKey(d));
  }

  let current = 0, best = 0, streak = 0, broken = false;

  for (const key of scheduled) {
    const log = logs[habit.id]?.[key];
    if (isDone(habit, log)) {
      streak++;
      best = Math.max(best, streak);
      if (!broken) current = streak;
    } else {
      broken = true;
      streak = 0;
    }
  }

  return { current, best };
}

// ─── Completion rate (%) ─────────────────────────────────────────────────────

export function completionRate(
  habit: Habit,
  logs: HabitLogs,
  days: Date[],
): number {
  const scheduled = days.filter(d => isScheduledToday(habit, d));
  if (scheduled.length === 0) return 0;
  const done = scheduled.filter(d => isDone(habit, logs[habit.id]?.[formatDateKey(d)])).length;
  return Math.round((done / scheduled.length) * 100);
}