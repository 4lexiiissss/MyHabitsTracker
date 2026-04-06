import { Platform } from 'react-native';
import { Habit } from '@/constants/habits';

// expo-notifications n'est pas supporté dans Expo Go (SDK 53+)
// Ce fichier est un stub sécurisé — les vraies notifs s'activeront dans un dev build

let Notifications: any = null;

try {
  Notifications = require('expo-notifications');
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch {
  Notifications = null;
}

async function isAvailable(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habits', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleHabitReminder(habit: Habit): Promise<void> {
  if (!habit.reminder) return;
  try {
    const granted = await isAvailable();
    if (!granted) return;
    await Notifications.cancelScheduledNotificationAsync(`habit-${habit.id}`).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: `habit-${habit.id}`,
      content: {
        title: `${habit.icon ?? ''} ${habit.name}`.trim(),
        body: habit.description || (habit.quantity ? `Goal: ${habit.goalQty} ${habit.unit}` : "Don't break your streak! 🔥"),
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
        hour: 9,
        minute: 0,
      },
    });
  } catch {
    // Silently fail in Expo Go
  }
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  try {
    await Notifications?.cancelScheduledNotificationAsync(`habit-${habitId}`);
  } catch {}
}

export async function syncAllReminders(habits: Habit[]): Promise<void> {
  for (const habit of habits) {
    if (habit.reminder) await scheduleHabitReminder(habit);
    else await cancelHabitReminder(habit.id);
  }
}