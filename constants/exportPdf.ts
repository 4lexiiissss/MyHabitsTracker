import { Habit, HabitLogs, MoodLogs, MOODS } from '@/constants/habits';
import { computeStreak, formatDateKey, isDone, isScheduledToday, completionRate } from '@/constants/habitUtils';
import { UserProfile } from '@/context/AuthContext';

// ─── Build HTML for PDF export ────────────────────────────────────────────────

export function buildExportHTML(
  user: UserProfile,
  habits: Habit[],
  logs: HabitLogs,
  moods: MoodLogs,
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Global stats ──────────────────────────────────────────────────────────
  const totalCompletions = habits.reduce((sum, h) => {
    return sum + Object.values(logs[h.id] ?? {}).filter(l => isDone(h, l)).length;
  }, 0);

  const bestStreak = habits.reduce((best, h) => {
    return Math.max(best, computeStreak(h, logs).best);
  }, 0);

  const activeStreaks = habits.filter(h => computeStreak(h, logs).current > 0).length;

  // Last 30 days for completion rate
  const last30: Date[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (29 - i)); return d;
  });

  const overallRate = habits.length > 0
    ? Math.round(habits.map(h => completionRate(h, logs, last30)).reduce((a, b) => a + b, 0) / habits.length)
    : 0;

  // ── Mood data ────────────────────────────────────────────────────────────
  const moodEntries = Object.entries(moods)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 30);

  const avgMood = moodEntries.length > 0
    ? (moodEntries.reduce((s, [, m]) => s + m.score, 0) / moodEntries.length).toFixed(1)
    : 'N/A';

  // ── Per-habit rows ────────────────────────────────────────────────────────
  const habitRows = habits.map(h => {
    const { current, best } = computeStreak(h, logs);
    const rate = completionRate(h, logs, last30);
    const total = Object.values(logs[h.id] ?? {}).filter(l => isDone(h, l)).length;
    return `
      <tr>
        <td>${h.icon ?? ''} ${h.name}</td>
        <td style="color:${h.color}">${h.frequency === 'daily' ? 'Daily' : h.frequency === 'specific' ? 'Specific' : `Every ${h.nDays}d`}</td>
        <td>${h.quantity ? `${h.goalQty} ${h.unit}` : '—'}</td>
        <td>${rate}%</td>
        <td>🔥 ${current}</td>
        <td>${best}</td>
        <td>${total}</td>
      </tr>`;
  }).join('');

  // ── Mood rows ─────────────────────────────────────────────────────────────
  const moodRows = moodEntries.slice(0, 10).map(([date, entry]) => {
    const mood = MOODS.find(m => m.score === entry.score);
    return `
      <tr>
        <td>${date}</td>
        <td>${mood?.emoji ?? ''} ${mood?.label ?? ''}</td>
        <td style="color:#8E8E93">${entry.note ?? '—'}</td>
      </tr>`;
  }).join('');

  // ── Last 30 days calendar ─────────────────────────────────────────────────
  const calendarCells = last30.map(d => {
    const k = formatDateKey(d);
    const sched = habits.filter(h => isScheduledToday(h, d));
    const done  = sched.filter(h => isDone(h, logs[h.id]?.[k])).length;
    const pct   = sched.length > 0 ? done / sched.length : -1;
    const bg    = pct < 0 ? '#2C2C2E' : pct === 1 ? '#2DC653' : pct > 0 ? '#F4A261' : '#FF6B6B';
    const label = d.getDate();
    return `<div style="width:28px;height:28px;border-radius:6px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:600">${label}</div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #111; color: #fff; padding: 32px; }
    h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
    h2 { font-size: 16px; font-weight: 700; color: #8E8E93; margin: 28px 0 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { color: #8E8E93; font-size: 14px; margin-bottom: 32px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
    .stat-card { background: #1C1C1E; border-radius: 14px; padding: 16px; text-align: center; }
    .stat-value { font-size: 26px; font-weight: 800; color: #6C63FF; }
    .stat-label { font-size: 11px; color: #8E8E93; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: #1C1C1E; border-radius: 12px; overflow: hidden; }
    th { background: #2C2C2E; padding: 10px 12px; text-align: left; font-size: 11px; color: #8E8E93; text-transform: uppercase; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #2C2C2E; }
    tr:last-child td { border-bottom: none; }
    .calendar { display: flex; flex-wrap: wrap; gap: 4px; background: #1C1C1E; border-radius: 14px; padding: 16px; }
    .legend { display: flex; gap: 16px; margin-top: 10px; font-size: 12px; color: #8E8E93; }
    .legend-dot { width: 12px; height: 12px; border-radius: 3px; display: inline-block; margin-right: 4px; }
    footer { margin-top: 40px; text-align: center; color: #48484A; font-size: 11px; }
  </style>
</head>
<body>
  <h1>📊 Habit Report</h1>
  <p class="subtitle">
    ${user.name} · ${user.email} · Exported on ${dateStr}
  </p>

  <h2>📈 Overview</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${totalCompletions}</div>
      <div class="stat-label">Total completions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${overallRate}%</div>
      <div class="stat-label">30-day rate</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">🔥 ${bestStreak}</div>
      <div class="stat-label">Best streak</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${activeStreaks}</div>
      <div class="stat-label">Active streaks</div>
    </div>
  </div>

  <h2>📅 Last 30 Days</h2>
  <div class="calendar">${calendarCells}</div>
  <div class="legend">
    <span><span class="legend-dot" style="background:#2DC653"></span>Completed</span>
    <span><span class="legend-dot" style="background:#F4A261"></span>Partial</span>
    <span><span class="legend-dot" style="background:#FF6B6B"></span>Missed</span>
    <span><span class="legend-dot" style="background:#2C2C2E"></span>Not scheduled</span>
  </div>

  <h2>✅ Habits</h2>
  <table>
    <thead>
      <tr>
        <th>Habit</th><th>Frequency</th><th>Goal</th>
        <th>30d Rate</th><th>Streak</th><th>Best</th><th>Total</th>
      </tr>
    </thead>
    <tbody>${habitRows}</tbody>
  </table>

  ${moodEntries.length > 0 ? `
  <h2>😊 Mood (avg: ${avgMood}/5)</h2>
  <table>
    <thead><tr><th>Date</th><th>Mood</th><th>Note</th></tr></thead>
    <tbody>${moodRows}</tbody>
  </table>` : ''}

  <footer>Generated by HabitFlow · ${dateStr}</footer>
</body>
</html>`;
}