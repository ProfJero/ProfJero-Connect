import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';
import { apiFetch, ApiError } from './api';

export type AdminRole = 'super_admin' | 'admin' | 'finance' | 'support' | 'viewer';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
}

interface AdminMeResponse {
  uid: string;
  email: string;
  displayName: string | null;
  role: AdminRole;
  status: 'active' | 'disabled';
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Firebase gives us a session. The role lives in Firestore's `admins` collection.
 * This hits our own /admin/me endpoint to fetch it and merges the two.
 */
async function buildAuthUser(fbUser: User): Promise<AuthUser> {
  const admin = await apiFetch<AdminMeResponse>('/admin/me');
  return {
    uid: admin.uid,
    email: admin.email,
    displayName: admin.displayName ?? fbUser.displayName ?? admin.email,
    role: admin.role,
  };
}

/** Turn cryptic Firebase error strings into something a human can read. */
function translateAuthError(err: unknown): Error {
  if (err instanceof ApiError) {
    if (err.status === 403) {
      return new Error('Your account is not authorized to use this app.');
    }
    return new Error(err.message);
  }
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
      return new Error('Incorrect email or password.');
    }
    if (msg.includes('user-not-found')) {
      return new Error('No account with that email.');
    }
    if (msg.includes('too-many-requests')) {
      return new Error('Too many attempts. Try again in a few minutes.');
    }
    if (msg.includes('user-disabled')) {
      return new Error('This account has been disabled.');
    }
    return err;
  }
  return new Error('Sign-in failed.');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Prevents onAuthStateChanged from racing login() — while login() is
  // in-flight, it owns the flow. onAuthStateChanged is the source of truth
  // for page reloads and sign-outs.
  const loginInProgress = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (loginInProgress.current) return;

      if (!fbUser) {
        setUser(null);
        setIsReady(true);
        return;
      }

      try {
        const authUser = await buildAuthUser(fbUser);
        setUser(authUser);
      } catch (err) {
        console.error('Failed to load admin record:', err);
        // Firebase has a session but no admin record — sign out so we don't
        // leave them half-authenticated.
        await fbSignOut(firebaseAuth).catch(() => {});
        setUser(null);
      } finally {
        setIsReady(true);
      }
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    loginInProgress.current = true;
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const authUser = await buildAuthUser(cred.user);
      setUser(authUser);
      setIsReady(true);
    } catch (err) {
      // If Firebase signed in but our /admin/me lookup failed, don't leave
      // a dangling session behind.
      if (firebaseAuth.currentUser) {
        await fbSignOut(firebaseAuth).catch(() => {});
      }
      throw translateAuthError(err);
    } finally {
      loginInProgress.current = false;
    }
  };

  const logout = async () => {
    await fbSignOut(firebaseAuth);
    setUser(null);
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