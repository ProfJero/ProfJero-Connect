import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type AdminRole = 'super_admin' | 'admin' | 'finance' | 'support' | 'viewer';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'profjero.auth.user';

const AuthContext = createContext<AuthContextValue | null>(null);

// ⚠️ STUB AUTH — replace with Firebase Auth in the auth milestone.
// The public interface (useAuth) stays the same, so no page code changes
// when real auth lands. See docs/state.md §7 and §10.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setIsReady(true);
  }, []);

  const login = async (email: string, password: string) => {
    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Simulate a network round-trip so the loading state is visible.
    await new Promise((resolve) => setTimeout(resolve, 600));

    const stubUser: AuthUser = {
      uid: 'stub_' + email.replace(/[^a-z0-9]/gi, '').toLowerCase(),
      email,
      displayName: email
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      role: 'super_admin',
    };

    setUser(stubUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stubUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isReady, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}