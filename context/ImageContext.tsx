import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ImageContextType, Persona, SavedCreation } from '../types.ts';
import { PERSONAS } from '../constants.ts';
import { useAuth } from './AuthContext.tsx';
import { supabase } from '../lib/supabase.ts';
import { generateImageHash } from '../services/geminiService.ts';

import { toast } from 'sonner';

// @ts-ignore
const ImageContext = createContext<ImageContextType | undefined>(undefined);

export const ImageContextProvider = ({ children }: { children: any }) => {
  const { user } = useAuth();
  
  // Initialize state (don't load from localStorage - images are too large)
  // @ts-ignore
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
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
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('posterme_credits');
    return saved ? parseInt(saved, 10) : 0;
  });
  // @ts-ignore
  const [isUnlimited, setIsUnlimited] = useState<boolean>(() => {
    return localStorage.getItem('posterme_is_unlimited') === 'true';
  });
  
  // Face description caching for API cost optimization
  // When a user tries multiple personas with the same photo, we reuse the face description
  const [cachedFaceDescription, setCachedFaceDescription] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Persist credits and unlimited status
  useEffect(() => {
    localStorage.setItem('posterme_credits', credits.toString());
    localStorage.setItem('posterme_is_unlimited', String(isUnlimited));
  }, [credits, isUnlimited]);

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
          setCredits((prev: number) => {
              const newVal = Math.max(0, prev - 1);
              return newVal;
          });

          const { data, error } = await supabase.rpc('consume_credit');
          
          if (error) throw error;
          
          // data is boolean success
          if (data === false) {
              fetchCredits(); // Re-sync with server true value
              throw new Error("Insufficient credits");
          }
      } catch (e) {
          console.error("Failed to deduct credit", e);
          fetchCredits(); // Re-sync on error
          throw e; // Propagate error so caller knows it failed
      }
  };

  
  const buyCredits = async () => {
      if (!user) {
          toast.error("Please sign in to buy credits");
          return;
      }
      
      const toastId = toast.loading("Initiating Payment...");

      try {
          // Use origin + pathname + placeholder for Cashfree to inject the order_id
          const returnUrl = window.location.origin + window.location.pathname + "?order_id={order_id}";

          // 1. Create Order via Edge Function
          const { data, error } = await supabase.functions.invoke('payment-handler', {
              body: { 
                  action: 'create_order',
                  returnUrl: returnUrl
              }
          });
          
          if (error) throw error;
          if (!data.payment_session_id) throw new Error("No payment session received");

          console.log("Payment Session Created:", data);

          // 2. Initialize Cashfree SDK
          // @ts-ignore
          if (!window.Cashfree) {
              throw new Error("Cashfree SDK not loaded");
          }
          
          // @ts-ignore
          const cashfree = new window.Cashfree({
              mode: import.meta.env.PROD ? "production" : "sandbox"
          });

          // 3. Open Checkout
          await cashfree.checkout({
              paymentSessionId: data.payment_session_id,
              redirectTarget: "_self" // Redirects the page
          });
          
      } catch (error: any) {
          console.error("Buy credits failed", error);
          
          let errorMessage = error.message || "Failed to initiate payment";
          
          // Try to extract the actual error message from the Edge Function response
          if (error && typeof error === 'object' && 'context' in error) {
              try {
                  const errorBody = await error.context.json();
                  if (errorBody && errorBody.error) {
                      errorMessage = errorBody.error;
                      console.error("Edge Function Error Body:", errorBody);
                  }
              } catch (e) {
                  // Failed to parse body
              }
          }

          toast.error(errorMessage, { id: toastId });
      }
  };

  // Check for Payment Return (Cashfree)
  useEffect(() => {
      const checkPayment = async () => {
          const query = new URLSearchParams(window.location.search);
          const orderId = query.get('order_id');
          
          console.log("Checking Payment - URL Params:", window.location.search);
          console.log("Checking Payment - Order ID:", orderId);
          console.log("Checking Payment - User:", user ? user.id : "Not logged in");

          if (orderId) {
              if (!user) {
                  console.log("Order ID found, waiting for user auth...");
                  return; // Wait for user to be loaded
              }

              // Clear the URL immediately to prevent loops
              window.history.replaceState({}, document.title, window.location.pathname);
              
              const toastId = toast.loading("Verifying payment...");
              console.log("Verifying Order ID with Backend:", orderId);
              
              try {
                  const { data, error } = await supabase.functions.invoke('payment-handler', {
                      body: {
                          action: 'verify_payment',
                          order_id: orderId
                      }
                  });

                  if (error) {
                      console.error("Edge Function Error:", error);
                      throw error;
                  }
                  
                  console.log("Payment Verification Response:", data);

                  if (data.success) {
                      // Success! Show Modal
                      toast.dismiss(toastId);
                      setShowSuccessModal(true);
                      await fetchCredits();
                  } else {
                      console.error("Payment failed reason:", data.message, data.status);
                      toast.error(data.message || "Payment not completed.", { id: toastId });
                  }
              } catch (e: any) {
                  console.error("Payment verification error", e);
                  toast.error("Failed to verify payment.", { id: toastId });
              }
          }
      };

      checkPayment();
  }, [user]);

  // Persist uploadedImage changes and compute hash for face description caching
  useEffect(() => {
    if (uploadedImage) {
        // Don't persist to localStorage - images are too large and exceed quota
        // We'll keep them in React state only (memory)
        // localStorage is better for small metadata, not base64 images
        
        // Compute image hash for cache keying
        generateImageHash(uploadedImage).then(hash => {
            // Check if this is a new image (different hash)
            if (hash !== imageHash) {
                setImageHash(hash);
                // Clear cached face description when image changes
                setCachedFaceDescription(null);
                console.log(`New image detected (hash: ${hash}), cleared face description cache`);
            }
        }).catch(e => {
            console.error("Failed to compute image hash", e);
        });
    } else {
        // Clear cache when image is removed
        setImageHash(null);
        setCachedFaceDescription(null);
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
                  prompt: p.prompt,
                  // Add display order support
                  display_order: p.display_order ?? 999,
                  // Capture visibility explicitly from DB
                  is_visible: p.is_visible
              }));
              
              // Merge with static personas
              setPersonas((prev: Persona[]) => {
                  // 1. Create a map of static personas for easy lookup
                  // Default them to visible
                  const combinedMap = new Map<string, any>();
                  PERSONAS.forEach(p => {
                      combinedMap.set(p.id, { 
                          ...p, 
                          is_visible: true,
                          display_order: 999 // Default order
                      });
                  });
                  
                  // 2. Apply DB overrides and add new custom personas
                  dynamicPersonas.forEach(dp => {
                      if (combinedMap.has(dp.id)) {
                          // OVERRIDE: Update existing static persona with DB values
                          // This ensures is_visible: false from DB wins
                          combinedMap.set(dp.id, { 
                              ...combinedMap.get(dp.id), 
                              ...dp 
                          });
                      } else {
                          // ADD: New custom persona
                          combinedMap.set(dp.id, dp);
                      }
                  });
                  
                  // 3. Convert back to array
                  const combined = Array.from(combinedMap.values());
                  
                  // 4. Filter out hidden personas
                  const visible = combined.filter((p: any) => p.is_visible !== false);

                  // 5. Sort by display_order
                  return visible.sort((a: any, b: any) => {
                      // Use explicit order if available, otherwise default to 999
                      // We treat -1 as "undefined/last" for safety
                      const orderA = (a.display_order !== undefined && a.display_order !== -1) ? a.display_order : 999;
                      const orderB = (b.display_order !== undefined && b.display_order !== -1) ? b.display_order : 999;
                      
                      // Primary sort: Order
                      if (orderA !== orderB) return orderA - orderB;
                      
                      // Secondary sort: Name (stability)
                      return (a.name || '').localeCompare(b.name || '');
                  });
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
        buyCredits,
        // Face description caching
        cachedFaceDescription,
        setCachedFaceDescription,
        imageHash,
        showSuccessModal,
        setShowSuccessModal
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
