import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';
import { isScheduledToday, formatDateKey, isDone, computeStreak } from '@/constants/habitUtils';
import { MONTH_NAMES } from '@/constants/habits';
import { buildExportHTML } from '@/constants/exportPdf';

const AVATAR_COLORS = [
  '#6C63FF','#FF6B6B','#48CAE4','#2DC653',
  '#F4A261','#E76F51','#B5179E','#4361EE',
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [color, setColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible) { setName(user?.name ?? ''); setColor(user?.avatarColor ?? AVATAR_COLORS[0]); }
  }, [visible]);

  const save = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await updateProfile({ name: name.trim(), avatarColor: color });
    setLoading(false);
    onClose();
  };

  const initials = name.trim().split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Edit Profile</Text>

          {/* Avatar preview */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={[styles.avatarLg, { backgroundColor: color }]}>
              <Text style={styles.avatarLgText}>{initials}</Text>
            </View>
          </View>

          {/* Color picker */}
          <Text style={styles.formLabel}>Avatar Color</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}>
                {color === c && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Name */}
          <Text style={[styles.formLabel, { marginTop: 16 }]}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#C7C7CC"
          />

          <TouchableOpacity
            style={[styles.primaryBtn, (!name.trim() || loading) && { opacity: 0.6 }]}
            onPress={save}
            disabled={!name.trim() || loading}
          >
            <Text style={styles.primaryBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { habits, logs, moods } = useHabits();
  const [editOpen, setEditOpen] = useState(false);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // ── Global stats ──────────────────────────────────────────────────────────

  // Total completions ever
  const totalCompletions = habits.reduce((sum, h) => {
    const hLog = logs[h.id] ?? {};
    return sum + Object.values(hLog).filter(l => isDone(h, l)).length;
  }, 0);

  // Best overall streak across all habits
  const bestStreak = habits.reduce((best, h) => {
    const { best: b } = computeStreak(h, logs);
    return Math.max(best, b);
  }, 0);

  // Current active streaks
  const activeStreaks = habits.filter(h => computeStreak(h, logs).current > 0).length;

  // Days since first habit created
  const firstHabitDate = habits.length > 0
    ? new Date(Math.min(...habits.map(h => h.createdAt)))
    : null;
  const daysSinceStart = firstHabitDate
    ? Math.floor((Date.now() - firstHabitDate.getTime()) / 86_400_000)
    : 0;

  // Today completion
  const todayHabits = habits.filter(h => isScheduledToday(h, today));
  const todayDone = todayHabits.filter(h => isDone(h, logs[h.id]?.[formatDateKey(today)])).length;

  // Per-habit best streaks
  const habitStreaks = habits
    .map(h => ({ habit: h, ...computeStreak(h, logs) }))
    .sort((a, b) => b.current - a.current);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt)
    : null;

  const initials = (user?.name ?? '?').split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/auth/login');
      }},
    ]);
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const html = buildExportHTML(user, habits, logs, moods);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Habit Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF saved', `File saved to:\n${uri}`);
      }
    } catch (e) {
      console.error('Export error:', e);
      Alert.alert('Export failed', 'Something went wrong generating the PDF.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarLg, { backgroundColor: user?.avatarColor ?? '#6C63FF' }]}>
            <Text style={styles.avatarLgText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {memberSince && (
            <Text style={styles.memberSince}>
              Member since {MONTH_NAMES[memberSince.getMonth()]} {memberSince.getFullYear()}
            </Text>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditOpen(true)}>
            <Text style={styles.editBtnText}>✎ Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Global stats */}
        <Text style={styles.sectionLabel}>YOUR STATS</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total Completions" value={totalCompletions} />
          <StatCard label="Best Streak" value={`🔥 ${bestStreak}`} sub="days" />
          <StatCard label="Active Streaks" value={activeStreaks} sub="habits" />
          <StatCard label="Days Tracked" value={daysSinceStart} sub="days" />
        </View>

        {/* Today */}
        <View style={styles.todayCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.todayLabel}>Today's Progress</Text>
            <Text style={styles.todayCount}>
              <Text style={styles.todayBig}>{todayDone}</Text>
              <Text style={styles.todaySub}>/{todayHabits.length} habits</Text>
            </Text>
          </View>
          <View style={[styles.todayRing, { borderColor: todayDone === todayHabits.length && todayHabits.length > 0 ? '#2DC653' : '#6C63FF' }]}>
            <Text style={[styles.todayPct, { color: todayDone === todayHabits.length && todayHabits.length > 0 ? '#2DC653' : '#6C63FF' }]}>
              {todayHabits.length > 0 ? Math.round((todayDone / todayHabits.length) * 100) : 0}%
            </Text>
          </View>
        </View>

        {/* Habit streaks */}
        {habitStreaks.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>HABIT STREAKS</Text>
            {habitStreaks.map(({ habit, current, best }) => (
              <View key={habit.id} style={styles.habitStreakRow}>
                <View style={[styles.habDot, { backgroundColor: habit.color }]} />
                <Text style={styles.habStreakName} numberOfLines={1}>{habit.name}</Text>
                <View style={styles.habStreakBadges}>
                  <View style={[styles.badge, { backgroundColor: habit.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: habit.color }]}>🔥 {current}</Text>
                  </View>
                  <Text style={styles.bestText}>best {best}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Account section */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.accountCard}>
          <View style={styles.accountRow}>
            <Text style={styles.accountKey}>Email</Text>
            <Text style={styles.accountVal}>{user?.email}</Text>
          </View>
          <View style={[styles.accountRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.accountKey}>Account type</Text>
            <Text style={styles.accountVal}>Local</Text>
          </View>
        </View>

        {/* Export */}
        <TouchableOpacity
          style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting
            ? <ActivityIndicator color="#6C63FF" />
            : <Text style={styles.exportText}>📄 Export Report (PDF)</Text>
          }
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>

      <EditProfileModal visible={editOpen} onClose={() => setEditOpen(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scroll: { paddingBottom: 100 },

  profileHeader: {
    alignItems: 'center', paddingTop: 24, paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarLg: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarLgText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  memberSince: { fontSize: 12, color: '#C7C7CC', marginBottom: 14 },
  editBtn: {
    borderWidth: 1, borderColor: '#6C63FF44', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7, backgroundColor: '#6C63FF11',
  },
  editBtnText: { fontSize: 13, color: '#6C63FF', fontWeight: '600' },

  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: '#8E8E93',
    letterSpacing: 0.8, marginHorizontal: 20, marginBottom: 10, marginTop: 8,
  },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: 20, gap: 10, marginBottom: 16,
  },
  statCard: {
    width: '47%', backgroundColor: '#1C1C1E', borderRadius: 16,
    padding: 16, borderWidth: 0.5, borderColor: '#3A3A3C', alignItems: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '500', textAlign: 'center' },
  statSub: { fontSize: 11, color: '#C7C7CC', marginTop: 2 },

  todayCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#1C1C1E', borderRadius: 16, padding: 20,
    borderWidth: 0.5, borderColor: '#3A3A3C',
  },
  todayLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginBottom: 4 },
  todayCount: {},
  todayBig: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  todaySub: { fontSize: 16, color: '#8E8E93' },
  todayRing: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  todayPct: { fontSize: 14, fontWeight: '700' },

  habitStreakRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#3A3A3C',
  },
  habDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10, flexShrink: 0 },
  habStreakName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  habStreakBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  bestText: { fontSize: 11, color: '#C7C7CC' },

  accountCard: {
    marginHorizontal: 20, backgroundColor: '#1C1C1E', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#3A3A3C', marginBottom: 16, overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#F2F2F7',
  },
  accountKey: { fontSize: 14, color: '#8E8E93' },
  accountVal: { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },

  exportBtn: {
    marginHorizontal: 20, marginBottom: 12, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    backgroundColor: '#6C63FF',
  },
  exportText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutBtn: {
    marginHorizontal: 20, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', backgroundColor: '#FF6B6B11',
    borderWidth: 0.5, borderColor: '#FF6B6B44',
  },
  logoutText: { color: '#FF3B30', fontWeight: '700', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#C7C7CC',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 20 },
  colorRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  colorDot: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: '#1C1C1E' },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 6, letterSpacing: 0.3 },
  input: {
    borderWidth: 0.5, borderColor: '#3A3A3C', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#FFFFFF', backgroundColor: '#111111', marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});