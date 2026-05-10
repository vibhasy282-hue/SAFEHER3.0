'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { authAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') { setLoading(false); return; }

      const token = localStorage.getItem('token');
      const cachedUser = localStorage.getItem('user');

      // Restore from cache immediately so UI renders right away
      if (cachedUser) {
        try { setUser(JSON.parse(cachedUser)); } catch (_) {}
      }

      if (token) {
        try {
          // Race: verify token OR timeout after 4s
          const result = await Promise.race([
            authAPI.getMe(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 4000)
            ),
          ]);
          setUser((result as any).data.user);
          localStorage.setItem('user', JSON.stringify((result as any).data.user));
        } catch {
          // Keep cached user if backend is unreachable; clear only if no cache
          if (!cachedUser) {
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      }

      setLoading(false);
    };

    initAuth().catch(() => setLoading(false)); // Safety net
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    setUser(user);
  };

  const guestLogin = async () => {
    try {
      // Try backend first (3-second timeout)
      const result = await Promise.race([
        authAPI.guestLogin(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 3000)
        ),
      ]);
      const { token, user } = (result as any).data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch {
      // Offline/demo guest session — no backend required
      const guestUser = {
        id: 'guest-' + Date.now(),
        name: 'Guest User',
        email: 'guest@safeher.demo',
        role: 'guest',
        emergencyContacts: [],
        settings: { voiceDetection: true, locationTracking: true },
      };
      const guestToken = 'offline-guest-token';
      localStorage.setItem('token', guestToken);
      localStorage.setItem('user', JSON.stringify(guestUser));
      setUser(guestUser as any);
    }
  };

  const register = async (data: any) => {
    const res = await authAPI.register(data);
    const { token, user } = res.data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    setUser(user);
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    setUser(null);
  };

  const updateUser = (data: any) => {
    setUser((prev: User | null) => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, guestLogin, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
