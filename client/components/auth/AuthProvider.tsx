import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthSession, UserRole } from '@shared/api';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
  isAdmin: false,
  isSuperAdmin: false,
  userId: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('zamportal_session');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (e) {
        localStorage.removeItem('zamportal_session');
      }
    }
    setLoading(false);
  }, []);

  const signIn = (newSession: AuthSession) => {
    console.log("AuthProvider: SignIn with session:", newSession);
    setSession(newSession);
    localStorage.setItem('zamportal_session', JSON.stringify(newSession));
  };

  const signOut = () => {
    setSession(null);
    localStorage.removeItem('zamportal_session');
    supabase.auth.signOut();
  };

  const isAdmin = session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'institutional_admin';
  const isSuperAdmin = session?.role === 'super_admin';
  const userId = session?.userId || null;

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut, isAdmin, isSuperAdmin, userId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
