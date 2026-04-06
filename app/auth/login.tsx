import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo / Header */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🌱</Text>
            </View>
            <Text style={styles.appName}>HabitFlow</Text>
            <Text style={styles.tagline}>Build habits that stick</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to continue</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#C7C7CC"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#C7C7CC"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Sign In</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/register')}>
              <Text style={styles.footerLink}>Create one</Text>
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

  logoArea: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#6C63FF22', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#8E8E93', marginTop: 4 },

  card: {
    backgroundColor: '#1C1C1E', borderRadius: 20,
    padding: 24, borderWidth: 0.5, borderColor: '#3A3A3C',
    marginBottom: 24,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#8E8E93', marginBottom: 20 },

  errorBox: {
    backgroundColor: '#FF6B6B11', borderRadius: 10,
    padding: 12, marginBottom: 16, borderWidth: 0.5, borderColor: '#FF6B6B44',
  },
  errorText: { fontSize: 13, color: '#FF3B30', fontWeight: '500' },

  label: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 6, letterSpacing: 0.3 },
  input: {
    borderWidth: 0.5, borderColor: '#3A3A3C', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#FFFFFF', backgroundColor: '#111111',
    marginBottom: 16,
  },

  primaryBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: '#8E8E93' },
  footerLink: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },
});