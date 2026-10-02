import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth } from './firebase';
import { api, ApiError } from './api';

// ── Public interface (compatible with the previous stub) ─────────────

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
  /**
   * True when a Firebase user is signed in but the backend has no
   * customer doc for them. ProtectedRoute sends them to /complete-setup.
   */
  needsSetup: boolean;
  signUp: (params: {
    email: string;
    password: string;
    displayName: string;
    companyName: string;
    /** Required. Backend rejects registration without it. */
    acceptedTerms: boolean;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Force a refetch of the customer profile from /customer/me. */
  refresh: () => Promise<void>;
  /**
   * Used by CompleteSetupPage: creates the customer doc for an already
   * authenticated Firebase user whose registration previously failed.
   */
  completeSetup: (params: {
    displayName: string;
    companyName: string;
    phone?: string;
    acceptedTerms: boolean;
  }) => Promise<void>;
}

// ── Backend response shapes ──────────────────────────────────────────

interface MeResponse {
  customer: {
    uid: string;
    email: string;
    displayName: string;
    organisationName: string | null;
    projectId: string;
    status: 'active' | 'suspended';
  };
  project: {
    id: string;
    name: string;
    origin: 'admin' | 'customer';
  };
}

interface RegisterResponse {
  customer: MeResponse['customer'];
  project: MeResponse['project'];
  wallet: { availableUnits: number; reservedUnits: number; totalUnits: number };
  starterUnitsGranted: number;
  isNew: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const LEGACY_STORAGE_KEY = 'profjeroconnect.auth.user';

function toCustomerUser(fbUser: FirebaseUser, me: MeResponse): CustomerUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? me.customer.email,
    displayName: me.customer.displayName,
    companyName: me.customer.organisationName ?? me.project.name,
  };
}

// ── Provider ─────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // One-time cleanup: remove the localStorage entry the old stub wrote.
  // Users who signed in against the stub need to sign in again against
  // real Firebase. Their localStorage data is stale and misleading.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  type LoadResult =
    | { kind: 'ok'; user: CustomerUser }
    | { kind: 'needs_setup' }
    | { kind: 'signed_out' }
    | { kind: 'failed' };

  const loadCustomer = useCallback(
    async (fbUser: FirebaseUser | null): Promise<LoadResult> => {
      if (!fbUser) {
        if (mountedRef.current) {
          setUser(null);
          setNeedsSetup(false);
        }
        return { kind: 'signed_out' };
      }

      try {
        const me = await api.get<MeResponse>('/customer/me');
        if (!mountedRef.current) return { kind: 'failed' };
        const next = toCustomerUser(fbUser, me);
        setUser(next);
        setNeedsSetup(false);
        return { kind: 'ok', user: next };
      } catch (err) {
        if (!mountedRef.current) return { kind: 'failed' };
        if (
          err instanceof ApiError &&
          (err.code === 'incomplete_registration' ||
            err.code === 'not_a_customer')
        ) {
          // Authenticated but no customer doc — needs setup.
          setUser(null);
          setNeedsSetup(true);
          return { kind: 'needs_setup' };
        }
        // Network or server error.
        setUser(null);
        setNeedsSetup(false);
        return { kind: 'failed' };
      }
    },
    [],
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      await loadCustomer(fbUser);
      if (mountedRef.current) setIsReady(true);
    });
    return unsub;
  }, [loadCustomer]);

  const signUp: AuthContextValue['signUp'] = async ({
    email,
    password,
    displayName,
    companyName,
    acceptedTerms,
  }) => {
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (!displayName.trim()) throw new Error('Please enter your name.');
    if (!companyName.trim())
      throw new Error('Please enter your company or organisation name.');
    if (!acceptedTerms)
      throw new Error('Please accept the Terms of Service and Privacy Policy.');

    // 1. Create the Firebase Auth user (also signs them in).
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const fbUser = cred.user;

    // 2. Fire-and-forget email verification. Do not block signup on this.
    sendEmailVerification(fbUser).catch((err) =>
      console.warn('sendEmailVerification failed:', err),
    );

    // 3. Register with the backend. If this fails, the Firebase user
    //    exists but no customer doc does. Leave them signed in —
    //    ProtectedRoute will route them to /complete-setup.
    try {
      await api.post<RegisterResponse>('/customer/register', {
        displayName: displayName.trim(),
        organisationName: companyName.trim(),
        acceptedTerms: true,
      });

      // 4. Force-refresh the token so it carries the customer:true claim.
      //    Without this, the next /customer/me request uses a stale token
      //    that predates setCustomUserClaims and returns not_a_customer.
      await fbUser.getIdToken(true);

      // 5. Populate user state from /customer/me.
      await loadCustomer(fbUser);
    } catch (err) {
      if (mountedRef.current) setNeedsSetup(true);
      throw err;
    }
  };

  const completeSetup: AuthContextValue['completeSetup'] = async ({
    displayName,
    companyName,
    phone,
    acceptedTerms,
  }) => {
    if (!displayName.trim()) throw new Error('Please enter your name.');
    if (!companyName.trim())
      throw new Error('Please enter your company or organisation name.');
    if (!acceptedTerms)
      throw new Error('Please accept the Terms of Service and Privacy Policy.');

    const fbUser = firebaseAuth.currentUser;
    if (!fbUser) throw new Error('You are not signed in.');

    await api.post<RegisterResponse>('/customer/register', {
      displayName: displayName.trim(),
      organisationName: companyName.trim(),
      phone: phone?.trim() || undefined,
      acceptedTerms: true,
    });

    await fbUser.getIdToken(true);
    await loadCustomer(fbUser);
  };

    const login = async (email: string, password: string) => {
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');

    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    // Wait for the profile fetch so `user` state is set before LoginForm
    // returns control. Without this, LoginPage's effect navigates while
    // isAuthenticated is still false, and ProtectedRoute bounces back
    // to /login for a beat — the visible blink.
    const result = await loadCustomer(cred.user);

    // 'ok' and 'needs_setup' are both handled by LoginPage's effect.
    // Only a hard failure needs to surface as an error here.
    if (result.kind === 'failed') {
      throw new Error(
        'Signed in, but could not load your account. Please try again.',
      );
    }
  };

  const logout = async () => {
    await firebaseSignOut(firebaseAuth);
    // onAuthStateChanged fires with null and resets state.
  };

  const refresh = useCallback(async () => {
    await loadCustomer(firebaseAuth.currentUser);
  }, [loadCustomer]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isReady,
        needsSetup,
        signUp,
        login,
        logout,
        refresh,
        completeSetup,
      }}
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