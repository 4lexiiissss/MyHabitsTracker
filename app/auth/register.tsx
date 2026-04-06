import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const AVATAR_COLORS = [
  '#6C63FF','#FF6B6B','#48CAE4','#2DC653',
  '#F4A261','#E76F51','#B5179E','#4361EE',
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const initials = name.trim().split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

  const handleRegister = async () => {
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const result = await register(email, password, name, avatarColor);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace('/auth/login')} style={styles.backBtn}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSub}>Start tracking your habits today</Text>
          </View>

          {/* Avatar preview */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <Text style={styles.avatarHint}>Choose your color</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setAvatarColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, avatarColor === c && styles.colorDotActive]}>
                  {avatarColor === c && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#C7C7CC"
              value={name} onChangeText={setName} />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor="#C7C7CC"
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="Min. 6 characters" placeholderTextColor="#C7C7CC"
              value={password} onChangeText={setPassword} secureTextEntry />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={[styles.input, { marginBottom: 20 }]} placeholder="Repeat password"
              placeholderTextColor="#C7C7CC" value={confirm} onChangeText={setConfirm} secureTextEntry />

            <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Create Account</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111111' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  header: { paddingTop: 16, paddingBottom: 24 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#6C63FF', fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarInitials: { fontSize: 28, fontWeight: '700', color: '#fff' },
  avatarHint: { fontSize: 12, color: '#8E8E93', marginBottom: 10 },
  colorRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  colorDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#1C1C1E', transform: [{ scale: 1.15 }] },
  card: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 24, borderWidth: 0.5, borderColor: '#3A3A3C', marginBottom: 24 },
  errorBox: { backgroundColor: '#FF6B6B11', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 0.5, borderColor: '#FF6B6B44' },
  errorText: { fontSize: 13, color: '#FF3B30', fontWeight: '500' },
  label: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 6, letterSpacing: 0.3 },
  input: { borderWidth: 0.5, borderColor: '#3A3A3C', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#FFFFFF', backgroundColor: '#111111', marginBottom: 16 },
  primaryBtn: { backgroundColor: '#6C63FF', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: '#8E8E93' },
  footerLink: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },
});