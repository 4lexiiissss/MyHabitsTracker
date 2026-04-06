import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  createdAt: number;
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login:         (email: string, password: string) => Promise<{ error?: string }>;
  register:      (email: string, password: string, name: string, avatarColor: string) => Promise<{ error?: string }>;
  logout:        () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, 'name' | 'avatarColor'>>) => Promise<void>;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_CURRENT_USER = '@auth_current_user';
const KEY_ACCOUNTS     = '@auth_accounts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return String(Math.abs(hash));
}

async function getAccounts(): Promise<Record<string, { passwordHash: string; profile: UserProfile }>> {
  try {
    const raw = await AsyncStorage.getItem(KEY_ACCOUNTS);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveAccounts(accounts: Record<string, any>): Promise<void> {
  await AsyncStorage.setItem(KEY_ACCOUNTS, JSON.stringify(accounts));
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({}),
  register: async () => ({}),
  logout: async () => {},
  updateProfile: async () => {},
});

export function useAuth(): AuthContextValue {
  return React.useContext(AuthContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider(props: AuthProviderProps) {
  const [user, setUser]       = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    AsyncStorage.getItem(KEY_CURRENT_USER).then(raw => {
      if (raw) setUser(JSON.parse(raw));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password) return { error: 'Please fill in all fields' };
    const accounts = await getAccounts();
    const account = accounts[trimmed];
    if (!account) return { error: 'No account found with this email' };
    if (account.passwordHash !== simpleHash(password)) return { error: 'Incorrect password' };
    setUser(account.profile);
    await AsyncStorage.setItem(KEY_CURRENT_USER, JSON.stringify(account.profile));
    return {};
  }, []);

  const register = React.useCallback(async (
    email: string, password: string, name: string, avatarColor: string,
  ) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName  = name.trim();
    if (!trimmedEmail || !password || !trimmedName) return { error: 'Please fill in all fields' };
    if (password.length < 6) return { error: 'Password must be at least 6 characters' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return { error: 'Invalid email address' };
    const accounts = await getAccounts();
    if (accounts[trimmedEmail]) return { error: 'An account with this email already exists' };
    const profile: UserProfile = {
      id: 'u' + Date.now(),
      email: trimmedEmail,
      name: trimmedName,
      avatarColor,
      createdAt: Date.now(),
    };
    accounts[trimmedEmail] = { passwordHash: simpleHash(password), profile };
    await saveAccounts(accounts);
    setUser(profile);
    await AsyncStorage.setItem(KEY_CURRENT_USER, JSON.stringify(profile));
    return {};
  }, []);

  const logout = React.useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(KEY_CURRENT_USER);
  }, []);

  const updateProfile = React.useCallback(async (
    data: Partial<Pick<UserProfile, 'name' | 'avatarColor'>>,
  ) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    await AsyncStorage.setItem(KEY_CURRENT_USER, JSON.stringify(updated));
    const accounts = await getAccounts();
    if (accounts[user.email]) {
      accounts[user.email].profile = updated;
      await saveAccounts(accounts);
    }
  }, [user]);

  const value: AuthContextValue = {
    user, loading, login, register, logout, updateProfile,
  };

  return React.createElement(AuthContext.Provider, { value }, props.children);
}