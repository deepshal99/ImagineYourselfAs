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

      // CRITICAL FIX: Restore guest state after sign-in
      if (session?.user && _event === 'SIGNED_IN') {
        const pendingData = localStorage.getItem('posterme_pending_generation');
        if (pendingData) {
          try {
            const { uploadedImage, personaId, timestamp } = JSON.parse(pendingData);

            // Check if data is recent (within 10 minutes)
            const isRecent = (Date.now() - timestamp) < 10 * 60 * 1000;

            if (isRecent && uploadedImage && personaId) {
              // Clear localStorage first
              localStorage.removeItem('posterme_pending_generation');

              // Dispatch custom event to ImageContext to restore state
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
      console.log("Initiating Google Sign-In...");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true // We will handle the redirect manually to ensure it works
        }
      });

      console.log("Supabase Auth Response:", { data, error });

      if (error) throw error;

      // If we get here, Supabase should have triggered a redirect.
      // If data.url exists, we can manually redirect if the SDK didn't.
      if (data?.url) {
        console.log("Manual redirecting to:", data.url);
        window.location.href = data.url;
      }

    } catch (error) {
      console.error("Error signing in with Google:", error);
      alert("Failed to sign in with Google. Please check console for details.");
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // Force clear local state even if network request fails
      setSession(null);
      setUser(null);
      localStorage.removeItem('posterme_uploaded_image');
      localStorage.removeItem('posterme_selected_persona_id');
      localStorage.removeItem('posterme_credits');
      localStorage.removeItem('posterme_is_unlimited');
      localStorage.removeItem('posterme_library'); // Optional: clear guest library if needed, but maybe keep it?
      // Keeping guest library might be good if they login again, but for security/privacy on logout usually clear.
      // Assuming we want to clear everything:
      // localStorage.clear(); // Too aggressive?
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

