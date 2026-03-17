import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabits } from '../../context/HabitContext';
import { MoodTracker } from '../../components/MoodTracker';

export default function TodayScreen() {
  const { habits, logs, updateProgress, updateMood } = useHabits();
  const today = new Date().toISOString().split('T')[0];
  const todayData = logs[today] || {};

  const renderHabit = ({ item }: { item: any }) => {
    const log = todayData[item.id] || { progress: 0, isCompleted: false };

    return (
      <View style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 5 }]}>
        <View style={styles.cardContent}>
          <Text style={styles.habitName}>{item.name}</Text>
          {item.goalValue && (
            <Text style={styles.progressText}>
              {log.progress} / {item.goalValue} {item.unit}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.checkBtn, log.isCompleted && { backgroundColor: item.color, borderColor: item.color }]}
          onPress={() => {
            const newProgress = log.isCompleted ? 0 : (item.goalValue || 1);
            updateProgress(today, item.id, newProgress, item.goalValue);
          }}
        >
          {log.isCompleted && <Ionicons name="checkmark" size={20} color="white" />}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        ListHeaderComponent={
          <>
            <View style={styles.headerContainer}>
              <Text style={styles.headerLabel}>Today Habits</Text>
              <Text style={styles.headerDate}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <MoodTracker 
              currentMood={todayData.mood} 
              onSave={(level: number, note: string) => updateMood(today, level, note)} 
            />
          </>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', paddingHorizontal: 20 },
  headerContainer: { marginTop: 20, marginBottom: 20 },
  headerLabel: { fontSize: 14, color: '#8E8E93', textTransform: 'uppercase', fontWeight: '600' },
  headerDate: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E' },
  list: { paddingBottom: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: { flex: 1 },
  habitName: { fontSize: 18, fontWeight: '600' },
  progressText: { color: '#8E8E93', marginTop: 4 },
  checkBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' }
});