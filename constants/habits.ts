export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const UNITS = ['L','ml','g','kg','km','m','min','h','pages','reps','sets','cups','oz','steps','cal',''];

export const MOODS = [
  { emoji: '😄', label: 'Great', score: 5 },
  { emoji: '🙂', label: 'Good',  score: 4 },
  { emoji: '😐', label: 'Okay',  score: 3 },
  { emoji: '😕', label: 'Meh',   score: 2 },
  { emoji: '😞', label: 'Bad',   score: 1 },
];

export const HABIT_ICONS = [
  // Sport & Santé
  '🏃','🚴','🏋️','🧘','🤸','🏊','🚶','⛹️','🧗','🤾',
  // Alimentation
  '💧','🥗','🥤','🍎','☕','🍵','🥦','🥑','🍳','🥕',
  // Mental & Study
  '📚','✍️','🎯','🧠','💡','📖','🎓','🔬','💻','📝',
  // Bien-être
  '😴','🧴','🛁','🪥','💊','🫧','❤️','🌿','🌸','✨',
  // Créativité
  '🎨','🎵','🎸','🖊️','📷','🎬','🎭','🎹','✏️','🎤',
  // Maison & Vie
  '🏠','🌱','🐕','📱','💰','🛒','🧹','📅','⏰','🔑',
];

export const HABIT_COLORS = [
  '#6C63FF','#FF6B6B','#48CAE4','#2DC653',
  '#F4A261','#E76F51','#A8DADC','#F77F00',
  '#B5179E','#4361EE','#06D6A0','#EF476F',
];

export const DIFFICULTIES = ['Very Easy','Easy','Medium','Hard','Very Hard'];

export type FrequencyType = 'daily' | 'specific' | 'every_n';

export interface Habit {
  id: string;
  name: string;
  icon: string;         // emoji icon
  description: string;  // optional description
  color: string;
  frequency: FrequencyType;
  days: number[];
  timesPerDay: number;
  quantity: boolean;
  unit: string;
  goalQty: number;
  nDays: number;
  reminder: boolean;
  notes: string;
  difficulty: number;
  createdAt: number;
}

export interface DayLog {
  done?: boolean;
  qty?: number;
}

// { [habitId]: { [dateKey 'YYYY-MM-DD']: DayLog } }
export type HabitLogs = Record<string, Record<string, DayLog>>;

export interface MoodEntry {
  score: number;   // 1-5
  note?: string;
}

// { [dateKey 'YYYY-MM-DD']: MoodEntry }
export type MoodLogs = Record<string, MoodEntry>;