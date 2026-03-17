import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

const MOODS = [
  { emoji: '😢', level: 1 },
  { emoji: '😕', level: 2 },
  { emoji: '😐', level: 3 },
  { emoji: '🙂', level: 4 },
  { emoji: '🤩', level: 5 },
];

export const MoodTracker = ({ currentMood, onSave }: { currentMood: any, onSave: Function }) => {
  const [note, setNote] = useState(currentMood?.note || '');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      <View style={styles.emojiRow}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.level}
            style={[styles.emojiBtn, currentMood?.level === m.level && styles.selectedEmoji]}
            onPress={() => onSave(m.level, note)}
          >
            <Text style={styles.emojiText}>{m.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Add a note..."
        value={note}
        onChangeText={(text) => {
          setNote(text);
          if (currentMood?.level) onSave(currentMood.level, text);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#1C1C1E' },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  emojiBtn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 25, backgroundColor: '#F2F2F7' },
  selectedEmoji: { backgroundColor: '#E5E5EA', borderWidth: 2, borderColor: '#5856D6' },
  emojiText: { fontSize: 24 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 8, padding: 10, fontSize: 14 }
});