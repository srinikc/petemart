'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, UserRole } from '@/types';
import { apiService, setAuthToken, ApiRequestError } from '@/lib/api-client';

// ── Auth State Types ──────────────────────────────────────────────────────────
interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
}

export interface SignInResult {
  success: boolean;
  error?: string;
  role?: UserRole;
  isOtpSent?: boolean;
}

interface AuthContextType extends AuthState {
  /** Email + Password sign in */
  signInWithEmail: (email: string, password: string) => Promise<SignInResult>;
  /** Phone OTP sign in (sends OTP) */
  signInWithPhone: (phone: string) => Promise<SignInResult>;
  /** Combined sign-in: auto-detects email vs phone */
  signIn: (identifier: string, password?: string) => Promise<SignInResult>;
  /** Verify OTP after phone sign-in */
  verifyOtp: (phone: string, token: string) => Promise<SignInResult>;
  /** Sign up with email+password or phone */
  signUp: (data: {
    email?: string;
    phone?: string;
    password?: string;
    name: string;
    role?: UserRole;
  }) => Promise<SignInResult>;
  /** Logout */
  signOut: () => Promise<void>;
  /** Refresh current user session */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Demo users for POC ────────────────────────────────────────────────────────
const DEMO_USERS = [
  { phone: '9999999999', email: 'priya@example.com', password: 'password123', name: 'Priya Sharma', role: 'customer' as UserRole, id: 'cust-001' },
  { phone: '8888888888', email: 'ramesh@example.com', password: 'password123', name: 'Ramesh Kumar', role: 'merchant' as UserRole, id: 'merch-001' },
  { phone: '7777777777', email: 'ananya@petemart.com', password: 'admin123', name: 'Ananya Gupta', role: 'admin' as UserRole, id: 'admin-001' },
];

function findDemoUser(identifier: string): typeof DEMO_USERS[0] | undefined {
  // Check by email first
  let user = DEMO_USERS.find(u => u.email === identifier.toLowerCase());
  // Check by phone
  if (!user) user = DEMO_USERS.find(u => u.phone === identifier);
  return user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    role: null,
  });
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      // Try API route first
      try {
        const response = await apiService.auth.me();
        if (response.success && response.data) {
          const profile = response.data as any;
          const userProfile: UserProfile = {
            id: profile.id,
            phone: profile.phone || '',
            email: profile.email,
            name: profile.fullName || profile.name || '',
            role: profile.role || 'customer',
            avatar_url: profile.avatarUrl,
            created_at: profile.created_at || new Date().toISOString(),
          };
          setState({
            user: userProfile,
            loading: false,
            isAuthenticated: true,
            role: userProfile.role,
          });
          return;
        }
      } catch {
        // API not available, fall back to mock
      }

      // Fallback: check localStorage for mock user
      const stored = localStorage.getItem('petemart_user');
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        setState({
          user: profile,
          loading: false,
          isAuthenticated: true,
          role: profile.role,
        });
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Helper: set authenticated user in state and localStorage ────────────────
  const setAuthenticatedUser = useCallback((profile: UserProfile, token?: string) => {
    localStorage.setItem('petemart_user', JSON.stringify(profile));
    if (token) {
      setAuthToken(token);
      sessionStorage.setItem('petemart_api_token', token);
    }
    setState({
      user: profile,
      loading: false,
      isAuthenticated: true,
      role: profile.role,
    });
  }, []);

  // ── Sign In with Email + Password ───────────────────────────────────────────
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    try {
      // Try API route
      try {
        const response = await apiService.auth.login({ email, password });
        if (response.success && response.data) {
          const data = response.data as any;
          const profile: UserProfile = {
            id: data.user?.id || data.id || '',
            phone: data.user?.phone || '',
            email: data.user?.email || email,
            name: data.user?.name || data.user?.fullName || 'User',
            role: data.user?.role || data.role || 'customer',
            created_at: new Date().toISOString(),
          };
          const token = data.session?.accessToken || data.token;
          setAuthenticatedUser(profile, token);
          return { success: true, role: profile.role };
        }
      } catch (err) {
        // API not available, use mock
        if (err instanceof ApiRequestError) {
          return { success: false, error: err.message };
        }
      }

      // Mock fallback
      const demoUser = findDemoUser(email);
      if (!demoUser) {
        return { success: false, error: 'No account found with this email address' };
      }
      if (demoUser.password !== password) {
        return { success: false, error: 'Invalid password' };
      }

      const profile: UserProfile = {
        id: demoUser.id,
        phone: demoUser.phone,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        created_at: new Date().toISOString(),
      };
      setAuthenticatedUser(profile);
      return { success: true, role: profile.role };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  }, [setAuthenticatedUser]);

  // ── Sign In with Phone (OTP flow) ───────────────────────────────────────────
  const signInWithPhone = useCallback(async (phone: string): Promise<SignInResult> => {
    try {
      // Try API route
      try {
        const response = await apiService.auth.sendOtp(phone);
        if (response.success) {
          sessionStorage.setItem('petemart_phone', phone);
          return { success: true, isOtpSent: true };
        }
      } catch {
        // API not available, use mock
      }

      // Mock fallback
      const demoUser = findDemoUser(phone);
      if (!demoUser) {
        // Even for unknown numbers, allow OTP for self-registration
        sessionStorage.setItem('petemart_phone', phone);
        return { success: true, isOtpSent: true };
      }
      sessionStorage.setItem('petemart_phone', phone);
      return { success: true, isOtpSent: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send OTP' };
    }
  }, []);

  // ── Combined Sign In ─────────────────────────────────────────────────────────
  const signIn = useCallback(async (identifier: string, password?: string): Promise<SignInResult> => {
    if (password) {
      // If password provided, treat as email+password login
      return signInWithEmail(identifier, password);
    }
    // Otherwise treat as phone OTP login
    return signInWithPhone(identifier);
  }, [signInWithEmail, signInWithPhone]);

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const verifyOtpFn = useCallback(async (phone: string, token: string): Promise<SignInResult> => {
    try {
      // Try API route
      try {
        const response = await apiService.auth.verifyOtp(phone, token);
        if (response.success && response.data) {
          const data = response.data as any;
          const profile: UserProfile = {
            id: data.user?.id || data.id || '',
            phone: data.user?.phone || phone,
            email: data.user?.email || '',
            name: data.user?.name || data.user?.fullName || 'User',
            role: data.role || data.user?.role || 'customer',
            created_at: new Date().toISOString(),
          };
          const apiToken = data.token || data.session?.accessToken;
          setAuthenticatedUser(profile, apiToken);
          sessionStorage.removeItem('petemart_phone');
          return { success: true, role: profile.role };
        }
      } catch {
        // API not available, use mock
      }

      // Mock fallback
      const demoUser = findDemoUser(phone);
      if (!demoUser && token !== '123456') {
        return { success: false, error: 'Invalid OTP. Try 123456' };
      }
      if (demoUser && token !== '123456') {
        return { success: false, error: 'Invalid OTP. Try 123456' };
      }

      const profile: UserProfile = {
        id: demoUser?.id || `user-${Date.now()}`,
        phone,
        email: demoUser?.email || '',
        name: demoUser?.name || 'User',
        role: demoUser?.role || 'customer',
        created_at: new Date().toISOString(),
      };
      setAuthenticatedUser(profile);
      sessionStorage.removeItem('petemart_phone');
      return { success: true, role: profile.role };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Verification failed' };
    }
  }, [setAuthenticatedUser]);

  // ── Sign Up ─────────────────────────────────────────────────────────────────
  const signUp = useCallback(async (data: {
    email?: string;
    phone?: string;
    password?: string;
    name: string;
    role?: UserRole;
  }): Promise<SignInResult> => {
    try {
      // Try API route
      try {
        const response = await apiService.auth.signup({
          email: data.email,
          phone: data.phone,
          password: data.password || '',
          fullName: data.name,
          role: data.role || 'customer',
        });
        if (response.success && response.data) {
          const resData = response.data as any;
          const profile: UserProfile = {
            id: resData.id || resData.user?.id || '',
            phone: resData.phone || data.phone || '',
            email: resData.email || data.email || '',
            name: resData.name || data.name,
            role: resData.role || data.role || 'customer',
            created_at: new Date().toISOString(),
          };
          setAuthenticatedUser(profile);
          return { success: true, role: profile.role };
        }
      } catch (err) {
        if (err instanceof ApiRequestError) {
          return { success: false, error: err.message };
        }
      }

      // Mock fallback
      const profile: UserProfile = {
        id: `user-${Date.now()}`,
        phone: data.phone || '',
        email: data.email || '',
        name: data.name,
        role: data.role || 'customer',
        created_at: new Date().toISOString(),
      };
      setAuthenticatedUser(profile);
      return { success: true, role: profile.role };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Signup failed' };
    }
  }, [setAuthenticatedUser]);

  // ── Sign Out ────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      await apiService.auth.logout();
    } catch {
      // Ignore API error during logout
    }
    setAuthToken(null);
    localStorage.removeItem('petemart_user');
    sessionStorage.removeItem('petemart_phone');
    sessionStorage.removeItem('petemart_api_token');
    setState({ user: null, loading: false, isAuthenticated: false, role: null });
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signInWithEmail,
        signInWithPhone,
        verifyOtp: verifyOtpFn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
