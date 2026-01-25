import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext'; // Import Auth
import { supabase } from '../lib/supabase'; // Correct import path
import { generatePersonaImage } from '../services/geminiService';

import MetaHead from '../components/MetaHead';
import PersonaCard from '../components/PersonaCard';
import CreditsModal from '../components/CreditsModal';
import { toast } from 'sonner';

const ActionButton: React.FC<{
    icon: React.ReactNode,
    label: string,
    onClick?: () => void,
    variant?: 'default' | 'primary' | 'active' // Added active variant
}> = ({ icon, label, onClick, variant = 'default' }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 group"
    >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border border-transparent
            ${variant === 'primary'
                ? 'bg-white text-black hover:bg-zinc-200 hover:scale-110 hover:shadow-white/20'
                : variant === 'active'
                    ? 'bg-blue-600 text-white shadow-blue-500/30 scale-110'
                    : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:scale-110 hover:border-zinc-600 backdrop-blur-sm'
            }`}
        >
            {icon}
        </div>
        <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
    </button>
);

const ResultPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const {
        uploadedImage,
        selectedPersona,
        saveToLibrary,
        setUploadedImage,
        setSelectedPersona,
        generatedImage,
        setGeneratedImage,
        checkCredits,
        deductCredit,
        buyCredits,
        credits,
        isUnlimited,
        // Face description caching
        cachedFaceDescription,
        setCachedFaceDescription,
        setShowCreditsExhaustedModal,
        personas // For suggestions
    } = useImageContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [waitingForKey, setWaitingForKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
    const [progress, setProgress] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCreditsModal, setShowCreditsModal] = useState(false);

    const hasAttemptedRef = useRef(false);
    const isGeneratingRef = useRef(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Check if user is admin
    const isAdmin = user?.email && (
        (import.meta.env.VITE_ADMIN_EMAILS || 'deepshal99@gmail.com')
            .split(',')
            .map((e: string) => e.trim().toLowerCase())
    ).includes(user.email.toLowerCase());

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get 5 suggested personas (prioritize same category)
    const getSuggestedPersonas = useCallback(() => {
        if (!selectedPersona || personas.length === 0) return [];

        // Filter out current persona
        const otherPersonas = personas.filter(p => p.id !== selectedPersona.id);

        // Separate same category and different category
        const sameCategory = otherPersonas.filter(p => p.category === selectedPersona.category);
        const differentCategory = otherPersonas.filter(p => p.category !== selectedPersona.category);

        // Shuffle arrays for variety
        const shuffle = (arr: typeof personas) => [...arr].sort(() => Math.random() - 0.5);

        // Take from same category first, then fill with others
        const shuffledSame = shuffle(sameCategory);
        const shuffledDifferent = shuffle(differentCategory);

        const suggestions = [...shuffledSame, ...shuffledDifferent].slice(0, 5);
        return suggestions;
    }, [selectedPersona, personas]);

    useEffect(() => {
        if (!uploadedImage || !selectedPersona) {
            navigate('/');
        }
    }, [uploadedImage, selectedPersona, navigate]);

    // Progress simulation effect
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (loading) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    // Slow down as we get closer to 90%
                    const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5;
                    return Math.min(prev + increment, 95);
                });
            }, 500);
        } else {
            setProgress(100);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loading]);

    const handleFeedback = async (type: 'like' | 'dislike') => {
        if (!user || !selectedPersona) return;
        if (feedback === type) return; // Prevent double click

        setFeedback(type);

        try {
            await supabase.from('generation_feedback').insert({
                user_id: user.id,
                persona_id: selectedPersona.id,
                feedback_type: type,
                // We could store generatedImage url if we want to debug, 
                // but it's a base64 string usually in local state, 
                // and if we haven't saved it to storage yet, it might be too large or not useful.
                // Ideally we only track 'persona_id' and prompts for quality tuning.
            });
            toast.success("Thanks for the feedback!");
        } catch (error) {
            console.error("Feedback error:", error);
        }
    };

    const generateImage = useCallback(async (isRetry = false) => {
        if (!uploadedImage || !selectedPersona) return;

        if (generatedImage && !isRetry) {
            return;
        }

        if (isGeneratingRef.current) {
            return;
        }

        // INSTANT LOADING FEEDBACK: Set loading state IMMEDIATELY
        // This provides instant visual feedback instead of 2-3 second delay
        isGeneratingRef.current = true;
        setLoading(true);
        setError(null);
        setIsSaved(false);
        setFeedback(null); // Reset feedback on new generation

        // STRICT ENFORCEMENT: Check credits before EVERY generation (including retry)
        const hasCredits = await checkCredits();

        // If not logged in, they technically have 0 credits so this will block them, which is correct.
        if (!hasCredits) {
            setShowCreditsExhaustedModal(true);
            setLoading(false); // Stop loading
            isGeneratingRef.current = false; // Release lock

            // Show user-friendly message for retry attempts
            if (isRetry) {
                toast.error("You need 1 credit to retry generation");
            }
            return;
        }

        try {
            const aistudio = (window as any).aistudio;
            if (aistudio && !isRetry) {
                const hasKey = await aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    setLoading(false);
                    isGeneratingRef.current = false;
                    setWaitingForKey(true);
                    return;
                }
            }

            // CRITICAL FIX: Deduct credit BEFORE generation starts
            // This provides instant UI feedback to the user
            try {
                await deductCredit();
            } catch (creditError) {
                console.error("Credit deduction failed:", creditError);
                setShowCreditsExhaustedModal(true);
                setLoading(false);
                isGeneratingRef.current = false;
                toast.error("Failed to deduct credit. Please try again.");
                return;
            }

            // COST OPTIMIZATION: Pass cached face description if available
            // Pass user's name and personaId for auto-saving
            const result = await generatePersonaImage(
                uploadedImage,
                selectedPersona.prompt,
                cachedFaceDescription, // Pass cached description if available
                user?.user_metadata?.full_name || user?.user_metadata?.name,
                selectedPersona.id, // Pass personaId for auto-saving
                null, // STOP sending cover image as reference (Cost optimization)
                selectedPersona.reference_description // Pass reference_description if available
            );

            // Cache the face description for future generations with the same photo
            if (result.faceDescription && !cachedFaceDescription) {
                setCachedFaceDescription(result.faceDescription);
            }

            setGeneratedImage(result.image);
            setLoading(false);
        } catch (err: any) {
            console.error("Generation failed:", err);
            const errorMessage = err.message || err.toString();

            if (errorMessage.includes("Requested entity was not found")) {
                setWaitingForKey(true);
                setError(null);
            } else if (errorMessage.includes("Duplicate request") || errorMessage.includes("already in progress")) {
                // Silently ignore duplicate requests
            } else if (errorMessage.includes("Insufficient credits")) {
                setShowCreditsExhaustedModal(true);
                setError(null);
            } else if (errorMessage.includes("503") || errorMessage.includes("overloaded") || errorMessage.includes("UNAVAILABLE")) {
                // User-friendly message for overloaded API
                setError("The AI model is currently experiencing high demand. We've already tried multiple times. Please wait a moment and try again.");
                toast.error("Model temporarily overloaded. Please try again in a moment.");
            } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
                setError("Too many requests. Please wait a moment before trying again.");
                toast.error("Rate limit reached. Please wait a moment.");
            } else {
                setError(errorMessage);
                // If generation failed after credit deduction, user already paid
                // Standard practice: don't refund for failed AI generations
                toast.error("Generation failed. Please try again.");
            }
            setLoading(false);
        } finally {
            // Always release the deduplication lock
            isGeneratingRef.current = false;
        }
    }, [uploadedImage, selectedPersona, checkCredits, deductCredit, cachedFaceDescription, setCachedFaceDescription, generatedImage]);

    // Auto-generate on mount (must be AFTER generateImage is defined)
    useEffect(() => {
        if (hasAttemptedRef.current || !uploadedImage || !selectedPersona) return;

        if (generatedImage) {
            hasAttemptedRef.current = true;
            return;
        }

        hasAttemptedRef.current = true;
        generateImage(false);
    }, [uploadedImage, selectedPersona, generateImage, generatedImage]);

    const handleKeySelection = async () => {
        const aistudio = (window as any).aistudio;
        if (aistudio) {
            try {
                await aistudio.openSelectKey();
                setWaitingForKey(false);
                generateImage(true);
            } catch (err) {
                setError("Failed to select key.");
                setLoading(false);
            }
        }
    };

    const handleDownload = () => {
        if (generatedImage && selectedPersona) {
            const link = document.createElement('a');
            link.href = generatedImage;
            link.download = `${selectedPersona.id}_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleSave = () => {
        if (generatedImage && selectedPersona && !isSaved) {
            saveToLibrary(generatedImage, selectedPersona.id);
            setIsSaved(true);
        }
    };

    const handleDiscard = () => {
        navigate('/');
    };

    if (!uploadedImage || !selectedPersona) return null;

    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col w-full">
            <MetaHead
                title={selectedPersona ? `Saved: ${selectedPersona.name} | PosterMe` : "Your Movie Poster | PosterMe"}
                description="Your personalized movie poster is ready. Star in your favorite roles with PosterMe AI."
                image={generatedImage || (selectedPersona?.cover)}
                url={window.location.href}
            />
            {showCreditsModal && <CreditsModal onClose={() => setShowCreditsModal(false)} />}

            {/* Full Screen Loading Overlay */}
            {loading && !waitingForKey && (
                <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center animate-fade-in px-4">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 rounded-full blur-3xl bg-blue-600/20 animate-pulse"></div>
                        <div className="w-24 h-24 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin relative z-10"></div>
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <span className="text-lg font-bold text-white">{Math.round(progress)}%</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white mb-3 animate-pulse text-center">
                        Creating Poster...
                    </h2>
                    <p className="text-zinc-500 font-medium text-center">
                        {['Movie', 'Series'].includes(selectedPersona.category) ? 'Casting you in' : 'Casting you as'} {selectedPersona.name}
                    </p>
                </div>
            )}

            {/* Main Content - Not loading */}
            {!loading && (
                <>
                    {/* Floating Top-Left: Back + Title */}
                    <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 rounded-full bg-zinc-900/80 backdrop-blur-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800/50"
                            aria-label="Go back"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold text-white bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800/50 truncate max-w-[200px] md:max-w-xs">
                            {selectedPersona.name}
                        </h1>
                    </div>

                    {/* Floating Top-Right: Credits + User */}
                    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                        {/* Credits Button */}
                        <button
                            onClick={() => setShowCreditsModal(true)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-900/80 backdrop-blur-md border transition-all ${isUnlimited || credits > 0
                                ? 'border-zinc-800/50 text-zinc-300 hover:bg-zinc-800'
                                : 'border-red-500/30 text-red-400 animate-pulse'
                                }`}
                        >
                            {isUnlimited ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 12c-2-2.67-6-2.67-8 0a4 4 0 1 0 0 8c2 2.67 6 2.67 8 0a4 4 0 1 0 0-8Z" />
                                    <path d="M12 12c2-2.67 6-2.67 8 0a4 4 0 1 1 0 8c-2 2.67-6 2.67-8 0a4 4 0 1 1 0-8Z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                                </svg>
                            )}
                            <span className="text-xs font-bold">{isUnlimited ? 'PRO' : credits}</span>
                        </button>

                        {/* User Avatar with Dropdown */}
                        {user && (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="rounded-full overflow-hidden border-2 border-zinc-800/50 hover:border-zinc-600 transition-colors"
                                >
                                    {user.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt="User" className="w-9 h-9" />
                                    ) : (
                                        <div className="w-9 h-9 bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 z-50 animate-scale-up origin-top-right">
                                        <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                                            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                                                <p className="text-white font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                                                <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                                            </div>
                                            <div className="p-2">
                                                <button
                                                    onClick={() => { setIsMenuOpen(false); navigate('/library'); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-left"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    My Library
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => { setIsMenuOpen(false); navigate('/admin'); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-left"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        Admin Dashboard
                                                    </button>
                                                )}
                                                <div className="h-px bg-zinc-800 my-2"></div>
                                                <button
                                                    onClick={() => { setIsMenuOpen(false); signOut(); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hero Section - Full viewport height */}
                    <main className="h-svh flex flex-col">

                        {/* Waiting for Key */}
                        {waitingForKey && (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="text-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md animate-fade-in shadow-2xl">
                                    <h2 className="text-xl font-bold mb-4 text-white">API Key Required</h2>
                                    <p className="text-zinc-400 mb-8 leading-relaxed">To access the Gemini 3 Pro model for high-quality generation, please select a billing-enabled API key.</p>
                                    <button onClick={handleKeySelection} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors w-full">
                                        Select Key
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="text-center animate-fade-in max-w-lg">
                                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Poster Creation Failed</h3>
                                    <p className="text-zinc-400 mb-8 px-4 break-words">{error}</p>
                                    <div className="flex justify-center gap-4">
                                        <button onClick={handleDiscard} className="px-6 py-2 bg-zinc-800 text-white font-medium rounded-full hover:bg-zinc-700 transition-colors">Back</button>
                                        <button onClick={() => generateImage(true)} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">Try Again</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success State - Image with Floating Action Bar */}
                        {generatedImage && !error && !waitingForKey && (
                            <div className="flex-1 flex items-center justify-center p-4 md:p-6 min-h-0">
                                {/* Image + Actions Group - stays together */}
                                <div className="flex items-center gap-3 md:gap-4 max-h-full">
                                    {/* Image Container */}
                                    <div className="relative group flex items-center justify-center">
                                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
                                        <img
                                            src={generatedImage}
                                            alt="Result"
                                            className="relative max-w-[calc(100vw-120px)] md:max-w-[calc(100vw-160px)] max-h-[calc(100svh-80px)] object-contain rounded-xl shadow-2xl animate-scale-up"
                                        />
                                    </div>

                                    {/* Floating Vertical Action Bar - next to image */}
                                    <div className="shrink-0 bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-800/50 p-2 md:p-3 flex flex-col items-center gap-2 md:gap-3">
                                        {/* Download - Primary */}
                                        <button
                                            onClick={handleDownload}
                                            className="p-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all hover:scale-110"
                                            title="Download"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /></svg>
                                        </button>

                                        {/* Save */}
                                        <button
                                            onClick={handleSave}
                                            className={`p-2.5 rounded-xl transition-all hover:scale-110 ${isSaved ? 'bg-green-500/20 text-green-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                                            title={isSaved ? 'Saved' : 'Save to Library'}
                                        >
                                            {isSaved ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                            )}
                                        </button>

                                        <div className="w-6 h-px bg-zinc-700" />

                                        {/* Like */}
                                        <button
                                            onClick={() => handleFeedback('like')}
                                            className={`p-2.5 rounded-xl transition-all hover:scale-110 ${feedback === 'like' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                                            title="Like"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                                        </button>

                                        {/* Dislike */}
                                        <button
                                            onClick={() => handleFeedback('dislike')}
                                            className={`p-2.5 rounded-xl transition-all hover:scale-110 ${feedback === 'dislike' ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                                            title="Dislike"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                                        </button>

                                        <div className="w-6 h-px bg-zinc-700" />

                                        {/* Retry */}
                                        {(credits > 0 || isUnlimited) ? (
                                            <button
                                                onClick={() => generateImage(true)}
                                                className="p-2.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all hover:scale-110"
                                                title="Retry"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={buyCredits}
                                                className="p-2.5 rounded-xl hover:bg-zinc-800 text-zinc-500 transition-all"
                                                title="Buy credits"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </button>
                                        )}

                                        {/* Discard */}
                                        <button
                                            onClick={handleDiscard}
                                            className="p-2.5 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all hover:scale-110"
                                            title="Discard"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Suggestions Section - Below the fold */}
                    {generatedImage && !error && !waitingForKey && (
                        <section className="w-full bg-[#09090b] border-t border-zinc-800/50 py-12 px-6 md:px-12 z-10 relative">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Try Another Look</h2>
                                    </div>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group"
                                    >
                                        View All <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                                    {getSuggestedPersonas().map((persona) => (
                                        <PersonaCard
                                            key={persona.id}
                                            persona={persona}
                                            onClick={() => {
                                                setSelectedPersona(persona);
                                                setGeneratedImage(null);
                                                navigate(`/persona/${persona.id}`);
                                                window.scrollTo(0, 0);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
};

export default ResultPage;
