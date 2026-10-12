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
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import { isDisposableEmail } from '@profjero/shared/email-check';
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
  /**
   * Signed in with a password but the email isn't confirmed yet: no
   * account is created until it is. ProtectedRoute sends them to /verify-email.
   */
  needsVerification: boolean;
  /** Email of the signed-in Firebase user (also while unverified / in setup). */
  firebaseEmail: string | null;
  /** Name from Google (prefills Complete setup). */
  firebaseDisplayName: string | null;
  /** Password sign-up: creates the login and emails a confirmation link. */
  signUp: (params: {
    email: string;
    password: string;
    displayName: string;
    companyName: string;
    /** Required. Backend rejects registration without it. */
    acceptedTerms: boolean;
  }) => Promise<void>;
  /** `remember` = stay signed in after the browser closes (default true). */
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  /** Email a password-reset link. Resolves even for unknown emails. */
  resetPassword: (email: string) => Promise<void>;
  /** Re-authenticate with the current password, then set a new one. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Force a refetch of the customer profile from /customer/me. */
  refresh: () => Promise<void>;
  /** Passwordless: email a link that signs in (and verifies) in one click. */
  sendEmailLink: (email: string, signup?: { displayName: string; companyName: string; acceptedTerms: boolean }) => Promise<void>;
  /** Finish an email-link sign-in on /auth/link. `email` when opened on another device. */
  completeEmailLink: (email?: string) => Promise<'ok' | 'needs_setup' | 'needs_email'>;
  /** Google sign-in / sign-up (Google has verified the email). */
  signInWithGoogle: () => Promise<void>;
  /** Resend the confirmation email (password sign-ups). */
  resendVerification: () => Promise<void>;
  /** Re-check whether the email was confirmed; registers the account when it has. */
  checkVerification: () => Promise<boolean>;
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
const EMAIL_FOR_LINK_KEY = 'pjc.emailForSignIn';
const PENDING_SIGNUP_KEY = 'pjc.pendingSignup';

interface PendingSignup {
  email: string;
  displayName: string;
  companyName: string;
}

function store(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    /* private mode */
  }
}
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function pendingSignupFor(email: string | null | undefined): PendingSignup | null {
  try {
    const p = JSON.parse(read(PENDING_SIGNUP_KEY) ?? 'null') as PendingSignup | null;
    return p && email && p.email.toLowerCase() === email.toLowerCase() ? p : null;
  } catch {
    return null;
  }
}
const appUrl = (path: string) => `${window.location.origin}${path}`;

function assertUsableEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Please enter a valid email address.');
  if (isDisposableEmail(email)) throw new Error('Temporary email addresses can’t be used. Please use your work or personal email.');
}

function toCustomerUser(fbUser: FirebaseUser, me: MeResponse): CustomerUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? me.customer.email,
    displayName: me.customer.displayName,
    companyName: me.customer.organisationName ?? me.project.name,
  };
}

/** Firebase error codes → messages a customer can act on. */
function friendlyAuthError(err: unknown, fallback: string): string {
  const code = (err as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/weak-password':
      return 'Choose a stronger password (at least 8 characters).';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead.';
    case 'auth/requires-recent-login':
      return 'For your security, sign out and sign in again, then retry.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The Google window was closed before signing in.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google window. Allow pop-ups for this site and try again.';
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'This link has expired or was already used. Request a new one.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email. Sign in with your email instead.';
    default:
      return fallback;
  }
}

