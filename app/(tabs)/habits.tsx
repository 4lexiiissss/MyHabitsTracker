import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useHabits, Habit } from '../../context/HabitContext';

const COLORS = ['#5856D6', '#FF9500', '#FF2D55', '#34C759', '#5AC8FA', '#AF52DE'];
const UNITS = ['L', 'g', 'min', 'h', 'km', 'pages', 'qty'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HabitsScreen() {
  const { habits, addHabit, deleteHabit, reorderHabits, updateHabit } = useHabits();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form States
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [goal, setGoal] = useState('');
  const [unit, setUnit] = useState('qty');
  const [frequencyType, setFrequencyType] = useState<'Daily' | 'Weekly' | 'Specific' | 'N-Days'>('Daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(DAYS);
  const [nDays, setNDays] = useState('1');
  const [timesPerDay, setTimesPerDay] = useState('1');
  const [difficulty, setDifficulty] = useState(1);
  const [reminders, setReminders] = useState(false);
  const [notes, setNotes] = useState('');

  // CORRECTION: Reset et chargement propre des données
  const openEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setName(habit.name || '');
    setColor(habit.color || COLORS[0]);
    // On force la conversion en string pour l'affichage dans l'input
    setGoal(habit.goalValue ? habit.goalValue.toString() : '');
    setUnit(habit.unit || 'qty');
    setDifficulty(habit.difficulty || 1);
    setFrequencyType((habit.frequency?.[0] as any) || 'Daily');
    setTimesPerDay(habit.timesPerDay ? habit.timesPerDay.toString() : '1');
    setReminders(!!habit.reminders);
    setNotes(habit.notes || '');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name) return;
    const habitData: Habit = {
      id: editingId || Date.now().toString(),
      name,
      color,
      frequency: [frequencyType],
      goalValue: goal !== '' ? parseFloat(goal) : undefined,
      unit: goal !== '' ? unit : undefined,
      difficulty,
      timesPerDay: parseInt(timesPerDay) || 1,
      reminders,
      notes,
    };

    if (editingId) {
      updateHabit(habitData);
    } else {
      addHabit(habitData);
    }
    closeModal();
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setName('');
    setGoal('');
    setUnit('qty');
    setNotes('');
    setDifficulty(1);
    setFrequencyType('Daily');
    setTimesPerDay('1');
    setNDays('1');
    setSelectedDays(DAYS);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Habit>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity 
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            drag();
          }}
          disabled={isActive}
          style={[styles.habitItem, isActive && styles.activeItem]}
        >
          <Ionicons name="menu" size={20} color="#C7C7CC" style={{ marginRight: 10 }} />
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.habitName}>{item.name}</Text>
            <Text style={styles.habitSub}>
               {item.frequency?.[0]} • {item.goalValue ? `${item.goalValue}${item.unit}` : 'Checklist'}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
              <Ionicons name="pencil" size={18} color="#5856D6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteHabit(item.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <DraggableFlatList
          data={habits}
          onDragEnd={({ data }) => reorderHabits(data)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No habits found. Tap + to create one.</Text>}
        />

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>

        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Habit' : 'New Habit'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>HABIT NAME</Text>
              <TextInput 
                style={styles.input} 
                placeholder="E.g. Drink Water" 
                placeholderTextColor="#8E8E93" 
                value={name} 
                onChangeText={setName} 
              />
              
              <Text style={styles.label}>COLOR</Text>
              <View style={styles.colorRow}>
                {COLORS.map(c => (
                  <TouchableOpacity 
                    key={c} 
                    style={[styles.colorOption, { backgroundColor: c }, color === c && styles.selectedColor]} 
                    onPress={() => setColor(c)} 
                  />
                ))}
              </View>

              <Text style={styles.label}>FREQUENCY</Text>
              <View style={styles.freqContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
                  {['Daily', 'Weekly', 'Specific', 'N-Days'].map((type) => (
                    <TouchableOpacity 
                      key={type} 
                      style={[styles.typeBtn, frequencyType === type && styles.selectedType]} 
                      onPress={() => setFrequencyType(type as any)}
                    >
                      <Text style={[styles.typeText, frequencyType === type && {color: 'white'}]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                {frequencyType === 'Specific' && (
                  <View style={styles.daysRow}>
                    {DAYS.map(day => (
                      <TouchableOpacity 
                        key={day} 
                        style={[styles.dayCircle, selectedDays.includes(day) && styles.selectedDayCircle]} 
                        onPress={() => toggleDay(day)}
                      >
                        <Text style={[styles.dayText, selectedDays.includes(day) && {color: 'white'}]}>{day[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                {frequencyType === 'N-Days' && (
                  <View style={styles.row}>
                    <Text style={{color: '#1C1C1E'}}>Every </Text>
                    <TextInput 
                      style={[styles.input, {flex: 0.3, marginBottom: 0, paddingVertical: 5, textAlign: 'center'}]} 
                      keyboardType="numeric" 
                      value={nDays} 
                      onChangeText={setNDays} 
                    />
                    <Text style={{color: '#1C1C1E'}}> days</Text>
                  </View>
                )}
              </View>

              <Text style={styles.label}>GOAL & QUANTITY</Text>
              <View style={styles.row}>
                <TextInput 
                  style={[styles.input, {flex: 1, marginBottom: 0, borderBottomColor: '#5856D6', borderBottomWidth: 1}]} 
                  placeholder="Value (e.g. 3)" 
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric" 
                  value={goal} // CORRECTION: Liaison stricte avec l'état local
                  onChangeText={(text) => setGoal(text)} 
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                  {UNITS.map(u => (
                    <TouchableOpacity 
                      key={u} 
                      style={[styles.unitBtn, unit === u && styles.selectedUnit]} 
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[styles.unitText, unit === u && { color: 'white' }]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {goal !== '' && (
                <Text style={styles.previewText}>Target: {goal} {unit} per day</Text>
              )}

              <Text style={styles.label}>TIMES PER DAY</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric" 
                value={timesPerDay} // CORRECTION: Liaison stricte
                onChangeText={setTimesPerDay} 
              />

              <Text style={styles.label}>DIFFICULTY: {difficulty}</Text>
              <Slider
                style={{width: '100%', height: 40}}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={difficulty}
                onValueChange={setDifficulty}
                minimumTrackTintColor="#5856D6"
                maximumTrackTintColor="#D1D1D6"
                thumbTintColor="#5856D6"
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>REMINDERS & NOTIFICATIONS</Text>
                <Switch value={reminders} onValueChange={setReminders} trackColor={{ false: "#D1D1D6", true: "#5856D6" }} />
              </View>

              <Text style={styles.label}>NOTES</Text>
              <TextInput 
                style={[styles.input, { height: 80, paddingTop: 15 }]} 
                placeholder="Why do you want to track this?" 
                placeholderTextColor="#8E8E93"
                multiline 
                value={notes} 
                onChangeText={setNotes} 
              />

              <TouchableOpacity style={styles.createBtn} onPress={handleSave}>
                <Text style={styles.createBtnText}>{editingId ? 'Save Changes' : 'Create Habit'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', paddingHorizontal: 15 },
  habitItem: { backgroundColor: 'white', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  activeItem: { backgroundColor: '#E5E5EA', transform: [{scale: 1.02}] },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 15 },
  habitName: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  habitSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 8, backgroundColor: '#F2F2F7', borderRadius: 8 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, backgroundColor: '#5856D6', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalContent: { flex: 1, padding: 20, backgroundColor: '#F2F2F7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  closeText: { color: '#5856D6', fontSize: 16 },
  label: { fontSize: 13, color: '#8E8E93', fontWeight: 'bold', marginTop: 22, marginBottom: 8 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 10, color: '#000' },
  previewText: { fontSize: 12, color: '#5856D6', fontWeight: '600', marginTop: -5, marginLeft: 5 },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  colorOption: { width: 40, height: 40, borderRadius: 20 },
  selectedColor: { borderWidth: 3, borderColor: '#1C1C1E' },
  freqContainer: { backgroundColor: 'white', padding: 15, borderRadius: 12 },
  typeBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F2F7', marginRight: 8 },
  selectedType: { backgroundColor: '#5856D6' },
  typeText: { fontSize: 14, fontWeight: '500' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dayCircle: { width: 35, height: 35, borderRadius: 18, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  selectedDayCircle: { backgroundColor: '#5856D6' },
  dayText: { fontSize: 12, fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  unitScroll: { marginLeft: 5 },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F2F7', marginRight: 5 },
  selectedUnit: { backgroundColor: '#5856D6' },
  unitText: { fontSize: 12, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  createBtn: { backgroundColor: '#5856D6', padding: 18, borderRadius: 16, marginTop: 40, marginBottom: 40, alignItems: 'center' },
  createBtnText: { color: 'white', fontWeight: 'bold', fontSize: 17 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#8E8E93' }
});