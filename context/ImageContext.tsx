import React, { createContext, useContext, useState, useEffect } from 'react';
import { ImageContextType, Persona, SavedCreation } from '../types.ts';
import { PERSONAS } from '../constants.ts';
import { useAuth } from './AuthContext.tsx';
import { supabase } from '../lib/supabase.ts';

import { toast } from 'sonner';

// @ts-ignore
const ImageContext = createContext<ImageContextType | undefined>(undefined);

export const ImageContextProvider = ({ children }: { children: any }) => {
  const { user } = useAuth();
  
  // Initialize state from localStorage if available
  // @ts-ignore
  const [uploadedImage, setUploadedImage] = useState<string | null>(() => {
    return localStorage.getItem('posterme_uploaded_image');
  });
  
  // @ts-ignore
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(() => {
    const savedId = localStorage.getItem('posterme_selected_persona_id');
    return savedId ? PERSONAS.find((p: Persona) => p.id === savedId) || null : null;
  });

  // @ts-ignore
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // @ts-ignore
  const [library, setLibrary] = useState<SavedCreation[]>([]);
  // @ts-ignore
  const [credits, setCredits] = useState<number>(0);
  // @ts-ignore
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);

  // Fetch credits
  const fetchCredits = async () => {
    if (!user) {
        setCredits(0);
        setIsUnlimited(false);
        return;
    }
    
    // Attempt lazy daily claim on load
    try {
        await supabase.rpc('claim_daily_credit');
    } catch (_e) {
        // Ignore error, just proceed to fetch
    }

    try {
        const { data, error } = await supabase
            .from('user_credits')
            .select('credits, is_unlimited')
            .eq('user_id', user.id)
            .single();

        if (data) {
            setCredits(data.credits);
            setIsUnlimited(data.is_unlimited || false);
        } else if (error && error.code === 'PGRST116') {
            setCredits(0);
            setIsUnlimited(false);
        }
    } catch (e) {
        console.error("Failed to fetch credits", e);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  const checkCredits = async (): Promise<boolean> => {
      if (!user) return false;
      await fetchCredits();
      
      // Attempt to claim daily credit first (lazy evaluation)
      try {
          const { data } = await supabase.rpc('claim_daily_credit');
          if (data === true) {
              await fetchCredits(); // Refresh if we just got a credit
              return true; // We definitely have credit now
          }
      } catch (e) {
          console.error("Failed to check daily claim", e);
      }

      const { data } = await supabase
        .from('user_credits')
        .select('credits, is_unlimited')
        .eq('user_id', user.id)
        .single();
      
      if (data?.is_unlimited) return true;
      return (data?.credits || 0) > 0;
  };

  const deductCredit = async () => {
      if (!user) return;
      try {
          // Check if unlimited locally before modifying UI
          if (isUnlimited) return;

          // Optimistic UI update
          setCredits((prev: number) => Math.max(0, prev - 1));

          const { data, error } = await supabase.rpc('consume_credit');
          
          if (error) throw error;
          
          if (data === false) {
              fetchCredits();
              throw new Error("Insufficient credits");
          }
      } catch (e) {
          console.error("Failed to deduct credit", e);
          fetchCredits();
      }
  };

  
  const buyCredits = async () => {
      // Temporarily disabled
      toast.info("Credit purchases are currently paused. Please check back later!");
      return;
      /*
      if (!user) {
          toast.error("Please sign in to buy credits");
          return;
      }
      
      const toastId = toast.loading("Initiating Instamojo payment...");

      try {
          const { data, error } = await supabase.functions.invoke('payment-handler', {
              body: { 
                  action: 'create_order',
                  redirectUrl: window.location.href // Return to current page
              }
          });
          
          if (error) throw error;
          if (!data.url) throw new Error("No payment URL received");

          // Redirect to Instamojo
          window.location.href = data.url;
          
      } catch (error: any) {
          // Try to parse the internal error from the Edge Function if available
          if (error && typeof error === 'object' && 'context' in error) {
             try {
                // @ts-ignore
                const errorContext = await error.context.json();
                console.error("Payment Edge Function Error:", errorContext);
                if (errorContext.error) {
                    toast.error(`Payment Failed: ${errorContext.error}`, { id: toastId });
                    return;
                }
             } catch (e) {
                console.error("Failed to parse payment error context", e);
             }
          }
          
          console.error("Buy credits failed", error);
          toast.error(error.message || "Failed to initiate payment", { id: toastId });
      }
      */
  };

  // Check for Payment Return
  useEffect(() => {
      const checkPayment = async () => {
          const query = new URLSearchParams(window.location.search);
          const paymentId = query.get('payment_id');
          const paymentRequestId = query.get('payment_request_id');
          
          if (paymentId && paymentRequestId && user) {
              // Clear the URL immediately so we don't loop
              window.history.replaceState({}, document.title, window.location.pathname);
              
              const toastId = toast.loading("Verifying payment...");
              
              try {
                  const { data, error } = await supabase.functions.invoke('payment-handler', {
                      body: {
                          action: 'verify_payment',
                          payment_id: paymentId,
                          payment_request_id: paymentRequestId
                      }
                  });

                  if (error) throw error;

                  if (data.success) {
                      toast.success("Payment successful! 5 credits added.", { id: toastId });
                      fetchCredits();
                  } else {
                      toast.error(data.message || "Payment failed or pending.", { id: toastId });
                  }
              } catch (e: any) {
                  console.error("Payment verification error", e);
                  toast.error("Failed to verify payment.", { id: toastId });
              }
          }
      };

      checkPayment();
  }, [user]); // Run when user is loaded

  // Persist uploadedImage changes
  useEffect(() => {
    if (uploadedImage) {
        try {
            localStorage.setItem('posterme_uploaded_image', uploadedImage);
        } catch (e) {
            console.error("Failed to save image to local storage (likely too big)", e);
        }
    } else {
        localStorage.removeItem('posterme_uploaded_image');
    }
  }, [uploadedImage]);

  // Persist selectedPersona changes
  useEffect(() => {
    if (selectedPersona) {
        localStorage.setItem('posterme_selected_persona_id', selectedPersona.id);
    } else {
        localStorage.removeItem('posterme_selected_persona_id');
    }
  }, [selectedPersona]);
  
  // State to hold ALL personas (Static + AI Discovered)
  const [personas, setPersonas] = useState<Persona[]>(PERSONAS);

  // Helper to sync local library to state
  const loadLocalLibrary = () => {
    const stored = localStorage.getItem('posterme_library');
    if (stored) {
      try {
        setLibrary(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    } else {
        setLibrary([]);
    }
  };

  // Helper to sync Supabase library to state
  const loadSupabaseLibrary = async () => {
    if (!user) return;
    try {
        const { data, error } = await supabase
            .from('creations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
            const mapped: SavedCreation[] = data.map((item: any) => ({
                id: item.id,
                personaId: item.persona_id,
                imageUrl: item.image_url,
                timestamp: new Date(item.created_at).getTime()
            }));
            setLibrary(mapped);
        }
    } catch (error) {
        console.error("Error loading library from Supabase:", error);
    }
  };

  // Helper to load dynamic personas
  const loadDiscoveredPersonas = async () => {
      try {
          const { data, error } = await supabase
            .from('discovered_personas')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
             // Handle error if needed, but logging might be enough
             // console.error("Error loading personas", error);
             return; 
          }

          if (data) {
              const dynamicPersonas: Persona[] = data.map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  category: p.category as any, // Cast to PersonaCategory
                  cover: p.cover,
                  prompt: p.prompt
              }));
              
              // Merge with static personas, avoiding duplicates if any
              setPersonas((prev: Persona[]) => {
                  const existingIds = new Set(prev.map((p: any) => p.id));
                  const uniqueNew = dynamicPersonas.filter((p: any) => !existingIds.has(p.id));
                  return [...prev, ...uniqueNew];
              });
          }
      } catch (e) {
          console.error("Failed to load discovered personas", e);
      }
  };

  // Effect to load library based on auth state
  useEffect(() => {
    if (user) {
        loadSupabaseLibrary();
    } else {
        loadLocalLibrary();
    }
    // Always load discovered personas
    loadDiscoveredPersonas();
  }, [user]);

  const saveToLibrary = async (imageUrl: string, personaId: string) => {
    // 1. Optimistic update
    const tempId = Date.now().toString();
    const newCreation: SavedCreation = {
      id: tempId,
      personaId,
      imageUrl,
      timestamp: Date.now(),
    };
    
    // 2. If User Logged In -> Supabase
    if (user) {
        setLibrary(prev => [newCreation, ...prev]); // Optimistic UI

        try {
            // Upload base64 to Storage
            // Convert base64 to Blob
            const base64Data = imageUrl.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            
            const fileName = `${user.id}/${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage
                .from('creations')
                .upload(fileName, blob);
            
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('creations')
                .getPublicUrl(fileName);

            // Save metadata to DB
            const { data: inserted, error: dbError } = await supabase
                .from('creations')
                .insert({
                    user_id: user.id,
                    persona_id: personaId,
                    image_url: publicUrl // Save the storage URL, not base64
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // Replace optimistic item with real one (if needed, or just reload)
            // Ideally we replace the ID, but for now re-fetching is safer or just keeping optimistic is fine until refresh
            // Let's silently reload to ensure IDs are correct for deletion
            loadSupabaseLibrary();

        } catch (error) {
            console.error("Failed to save to Supabase:", error);
            // Revert optimistic update? Or show error toast
            // For now, just logging.
            alert("Failed to save to cloud storage. Please try again.");
            setLibrary(prev => prev.filter(i => i.id !== tempId));
        }

    } else {
        // 3. Guest -> Local Storage
        const updated = [newCreation, ...library];
        setLibrary(updated);
        localStorage.setItem('posterme_library', JSON.stringify(updated));
    }
  };

  const removeFromLibrary = async (id: string) => {
    // Optimistic UI
    const previousLibrary = [...library];
    setLibrary(prev => prev.filter(item => item.id !== id));

    if (user) {
        try {
            const { error } = await supabase
                .from('creations')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
        } catch (error) {
            console.error("Failed to delete from Supabase:", error);
            setLibrary(previousLibrary); // Revert
            alert("Failed to delete image.");
        }
    } else {
        const updated = previousLibrary.filter(item => item.id !== id);
        localStorage.setItem('posterme_library', JSON.stringify(updated));
    }
  };

  const addPersonas = (newPersonas: Persona[]) => {
    setPersonas(prev => [...prev, ...newPersonas]);
  };

  return (
    <ImageContext.Provider
      value={{
        uploadedImage,
        setUploadedImage,
        selectedPersona,
        setSelectedPersona,
        generatedImage,
        setGeneratedImage,
        library,
        saveToLibrary,
        removeFromLibrary,
        personas,
        addPersonas,
        credits,
        isUnlimited,
        checkCredits,
        deductCredit,
        buyCredits
      }}
    >
      {children}
    </ImageContext.Provider>
  );
};

export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within an ImageContextProvider');
  }
  return context;
};
