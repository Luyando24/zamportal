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
  isStaff: boolean;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
  isAdmin: false,
  isSuperAdmin: false,
  isStaff: false,
  userId: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial session check from Supabase
    const initSession = async () => {
      try {
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        
        if (sbSession) {
          const user = sbSession.user;
          const newSession: AuthSession = {
            userId: user.id,
            role: (user.app_metadata.role as any) || 'user',
            portalSlug: (user.app_metadata.portal_slug as string),
            tokens: {
              accessToken: sbSession.access_token,
              refreshToken: sbSession.refresh_token,
              expiresInSec: sbSession.expires_in,
            },
          };
          setSession(newSession);
          localStorage.setItem('zamportal_session', JSON.stringify(newSession));
        } else {
          // Fallback to localStorage if no Supabase session (e.g. offline or keys missing)
          const savedSession = localStorage.getItem('zamportal_session');
          if (savedSession) {
            try {
              setSession(JSON.parse(savedSession));
            } catch (e) {
              localStorage.removeItem('zamportal_session');
            }
          }
        }
      } catch (error) {
        console.error("AuthProvider: Failed to initialize session", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 2. Listen for auth state changes (includes token refreshes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sbSession) => {
      console.log("AuthProvider: Auth event:", event);
      
      if (sbSession && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        const user = sbSession.user;
        setSession(prev => {
          // If we have a previous session, preserve role and portalSlug if they are missing in metadata
          const newSession: AuthSession = {
            userId: user.id,
            role: (user.app_metadata.role as any) || prev?.role || 'user',
            portalSlug: (user.app_metadata.portal_slug as string) || prev?.portalSlug,
            tokens: {
              accessToken: sbSession.access_token,
              refreshToken: sbSession.refresh_token,
              expiresInSec: sbSession.expires_in,
            },
          };
          localStorage.setItem('zamportal_session', JSON.stringify(newSession));
          return newSession;
        });
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        localStorage.removeItem('zamportal_session');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (newSession: AuthSession) => {
    console.log("AuthProvider: SignIn with custom session:", newSession);
    
    // Sync Supabase client state if tokens are provided
    if (newSession.tokens?.accessToken) {
      const { error } = await supabase.auth.setSession({
        access_token: newSession.tokens.accessToken,
        refresh_token: newSession.tokens.refreshToken || "",
      });
      
      if (error) {
        console.error("AuthProvider: Failed to sync Supabase session during signIn", error);
      }
    }
    
    setSession(newSession);
    localStorage.setItem('zamportal_session', JSON.stringify(newSession));
  };

  const signOut = async () => {
    setSession(null);
    localStorage.removeItem('zamportal_session');
    await supabase.auth.signOut();
  };

  const isAdmin = session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'institutional_admin';
  const isSuperAdmin = session?.role === 'super_admin';
  const isStaff = session?.role === 'staff' || session?.role === 'employee';
  const userId = session?.userId || null;

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut, isAdmin, isSuperAdmin, isStaff, userId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
