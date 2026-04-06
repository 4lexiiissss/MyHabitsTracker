import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Pressable, Switch, Alert, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabits } from '@/context/HabitContext';
import { Habit, HABIT_COLORS, HABIT_ICONS, UNITS, DIFFICULTIES, DAY_NAMES } from '@/constants/habits';
import { FrequencyType } from '@/constants/habits';

// ─── Dark theme tokens ────────────────────────────────────────────────────────

const D = {
  bg:        '#111111',
  surface:   '#1C1C1E',
  surface2:  '#2C2C2E',
  border:    '#3A3A3C',
  text:      '#FFFFFF',
  textSub:   '#8E8E93',
  textHint:  '#48484A',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type HabitFormData = Omit<Habit, 'id' | 'createdAt'>;

const BLANK: HabitFormData = {
  name: '', icon: '⭐', description: '', color: '#FF2D55',
  frequency: 'daily', days: [], timesPerDay: 1,
  quantity: false, unit: 'min', goalQty: 30, nDays: 2,
  reminder: false, notes: '', difficulty: 1,
};

// ─── Preview Card ─────────────────────────────────────────────────────────────

function HabitPreview({ form }: { form: HabitFormData }) {
  const name = form.name.trim() || 'Habit name';
  const freqText = form.frequency === 'daily' ? 'Every day' :
    form.frequency === 'specific' ? (form.days.map(d => DAY_NAMES[d]).join(', ') || 'No days') :
    `Every ${form.nDays} days`;
  const goalText = form.quantity ? `, ${form.goalQty} ${form.unit}` : '';

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
      <Text style={[formStyles.sectionTitle, { marginBottom: 8 }]}>Preview</Text>
      <View style={[formStyles.previewCard, { backgroundColor: form.color }]}>
        <View style={formStyles.previewIconCircle}>
          <Text style={{ fontSize: 22 }}>{form.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={formStyles.previewName} numberOfLines={1}>{name}</Text>
          <Text style={formStyles.previewSub}>{freqText}{goalText}</Text>
        </View>
        <Text style={formStyles.previewEdit}>✎</Text>
      </View>
      {form.description.trim() ? (
        <Text style={formStyles.previewDesc} numberOfLines={2}>{form.description}</Text>
      ) : null}
    </View>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────

function SettingsRow({ icon, iconBg, label, value, onPress, last, children }: {
  icon: string; iconBg: string; label: string;
  value?: React.ReactNode; onPress?: () => void;
  last?: boolean; children?: React.ReactNode;
}) {
  const content = (
    <View style={[formStyles.row, last && { borderBottomWidth: 0 }]}>
      <View style={[formStyles.rowIcon, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <Text style={formStyles.rowLabel}>{label}</Text>
      <View style={formStyles.rowRight}>
        {typeof value === 'string' || typeof value === 'number'
          ? <Text style={formStyles.rowValue}>{value}</Text>
          : value}
        <Text style={formStyles.rowChevron}>›</Text>
      </View>
    </View>
  );
  if (children) return <View>{content}{children}</View>;
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.6}>{content}</TouchableOpacity>;
  return content;
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
      <Text style={formStyles.sectionTitle}>{title}</Text>
      <View style={formStyles.sectionCard}>
        {children}
      </View>
    </View>
  );
}

// ─── Icon Picker Modal ────────────────────────────────────────────────────────

function IconPickerModal({ visible, current, color, onSelect, onClose }: {
  visible: boolean; current: string; color: string;
  onSelect: (i: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>Choose an Icon</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={pickerStyles.grid}>
              {HABIT_ICONS.map(icon => (
                <TouchableOpacity key={icon} onPress={() => { onSelect(icon); onClose(); }}
                  style={[pickerStyles.cell, current === icon && { backgroundColor: color + '33', borderColor: color }]}>
                  <Text style={{ fontSize: 28 }}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Color Picker Modal ───────────────────────────────────────────────────────

const ALL_COLORS = [
  '#FF2D55','#FF6B6B','#FF9500','#FFCC00','#34C759','#06D6A0',
  '#2DC653','#48CAE4','#007AFF','#6C63FF','#4361EE','#5856D6',
  '#AF52DE','#B5179E','#FF375F','#E76F51','#F77F00','#F4A261',
  '#A8DADC','#457B9D','#2D6A4F','#52B788','#343A40','#8E8E93',
];

function ColorPickerModal({ visible, current, onSelect, onClose }: {
  visible: boolean; current: string;
  onSelect: (c: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handle} />
          <Text style={pickerStyles.title}>Choose a Color</Text>
          <View style={[pickerStyles.colorPreview, { backgroundColor: current }]}>
            <Text style={pickerStyles.colorPreviewText}>Preview</Text>
          </View>
          <View style={pickerStyles.colorGrid}>
            {ALL_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => { onSelect(c); onClose(); }}
                style={[pickerStyles.colorDot, { backgroundColor: c },
                  current === c && pickerStyles.colorDotActive]}>
                {current === c && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Description Modal ────────────────────────────────────────────────────────

function DescriptionModal({ visible, value, onChange, onClose }: {
  visible: boolean; value: string;
  onChange: (v: string) => void; onClose: () => void;
}) {
  const [text, setText] = useState(value);
  React.useEffect(() => { if (visible) setText(value); }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={pickerStyles.overlay} onPress={onClose}>
          <Pressable style={pickerStyles.sheet} onPress={e => e.stopPropagation()}>
            <View style={pickerStyles.handle} />
            <Text style={pickerStyles.title}>Description</Text>
            <TextInput
              style={descStyles.input}
              value={text}
              onChangeText={setText}
              placeholder="What is this habit about? (optional)"
              placeholderTextColor="#48484A"
              multiline
              autoFocus
              maxLength={200}
              textAlignVertical="top"
              scrollEnabled
            />
            <Text style={descStyles.counter}>{text.length}/200</Text>
            <TouchableOpacity
              style={descStyles.saveBtn}
              onPress={() => { onChange(text); onClose(); }}
            >
              <Text style={descStyles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const descStyles = StyleSheet.create({
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  counter: { fontSize: 12, color: '#8E8E93', textAlign: 'right', marginBottom: 16 },
  saveBtn: { backgroundColor: '#6C63FF', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

// ─── Days Picker (inline) ─────────────────────────────────────────────────────

function DaysPicker({ days, color, onChange }: {
  days: number[]; color: string; onChange: (days: number[]) => void;
}) {
  const toggle = (d: number) =>
    onChange(days.includes(d) ? days.filter(x => x !== d) : [...days, d]);
  return (
    <View style={daysStyles.container}>
      {DAY_NAMES.map((d, i) => (
        <TouchableOpacity key={d} onPress={() => toggle(i)}
          style={[daysStyles.btn, days.includes(i) && { backgroundColor: color }]}>
          <Text style={[daysStyles.text, days.includes(i) && { color: '#fff', fontWeight: '700' }]}>{d}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const daysStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 5, paddingHorizontal: 14, paddingBottom: 14 },
  btn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: D.surface2, alignItems: 'center' },
  text: { fontSize: 11, fontWeight: '600', color: D.textSub },
});

// ─── Habit Form ───────────────────────────────────────────────────────────────

function HabitForm({ initial, onSave, onClose }: {
  initial?: HabitFormData;
  onSave: (data: HabitFormData) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets(); // ← insets réels de l'appareil
  const [form, setForm] = useState<HabitFormData>(initial ? { ...BLANK, ...initial } : BLANK);
  const set = <K extends keyof HabitFormData>(k: K, v: HabitFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const [iconOpen,  setIconOpen]  = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [descOpen,  setDescOpen]  = useState(false);
  const [nameLen,   setNameLen]   = useState(form.name.length);

  const canSave = form.name.trim().length > 0;

  const freqLabel = form.frequency === 'daily' ? 'Every day' :
    form.frequency === 'specific' ? (form.days.length > 0 ? form.days.map(d => DAY_NAMES[d]).join(', ') : 'Choose days') :
    `Every ${form.nDays} days`;

  return (
    <View style={{ flex: 1 }}>
      {/* Header — paddingTop = inset réel de l'appareil (Dynamic Island, notch...) */}
      <View style={[formStyles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onClose} style={formStyles.headerBack}>
          <Text style={formStyles.headerBackText}>‹</Text>
        </TouchableOpacity>
        <Text style={formStyles.headerTitle}>{initial ? 'Edit Habit' : 'Add Habit'}</Text>
        <TouchableOpacity
          style={[formStyles.headerSave, { backgroundColor: canSave ? form.color : D.surface2 }]}
          onPress={() => canSave && onSave(form)}
          disabled={!canSave}
        >
          <Text style={[formStyles.headerSaveText, !canSave && { color: D.textSub }]}>✓</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Name input */}
        <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
          <TextInput
            style={formStyles.nameInput}
            placeholder="Habit name..."
            placeholderTextColor={D.textHint}
            value={form.name}
            onChangeText={v => { set('name', v); setNameLen(v.length); }}
            maxLength={100}
            autoFocus={!initial}
          />
          <Text style={formStyles.nameCounter}>{nameLen}/100</Text>
        </View>

        {/* Preview */}
        <HabitPreview form={form} />

        {/* Appearance */}
        <Section title="Appearance">
          <SettingsRow
            icon="🎨" iconBg="#5E35B1"
            label="Color"
            value={<View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: form.color }} />}
            onPress={() => setColorOpen(true)}
          />
          <SettingsRow
            icon="🖼" iconBg="#E53935"
            label="Icon"
            value={<Text style={{ fontSize: 20 }}>{form.icon}</Text>}
            onPress={() => setIconOpen(true)}
          />
          <SettingsRow
            icon="📝" iconBg="#E65100"
            label="Description"
            value={form.description.trim() || 'Empty'}
            onPress={() => setDescOpen(true)}
            last
          />
        </Section>

        {/* General */}
        <Section title="General">
          {/* Frequency */}
          <SettingsRow
            icon="🔁" iconBg="#1565C0"
            label="Repeat"
            value={freqLabel}
          >
            {/* Inline frequency selector */}
            <View style={formStyles.inlineSelector}>
              {([['daily','Every day'],['specific','Specific'],['every_n','Every N']] as [FrequencyType, string][]).map(([v, l]) => (
                <TouchableOpacity key={v} onPress={() => set('frequency', v)}
                  style={[formStyles.inlineBtn, form.frequency === v && { backgroundColor: form.color }]}>
                  <Text style={[formStyles.inlineBtnText, form.frequency === v && { color: '#fff' }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.frequency === 'specific' && (
              <DaysPicker days={form.days} color={form.color} onChange={d => set('days', d)} />
            )}
            {form.frequency === 'every_n' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 14 }}>
                <Text style={{ color: D.textSub, fontSize: 14 }}>Every</Text>
                <TextInput
                  style={formStyles.nDaysInput}
                  keyboardType="number-pad"
                  value={String(form.nDays)}
                  onChangeText={v => set('nDays', parseInt(v) || 2)}
                />
                <Text style={{ color: D.textSub, fontSize: 14 }}>days</Text>
              </View>
            )}
          </SettingsRow>

          {/* Quantity toggle */}
          <View style={[formStyles.row, { paddingVertical: 14 }]}>
            <View style={[formStyles.rowIcon, { backgroundColor: '#2E7D32' }]}>
              <Text style={{ fontSize: 14 }}>🎯</Text>
            </View>
            <Text style={formStyles.rowLabel}>Goal / Quantity</Text>
            <Switch
              value={form.quantity}
              onValueChange={v => set('quantity', v)}
              trackColor={{ false: D.surface2, true: form.color + 'AA' }}
              thumbColor={form.quantity ? form.color : '#8E8E93'}
            />
          </View>

          {form.quantity && (
            <View style={formStyles.goalRow}>
              <TextInput
                style={formStyles.goalInput}
                keyboardType="decimal-pad"
                value={String(form.goalQty)}
                onChangeText={v => set('goalQty', parseFloat(v) || 1)}
                placeholderTextColor={D.textHint}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {UNITS.filter(u => u).map(u => (
                    <TouchableOpacity key={u} onPress={() => set('unit', u)}
                      style={[formStyles.unitChip, form.unit === u && { backgroundColor: form.color + '33', borderColor: form.color }]}>
                      <Text style={[formStyles.unitText, form.unit === u && { color: form.color }]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Difficulty */}
          <View style={[formStyles.row, { flexDirection: 'column', alignItems: 'flex-start', paddingBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={[formStyles.rowIcon, { backgroundColor: '#AD1457' }]}>
                <Text style={{ fontSize: 14 }}>💪</Text>
              </View>
              <Text style={formStyles.rowLabel}>Difficulty — <Text style={{ color: form.color }}>{DIFFICULTIES[form.difficulty]}</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, paddingLeft: 50 }}>
              {DIFFICULTIES.map((d, i) => (
                <TouchableOpacity key={d} onPress={() => set('difficulty', i)}
                  style={[formStyles.diffBtn, form.difficulty === i && { backgroundColor: form.color }]}>
                  <Text style={[formStyles.diffText, form.difficulty === i && { color: '#fff' }]}>{i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reminder */}
          <View style={[formStyles.row, { borderBottomWidth: 0, paddingVertical: 14 }]}>
            <View style={[formStyles.rowIcon, { backgroundColor: '#6A1B9A' }]}>
              <Text style={{ fontSize: 14 }}>🔔</Text>
            </View>
            <Text style={formStyles.rowLabel}>Reminder</Text>
            <Switch
              value={form.reminder}
              onValueChange={v => set('reminder', v)}
              trackColor={{ false: D.surface2, true: form.color + 'AA' }}
              thumbColor={form.reminder ? form.color : '#8E8E93'}
            />
          </View>
        </Section>

      </ScrollView>

      {/* Modals */}
      <IconPickerModal visible={iconOpen} current={form.icon} color={form.color}
        onSelect={i => set('icon', i)} onClose={() => setIconOpen(false)} />
      <ColorPickerModal visible={colorOpen} current={form.color}
        onSelect={c => set('color', c)} onClose={() => setColorOpen(false)} />
      <DescriptionModal visible={descOpen} value={form.description}
        onChange={v => set('description', v)} onClose={() => setDescOpen(false)} />
    </View>
  );
}

// ─── Form styles ──────────────────────────────────────────────────────────────

const formStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  headerBack: { width: 36, height: 36, borderRadius: 18, backgroundColor: D.surface2, alignItems: 'center', justifyContent: 'center' },
  headerBackText: { color: D.text, fontSize: 22, fontWeight: '600', marginTop: -2 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: D.text },
  headerSave: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerSaveText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  nameInput: {
    fontSize: 28, fontWeight: '700', color: D.text,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: D.border,
    marginBottom: 4,
  },
  nameCounter: { fontSize: 11, color: D.textHint, textAlign: 'right', marginBottom: 12 },

  previewCard: {
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  previewIconCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  previewSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  previewEdit: { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
  previewDesc: { fontSize: 13, color: D.textSub, marginTop: 6, paddingHorizontal: 4 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: D.textSub, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCard: { backgroundColor: D.surface, borderRadius: 14, overflow: 'hidden' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 0.5, borderBottomColor: D.border,
  },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: D.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 15, color: D.textSub, maxWidth: 140 },
  rowChevron: { fontSize: 20, color: D.textSub, marginRight: -4 },

  inlineSelector: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 14, paddingBottom: 12,
  },
  inlineBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: D.surface2, alignItems: 'center',
  },
  inlineBtnText: { fontSize: 12, fontWeight: '600', color: D.textSub },

  nDaysInput: {
    backgroundColor: D.surface2, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 16, fontWeight: '700', color: D.text, width: 60, textAlign: 'center',
  },

  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  goalInput: {
    backgroundColor: D.surface2, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 20, fontWeight: '700', color: D.text, width: 80, textAlign: 'center',
  },
  unitChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: D.border, backgroundColor: D.surface2,
  },
  unitText: { fontSize: 13, color: D.textSub, fontWeight: '600' },

  diffBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: D.surface2, alignItems: 'center', justifyContent: 'center',
  },
  diffText: { fontSize: 14, fontWeight: '700', color: D.textSub },
});

// ─── Picker styles ────────────────────────────────────────────────────────────

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: D.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, maxHeight: '80%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: D.border, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: D.text, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 20 },
  cell: {
    width: 54, height: 54, borderRadius: 14,
    backgroundColor: D.surface2, borderWidth: 1.5, borderColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  colorPreview: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  colorPreviewText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  colorDot: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: '#fff', transform: [{ scale: 1.12 }] },
});

// ─── Reorderable list ─────────────────────────────────────────────────────────

function ReorderableHabitList({ habits, onReorder, onEdit, onDelete }: {
  habits: Habit[];
  onReorder: (next: Habit[]) => void;
  onEdit: (h: Habit) => void;
  onDelete: (h: Habit) => void;
}) {
  const freqLabel = (h: Habit) =>
    h.frequency === 'daily' ? 'Daily' :
    h.frequency === 'specific' ? (h.days ?? []).map(d => DAY_NAMES[d]).join(', ') || 'No days' :
    `Every ${h.nDays} days`;

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...habits];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onReorder(next);
  };
  const moveDown = (idx: number) => {
    if (idx === habits.length - 1) return;
    const next = [...habits];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onReorder(next);
  };

  return (
    <View>
      {habits.map((habit, idx) => (
        <View key={habit.id} style={listStyles.row}>
          {/* Arrows */}
          <View style={listStyles.arrows}>
            <TouchableOpacity onPress={() => moveUp(idx)} disabled={idx === 0}
              style={[listStyles.arrowBtn, idx === 0 && { opacity: 0.2 }]}>
              <Text style={listStyles.arrowText}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => moveDown(idx)} disabled={idx === habits.length - 1}
              style={[listStyles.arrowBtn, idx === habits.length - 1 && { opacity: 0.2 }]}>
              <Text style={listStyles.arrowText}>▼</Text>
            </TouchableOpacity>
          </View>
          {/* Icon */}
          <View style={[listStyles.iconCircle, { backgroundColor: habit.color + '33' }]}>
            <Text style={{ fontSize: 20 }}>{habit.icon || '⭐'}</Text>
          </View>
          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={listStyles.name} numberOfLines={1}>{habit.name}</Text>
            <Text style={listStyles.sub}>{freqLabel(habit)}{habit.quantity ? ` · ${habit.goalQty} ${habit.unit}` : ''}</Text>
          </View>
          {/* Actions */}
          <TouchableOpacity onPress={() => onEdit(habit)} style={listStyles.actionBtn}>
            <Text style={{ fontSize: 17, color: D.textSub }}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(habit)} style={listStyles.actionBtn}>
            <Text style={{ fontSize: 17, color: '#FF453A' }}>🗑</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const listStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: D.surface, borderRadius: 14,
    padding: 12, marginBottom: 8,
  },
  arrows: { gap: 3 },
  arrowBtn: { width: 22, height: 22, borderRadius: 6, backgroundColor: D.surface2, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 9, color: '#6C63FF', fontWeight: '700' },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: D.text },
  sub: { fontSize: 12, color: D.textSub, marginTop: 2 },
  actionBtn: { padding: 5 },
});

// ─── Full-screen Form Modal ───────────────────────────────────────────────────

function FormModal({ visible, initial, onSave, onClose }: {
  visible: boolean; initial?: HabitFormData;
  onSave: (data: HabitFormData) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <StatusBar barStyle="light-content" />
      {/* View noire full screen — insets gérés manuellement dans HabitForm */}
      <View style={{ flex: 1, backgroundColor: D.bg }}>
        <HabitForm initial={initial} onSave={onSave} onClose={onClose} />
      </View>
    </Modal>
  );
}

// ─── Habits Screen ────────────────────────────────────────────────────────────

export default function HabitsScreen() {
  const { habits, addHabit, updateHabit, deleteHabit, reorderHabits } = useHabits();
  const [addOpen,   setAddOpen]   = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  const handleAdd  = (data: HabitFormData) => { addHabit(data);  setAddOpen(false); };
  const handleEdit = (data: HabitFormData) => {
    if (editHabit) { updateHabit({ ...editHabit, ...data }); setEditHabit(null); }
  };
  const handleDelete = (habit: Habit) => {
    Alert.alert('Delete', `Delete "${habit.name}"? All progress will be lost.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habit.id) },
    ]);
  };

  return (
    <SafeAreaView style={screenStyles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={screenStyles.header}>
        <Text style={screenStyles.title}>My Habits</Text>
        <TouchableOpacity style={screenStyles.addBtn} onPress={() => setAddOpen(true)}>
          <Text style={screenStyles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={screenStyles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={screenStyles.hint}>Use ▲ ▼ to reorder</Text>
        {habits.length === 0 ? (
          <View style={screenStyles.empty}>
            <Text style={{ fontSize: 52, marginBottom: 14 }}>✨</Text>
            <Text style={screenStyles.emptyTitle}>No habits yet</Text>
            <Text style={screenStyles.emptySub}>Tap + Add to get started</Text>
          </View>
        ) : (
          <ReorderableHabitList
            habits={habits} onReorder={reorderHabits}
            onEdit={setEditHabit} onDelete={handleDelete}
          />
        )}
      </ScrollView>

      <FormModal visible={addOpen} onSave={handleAdd} onClose={() => setAddOpen(false)} />
      <FormModal visible={!!editHabit} initial={editHabit ?? undefined}
        onSave={handleEdit} onClose={() => setEditHabit(null)} />
    </SafeAreaView>
  );
}

const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', color: D.text, letterSpacing: -0.5 },
  addBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },
  hint: { fontSize: 12, color: D.textHint, marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: D.text, marginBottom: 6 },
  emptySub: { fontSize: 14, color: D.textSub },
});