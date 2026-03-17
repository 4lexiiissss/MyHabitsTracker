import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Définition précise des types
export type Habit = {
  id: string;
  name: string;
  color: string;
  frequency: string[]; // ['Daily'], ['Monday', 'Tuesday'], etc.
  goalValue?: number;
  unit?: string;
  timesPerDay?: number;
  difficulty?: number;
  reminders?: boolean;
  isMood?: boolean;
};

export type LogEntry = {
  progress: number;
  isCompleted: boolean;
  note?: string;
  moodLevel?: number;
};

type HabitContextType = {
  habits: Habit[];
  logs: Record<string, Record<string, any>>; // Date -> HabitId -> Data
  addHabit: (habit: Habit) => void;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (newData: Habit[]) => void;
  updateProgress: (date: string, habitId: string, value: number, goal?: number) => void;
  updateMood: (date: string, level: number, note: string) => void;
  loading: boolean;
};

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Charger les données au démarrage
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedHabits = await AsyncStorage.getItem('@habits_v1');
        const savedLogs = await AsyncStorage.getItem('@logs_v1');
        
        if (savedHabits) {
          setHabits(JSON.parse(savedHabits));
        }
        if (savedLogs) {
          setLogs(JSON.parse(savedLogs));
        }
      } catch (e) {
        console.error("Erreur lors du chargement des données", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Sauvegarder automatiquement dès que 'habits' ou 'logs' change
  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem('@habits_v1', JSON.stringify(habits));
    }
  }, [habits, loading]);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem('@logs_v1', JSON.stringify(logs));
    }
  }, [logs, loading]);

  // --- ACTIONS ---

  const addHabit = (habit: Habit) => {
    setHabits((prev) => [...prev, habit]);
  };

  const updateHabit = (updatedHabit: Habit) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === updatedHabit.id ? updatedHabit : h))
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const reorderHabits = (newData: Habit[]) => {
    setHabits(newData);
  };

  const updateProgress = (date: string, habitId: string, value: number, goal?: number) => {
    setLogs((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [habitId]: {
          progress: value,
          isCompleted: goal ? value >= goal : true,
        },
      },
    }));
  };

  const updateMood = (date: string, level: number, note: string) => {
    setLogs((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        mood: { level, note },
      },
    }));
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        logs,
        addHabit,
        updateHabit,
        deleteHabit,
        reorderHabits,
        updateProgress,
        updateMood,
        loading,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};