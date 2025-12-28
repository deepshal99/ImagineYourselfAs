import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

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

        const { data } = await supabase
            .from('user_credits')
            .select('credits, is_unlimited')
            .eq('user_id', user.id)
            .single();

        if (data?.is_unlimited) return true;
        return (data?.credits || 0) > 0;
    };

    const deductCredit = async () => {
        if (!user) {
            throw new Error("User not authenticated");
        }

        try {
            // Check if unlimited locally before modifying UI
            if (isUnlimited) {
                return;
            }

            // Extra validation: ensure user has credits locally before attempting deduction
            if (credits <= 0) {
                await fetchCredits(); // Re-sync to be sure
                throw new Error("Insufficient credits");
            }

            // Optimistic UI update
            setCredits((prev: number) => {
                const newVal = Math.max(0, prev - 1);
                return newVal;
            });

            // Call server-side RPC to deduct credit atomically
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
            // 1. Create Order via Edge Function
            const { data, error } = await supabase.functions.invoke('payment-handler', {
                body: {
                    action: 'create_order'
                }
            });

            if (error) throw error;
            if (!data.order_id) throw new Error("No order received");

            toast.dismiss(toastId);

            // 2. Open Razorpay Checkout
            // @ts-ignore
            if (!window.Razorpay) {
                throw new Error("Razorpay SDK not loaded");
            }

            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: data.currency,
                name: 'PosterMe',
                description: '5 Credits for PosterMe',
                order_id: data.order_id,
                handler: async function (response: any) {
                    // Payment successful - verify on server
                    const verifyToast = toast.loading("Verifying payment...");
                    try {
                        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('payment-handler', {
                            body: {
                                action: 'verify_payment',
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            }
                        });

                        if (verifyError) throw verifyError;

                        if (verifyData.success) {
                            toast.dismiss(verifyToast);
                            setShowSuccessModal(true);
                            await fetchCredits();
                        } else {
                            toast.error(verifyData.message || "Payment verification failed", { id: verifyToast });
                        }
                    } catch (e: any) {
                        console.error("Payment verification failed:", e);
                        toast.error("Failed to verify payment. Please contact support.", { id: verifyToast });
                    }
                },
                prefill: {
                    email: user.email || ''
                },
                theme: {
                    color: '#3B82F6'
                },
                modal: {
                    ondismiss: function () {
                        toast.info("Payment cancelled");
                    }
                }
            };

            // @ts-ignore
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                console.error("Payment failed:", response.error);
                toast.error(response.error.description || "Payment failed. Please try again.");
            });
            rzp.open();

        } catch (error: any) {
            console.error("Buy credits failed", error);
            toast.error(error.message || "Failed to initiate payment", { id: toastId });
        }
    };

    // Note: Razorpay uses inline callbacks, no URL-based return verification needed

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

    // CRITICAL FIX: Listen for guest state restoration after sign-in
    useEffect(() => {
        const handleRestore = (event: any) => {
            const { uploadedImage: restoredImage, personaId } = event.detail;

            // Restore uploaded image
            if (restoredImage) {
                setUploadedImage(restoredImage);
            }

            // Find persona in full list (includes dynamic personas)
            const persona = personas.find(p => p.id === personaId) || PERSONAS.find(p => p.id === personaId);
            if (persona) {
                setSelectedPersona(persona);
                setGeneratedImage(null);
                // Don't auto-navigate - user is already on upload page with state restored
            }
        };

        window.addEventListener('restore-generation-state', handleRestore);
        return () => window.removeEventListener('restore-generation-state', handleRestore);
    }, [personas]);

    // BACKUP: Also check localStorage directly when user becomes available
    // This handles cases where the event fires before this listener is ready
    useEffect(() => {
        if (user) {
            const pendingData = localStorage.getItem('posterme_pending_generation');
            if (pendingData) {
                try {
                    const { uploadedImage: restoredImage, personaId, timestamp } = JSON.parse(pendingData);
                    const isRecent = (Date.now() - timestamp) < 10 * 60 * 1000;

                    if (isRecent && restoredImage && personaId) {
                        localStorage.removeItem('posterme_pending_generation');

                        // Restore state
                        setUploadedImage(restoredImage);
                        const persona = personas.find(p => p.id === personaId) || PERSONAS.find(p => p.id === personaId);
                        if (persona) {
                            setSelectedPersona(persona);
                            setGeneratedImage(null);
                        }
                    } else {
                        localStorage.removeItem('posterme_pending_generation');
                    }
                } catch (e) {
                    console.error("Failed to restore pending generation:", e);
                    localStorage.removeItem('posterme_pending_generation');
                }
            }
        }
    }, [user, personas]);

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
