'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient, UserProfile, UserRole } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
}

interface AuthContextType extends AuthState {
  signIn: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for development
const MOCK_USERS: Record<string, { profile: UserProfile; otp: string }> = {
  '9999999999': {
    otp: '123456',
    profile: {
      id: 'cust-001',
      phone: '9999999999',
      name: 'Priya Sharma',
      role: 'customer',
      created_at: '2026-05-01T00:00:00Z',
    },
  },
  '8888888888': {
    otp: '123456',
    profile: {
      id: 'merch-001',
      phone: '8888888888',
      name: 'Ramesh Kumar',
      role: 'merchant',
      created_at: '2026-05-01T00:00:00Z',
    },
  },
  '7777777777': {
    otp: '123456',
    profile: {
      id: 'admin-001',
      phone: '7777777777',
      name: 'Ananya Gupta',
      role: 'admin',
      created_at: '2026-05-01T00:00:00Z',
    },
  },
};

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
      // In production, this would call Supabase
      // const supabase = createClient();
      // const { data: { user } } = await supabase.auth.getUser();

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

  const signIn = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // In production: const { error } = await supabase.auth.signInWithOtp({ phone });
      const mockUser = MOCK_USERS[phone];
      if (!mockUser) {
        return { success: false, error: 'Phone number not registered. Please use a demo number: 9999999999 (Customer), 8888888888 (Merchant), 7777777777 (Admin). OTP: 123456' };
      }
      // Store phone for OTP verification
      sessionStorage.setItem('petemart_phone', phone);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send OTP' };
    }
  };

  const verifyOtp = async (phone: string, token: string): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    try {
      // In production: const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      const mockUser = MOCK_USERS[phone];
      if (!mockUser || mockUser.otp !== token) {
        return { success: false, error: 'Invalid OTP. Try 123456' };
      }

      const profile = mockUser.profile;
      localStorage.setItem('petemart_user', JSON.stringify(profile));
      sessionStorage.removeItem('petemart_phone');

      setState({
        user: profile,
        loading: false,
        isAuthenticated: true,
        role: profile.role,
      });

      return { success: true, role: profile.role };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Verification failed' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('petemart_user');
    setState({ user: null, loading: false, isAuthenticated: false, role: null });
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, verifyOtp, signOut, refreshUser }}>
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