// ── Provider ─────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [fbInfo, setFbInfo] = useState<{ email: string | null; name: string | null }>({ email: null, name: null });
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
          setNeedsVerification(false);
          setFbInfo({ email: null, name: null });
        }
        return { kind: 'signed_out' };
      }
      if (mountedRef.current) setFbInfo({ email: fbUser.email, name: fbUser.displayName });

      try {
        const me = await api.get<MeResponse>('/customer/me');
        if (!mountedRef.current) return { kind: 'failed' };
        const next = toCustomerUser(fbUser, me);
        setUser(next);
        setNeedsSetup(false);
        setNeedsVerification(false);
        return { kind: 'ok', user: next };
      } catch (err) {
        if (!mountedRef.current) return { kind: 'failed' };
        if (
          err instanceof ApiError &&
          (err.code === 'incomplete_registration' ||
            err.code === 'not_a_customer')
        ) {
          // Authenticated but no customer doc. Unconfirmed emails must
          // confirm first; confirmed ones finish setup (or, with a
          // pending sign-up form saved on this device, register now).
          setUser(null);
          if (!fbUser.emailVerified) {
            setNeedsVerification(true);
            setNeedsSetup(false);
            return { kind: 'needs_setup' };
          }
          setNeedsVerification(false);
          const pending = pendingSignupFor(fbUser.email);
          if (pending) {
            try {
              await registerCustomer(fbUser, pending);
              const me = await api.get<MeResponse>('/customer/me');
              const next = toCustomerUser(fbUser, me);
              setUser(next);
              setNeedsSetup(false);
              return { kind: 'ok', user: next };
            } catch {
              /* fall through to the setup form */
            }
          }
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

    assertUsableEmail(email);

    // 1. Create the login (also signs them in). No account or free units
    //    until the email is confirmed.
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (err) {
      throw new Error(friendlyAuthError(err, 'Could not create your account. Please try again.'), { cause: err });
    }
    store(PENDING_SIGNUP_KEY, { email: email.trim(), displayName: displayName.trim(), companyName: companyName.trim() });

    // 2. Email the confirmation link; its "continue" button returns here.
    try {
      await sendEmailVerification(cred.user, { url: appUrl('/verify-email') });
    } catch (err) {
      console.warn('sendEmailVerification failed:', err);
    }
    if (mountedRef.current) {
      setNeedsVerification(true);
      setFbInfo({ email: cred.user.email, name: null });
    }
  };

  /** Create the customer doc + wallet, then refresh the token for the customer claim. */
  async function registerCustomer(fbUser: FirebaseUser, p: { displayName: string; companyName: string; phone?: string }) {
    await fbUser.getIdToken(true); // carries email_verified=true now
    await api.post<RegisterResponse>('/customer/register', {
      displayName: p.displayName,
      organisationName: p.companyName,
      phone: p.phone || undefined,
      acceptedTerms: true,
    });
    store(PENDING_SIGNUP_KEY, null);
    await fbUser.getIdToken(true);
  }

  const sendEmailLink: AuthContextValue['sendEmailLink'] = async (email, signup) => {
    assertUsableEmail(email);
    if (signup) {
      if (!signup.displayName.trim()) throw new Error('Please enter your name.');
      if (!signup.companyName.trim()) throw new Error('Please enter your company or organisation name.');
      if (!signup.acceptedTerms) throw new Error('Please accept the Terms of Service and Privacy Policy.');
      store(PENDING_SIGNUP_KEY, { email: email.trim(), displayName: signup.displayName.trim(), companyName: signup.companyName.trim() });
    }
    try {
      await sendSignInLinkToEmail(firebaseAuth, email.trim(), { url: appUrl('/auth/link'), handleCodeInApp: true });
    } catch (err) {
      throw new Error(friendlyAuthError(err, 'Could not send the link. Please try again.'), { cause: err });
    }
    store(EMAIL_FOR_LINK_KEY, email.trim());
  };

  const completeEmailLink: AuthContextValue['completeEmailLink'] = async (typedEmail) => {
    const href = window.location.href;
    if (!isSignInWithEmailLink(firebaseAuth, href)) throw new Error('This sign-in link is not valid. Request a new one.');
    const email = typedEmail?.trim() || read(EMAIL_FOR_LINK_KEY);
    if (!email) return 'needs_email';
    let cred;
    try {
      await setPersistence(firebaseAuth, browserLocalPersistence);
      cred = await signInWithEmailLink(firebaseAuth, email, href);
    } catch (err) {
      throw new Error(friendlyAuthError(err, 'Could not sign you in with this link. Request a new one.'), { cause: err });
    }
    store(EMAIL_FOR_LINK_KEY, null);
    const result = await loadCustomer(cred.user);
    if (result.kind === 'ok') return 'ok';
    if (result.kind === 'needs_setup') return 'needs_setup';
    throw new Error('Signed in, but could not load your account. Please try again.');
  };

  const signInWithGoogle: AuthContextValue['signInWithGoogle'] = async () => {
    try {
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const cred = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      if (cred.user.email && isDisposableEmail(cred.user.email)) {
        await firebaseSignOut(firebaseAuth);
        throw new Error('Temporary email addresses can’t be used.');
      }
      const result = await loadCustomer(cred.user);
      if (result.kind === 'failed') throw new Error('Signed in, but could not load your account. Please try again.');
    } catch (err) {
      if (err instanceof Error && !(err as { code?: string }).code) throw err;
      throw new Error(friendlyAuthError(err, 'Google sign-in failed. Please try again.'), { cause: err });
    }
  };

  const resendVerification = async () => {
    const fbUser = firebaseAuth.currentUser;
    if (!fbUser) throw new Error('You are not signed in.');
    try {
      await sendEmailVerification(fbUser, { url: appUrl('/verify-email') });
    } catch (err) {
      throw new Error(friendlyAuthError(err, 'Could not resend the email. Please try again shortly.'), { cause: err });
    }
  };

  const checkVerification = async () => {
    const fbUser = firebaseAuth.currentUser;
    if (!fbUser) return false;
    await reload(fbUser);
    if (!fbUser.emailVerified) return false;
    await fbUser.getIdToken(true);
    await loadCustomer(fbUser);
    return true;
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

    await registerCustomer(fbUser, { displayName: displayName.trim(), companyName: companyName.trim(), phone: phone?.trim() });
    await loadCustomer(fbUser);
  };

  const login = async (email: string, password: string, remember = true) => {
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');

    await setPersistence(
      firebaseAuth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
    let cred;
    try {
      cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (err) {
      throw new Error(friendlyAuthError(err, 'Sign in failed. Please try again.'), { cause: err });
    }
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

  const resetPassword = async (email: string) => {
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
    } catch (err) {
      // Don't reveal whether an account exists for this email.
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found') return;
      throw new Error(friendlyAuthError(err, 'Could not send the reset email. Please try again.'), { cause: err });
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const fbUser = firebaseAuth.currentUser;
    if (!fbUser?.email) throw new Error('You are not signed in.');
    if (newPassword.length < 8) throw new Error('New password must be at least 8 characters.');
    try {
      await reauthenticateWithCredential(
        fbUser,
        EmailAuthProvider.credential(fbUser.email, currentPassword),
      );
      await updatePassword(fbUser, newPassword);
    } catch (err) {
      throw new Error(friendlyAuthError(err, 'Could not change your password. Please try again.'), { cause: err });
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
        needsVerification,
        firebaseEmail: fbInfo.email,
        firebaseDisplayName: fbInfo.name,
        sendEmailLink,
        completeEmailLink,
        signInWithGoogle,
        resendVerification,
        checkVerification,
        signUp,
        login,
        logout,
        resetPassword,
        changePassword,
        refresh,
        completeSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}