import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export interface CustomerUser {
  uid: string;
  email: string;
  displayName: string;
  companyName: string;
}

interface AuthContextValue {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  signUp: (params: {
    email: string;
    password: string;
    displayName: string;
    companyName: string;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'profjeroconnect.auth.user';

const AuthContext = createContext<AuthContextValue | null>(null);

// ⚠️ STUB AUTH — replace with Firebase Auth in CP1.
// Public interface stays the same so page code doesn't change.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setIsReady(true);
  }, []);

  const persist = (u: CustomerUser) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const signUp: AuthContextValue['signUp'] = async ({
    email,
    password,
    displayName,
    companyName,
  }) => {
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (!displayName.trim()) throw new Error('Please enter your name.');
    if (!companyName.trim()) throw new Error('Please enter your company or organisation name.');

    await new Promise((r) => setTimeout(r, 700));

    persist({
      uid: 'stub_' + email.replace(/[^a-z0-9]/gi, '').toLowerCase(),
      email,
      displayName: displayName.trim(),
      companyName: companyName.trim(),
    });
  };

  const login = async (email: string, password: string) => {
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');

    await new Promise((r) => setTimeout(r, 600));

    persist({
      uid: 'stub_' + email.replace(/[^a-z0-9]/gi, '').toLowerCase(),
      email,
      displayName: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      companyName: 'My Organisation',
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isReady, signUp, login, logout }}
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