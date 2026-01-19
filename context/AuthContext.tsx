import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// @ts-ignore
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// @ts-ignore
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// @ts-ignore
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // @ts-ignore
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Restore guest state after sign-in
      if (session?.user && _event === 'SIGNED_IN') {
        const pendingData = localStorage.getItem('posterme_pending_generation');
        if (pendingData) {
          try {
            const { uploadedImage, personaId, timestamp } = JSON.parse(pendingData);
            const isRecent = (Date.now() - timestamp) < 10 * 60 * 1000;

            if (isRecent && uploadedImage && personaId) {
              localStorage.removeItem('posterme_pending_generation');
              window.dispatchEvent(new CustomEvent('restore-generation-state', {
                detail: { uploadedImage, personaId }
              }));
            } else {
              localStorage.removeItem('posterme_pending_generation');
            }
          } catch (e) {
            console.error("Failed to restore generation state:", e);
            localStorage.removeItem('posterme_pending_generation');
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
          skipBrowserRedirect: true
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      alert("Failed to sign in with Google. Please try again.");
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSession(null);
      setUser(null);
      localStorage.removeItem('posterme_uploaded_image');
      localStorage.removeItem('posterme_selected_persona_id');
      localStorage.removeItem('posterme_credits');
      localStorage.removeItem('posterme_is_unlimited');
      localStorage.removeItem('posterme_library');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
