import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { generatePersonaImage } from '../services/geminiService';

import MetaHead from '../components/MetaHead';
import PersonaCard from '../components/PersonaCard';
import CreditsModal from '../components/CreditsModal';
import Tooltip from '../components/Tooltip';
import AuthModal from '../components/AuthModal';
import Postey from '../components/Postey';
import loadingMessages from '../utils/loadingMessages';
import { toast } from 'sonner';

import { ArrowLeft, Download, Heart, Check, ThumbsUp, ThumbsDown, RefreshCw, Coins, X, Zap, Infinity, Images, Settings, LogOut } from 'lucide-react';

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
        cachedFaceDescription,
        setCachedFaceDescription,
        setShowCreditsExhaustedModal,
        personas
    } = useImageContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [waitingForKey, setWaitingForKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
    const [progress, setProgress] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);
    const [showCelebration, setShowCelebration] = useState(false);

    const hasAttemptedRef = useRef(false);
    const isGeneratingRef = useRef(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.email && (
        (import.meta.env.VITE_ADMIN_EMAILS || 'deepshal99@gmail.com')
            .split(',')
            .map((e: string) => e.trim().toLowerCase())
    ).includes(user.email.toLowerCase());

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getSuggestedPersonas = useCallback(() => {
        if (!selectedPersona || personas.length === 0) return [];
        const otherPersonas = personas.filter(p => p.id !== selectedPersona.id);
        const sameCategory = otherPersonas.filter(p => p.category === selectedPersona.category);
        const differentCategory = otherPersonas.filter(p => p.category !== selectedPersona.category);
        const shuffle = (arr: typeof personas) => [...arr].sort(() => Math.random() - 0.5);
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

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (loading) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
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

    // Rotate loading messages
    useEffect(() => {
        if (!loading) return;
        let idx = 0;
        setLoadingMsg(loadingMessages[0]);
        const msgInterval = setInterval(() => {
            idx = (idx + 1) % loadingMessages.length;
            setLoadingMsg(loadingMessages[idx]);
        }, 3000);
        return () => clearInterval(msgInterval);
    }, [loading]);

    // Show celebration briefly on success
    useEffect(() => {
        if (generatedImage && !loading && !error) {
            setShowCelebration(true);
            const timer = setTimeout(() => setShowCelebration(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [generatedImage, loading, error]);

    const handleFeedback = async (type: 'like' | 'dislike') => {
        if (!user || !selectedPersona) return;
        if (feedback === type) return;

        setFeedback(type);

        try {
            await supabase.from('generation_feedback').insert({
                user_id: user.id,
                persona_id: selectedPersona.id,
                feedback_type: type,
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

        isGeneratingRef.current = true;
        setLoading(true);
        setError(null);
        setIsSaved(false);
        setFeedback(null);

        const hasCredits = await checkCredits();

        if (!hasCredits) {
            setShowCreditsExhaustedModal(true);
            setLoading(false);
            isGeneratingRef.current = false;

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

            const result = await generatePersonaImage(
                uploadedImage,
                selectedPersona.prompt,
                cachedFaceDescription,
                user?.user_metadata?.full_name || user?.user_metadata?.name,
                selectedPersona.id,
                null,
                selectedPersona.reference_description
            );

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
                // Silently ignore
            } else if (errorMessage.includes("Insufficient credits")) {
                setShowCreditsExhaustedModal(true);
                setError(null);
            } else if (errorMessage.includes("503") || errorMessage.includes("overloaded") || errorMessage.includes("UNAVAILABLE")) {
                setError("The AI model is currently experiencing high demand. We've already tried multiple times. Please wait a moment and try again.");
                toast.error("Model temporarily overloaded. Please try again in a moment.");
            } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
                setError("Too many requests. Please wait a moment before trying again.");
                toast.error("Rate limit reached. Please wait a moment.");
            } else {
                setError(errorMessage);
                toast.error("Generation failed. Please try again.");
            }
            setLoading(false);
        } finally {
            isGeneratingRef.current = false;
        }
    }, [uploadedImage, selectedPersona, checkCredits, deductCredit, cachedFaceDescription, setCachedFaceDescription, generatedImage]);

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
        <div className="min-h-screen bg-[var(--bg)] flex flex-col w-full">
            <MetaHead
                title={selectedPersona ? `Saved: ${selectedPersona.name} | PosterMe` : "Your Movie Poster | PosterMe"}
                description="Your personalized movie poster is ready. Star in your favorite roles with PosterMe AI."
                image={generatedImage || (selectedPersona?.cover)}
                url={window.location.href}
            />
            {showCreditsModal && <CreditsModal onClose={() => setShowCreditsModal(false)} />}
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

            {/* Full Screen Loading Overlay with Postey */}
            {loading && !waitingForKey && (
                <div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col items-center justify-center animate-fade-in px-4">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-full blur-3xl bg-[var(--accent)]/15 animate-pulse scale-150"></div>
                        <Postey size={120} mood="directing" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
                        Creating Poster...
                    </h2>
                    <p className="text-[var(--text-secondary)] font-medium text-center mb-6 transition-all duration-500">
                        {loadingMsg}
                    </p>
                    {/* Progress bar */}
                    <div className="w-48 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6c72cb, #8b6cc7, #c45a9a)' }}
                        />
                    </div>
                    <span className="text-xs text-[var(--text-muted)] mt-2 font-medium">{Math.round(progress)}%</span>
                </div>
            )}

            {/* Main Content - Not loading */}
            {!loading && (
                <>
                    {/* Floating Top-Left: Back + Title */}
                    <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 rounded-xl bg-[var(--surface)]/80 backdrop-blur-xl hover:bg-white/[0.08] text-[var(--text-secondary)] hover:text-white transition-colors border border-white/[0.06]"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-lg font-bold text-white bg-[var(--surface)]/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/[0.06] truncate max-w-[200px] md:max-w-xs">
                            {selectedPersona.name}
                        </h1>
                    </div>

                    {/* Floating Top-Right: Credits + User */}
                    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                        {user ? (
                            <>
                                <button
                                    onClick={() => setShowCreditsModal(true)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--surface)]/80 backdrop-blur-xl border transition-all ${isUnlimited || credits > 0
                                        ? 'border-white/[0.06] text-zinc-300 hover:bg-white/[0.08]'
                                        : 'border-red-500/30 text-red-400 animate-pulse'
                                        }`}
                                >
                                    {isUnlimited ? (
                                        <Infinity size={16} className="text-amber-400" />
                                    ) : (
                                        <Zap size={16} />
                                    )}
                                    <span className="text-xs font-bold">{isUnlimited ? 'PRO' : credits}</span>
                                </button>

                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="rounded-full overflow-hidden border-2 border-white/[0.08] hover:border-white/[0.15] transition-colors"
                                    >
                                        {user.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="User" className="w-9 h-9" />
                                        ) : (
                                            <div className="w-9 h-9 bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </button>

                                    {isMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-64 z-50 animate-scale-up origin-top-right">
                                            <div className="bg-[var(--surface)] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
                                                <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
                                                    <p className="text-white font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                                                    <p className="text-[var(--text-muted)] text-xs truncate">{user.email}</p>
                                                </div>
                                                <div className="p-2">
                                                    <button
                                                        onClick={() => { setIsMenuOpen(false); navigate('/library'); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left"
                                                    >
                                                        <Images size={16} />
                                                        My Library
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => { setIsMenuOpen(false); navigate('/admin'); }}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left"
                                                        >
                                                            <Settings size={16} />
                                                            Admin Dashboard
                                                        </button>
                                                    )}
                                                    <div className="h-px bg-white/[0.06] my-2"></div>
                                                    <button
                                                        onClick={() => { setIsMenuOpen(false); signOut(); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                                                    >
                                                        <LogOut size={16} />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="px-5 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-zinc-200 transition-all hover:scale-105 shadow-lg shadow-white/5"
                            >
                                Sign In
                            </button>
                        )}
                    </div>

                    {/* Hero Section */}
                    <main className="h-svh flex flex-col pt-16 md:pt-0">

                        {/* Waiting for Key */}
                        {waitingForKey && (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="text-center p-8 bg-[var(--surface)] rounded-3xl border border-white/[0.08] max-w-md animate-fade-in shadow-2xl">
                                    <h2 className="text-xl font-bold mb-4 text-white">API Key Required</h2>
                                    <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">To access the Gemini model for high-quality generation, please select a billing-enabled API key.</p>
                                    <button onClick={handleKeySelection} className="bg-white text-black px-8 py-3 rounded-2xl font-bold hover:bg-zinc-200 transition-colors w-full">
                                        Select Key
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="flex-1 flex items-center justify-center p-6">
                                <div className="text-center animate-fade-in max-w-lg">
                                    <div className="mx-auto mb-6 flex items-center justify-center">
                                        <Postey size={80} mood="sad" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Poster Creation Failed</h3>
                                    <p className="text-[var(--text-secondary)] mb-8 px-4 break-words">{error}</p>
                                    <div className="flex justify-center gap-4">
                                        <button onClick={handleDiscard} className="px-6 py-2 bg-white/[0.06] text-white font-medium rounded-full hover:bg-white/[0.1] transition-colors">Back</button>
                                        <button onClick={() => generateImage(true)} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">Try Again</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success State */}
                        {generatedImage && !error && !waitingForKey && (
                            <div className="flex-1 flex items-center justify-center p-4 md:p-6 min-h-0">
                                {/* Celebration Postey */}
                                {showCelebration && (
                                    <div className="fixed bottom-6 left-6 z-40 animate-fade-in" style={{ animationDuration: '0.5s' }}>
                                        <Postey size={48} mood="celebrating" />
                                    </div>
                                )}
                                <div className="flex items-center gap-3 md:gap-4 max-h-full">
                                    {/* Image Container */}
                                    <div className="relative group flex items-center justify-center">
                                        <div className="absolute -inset-2 bg-[var(--accent)]/10 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
                                        <img
                                            src={generatedImage}
                                            alt="Result"
                                            className="relative max-w-[calc(100vw-120px)] md:max-w-[calc(100vw-160px)] max-h-[calc(100svh-80px)] object-contain rounded-2xl shadow-2xl animate-scale-up"
                                        />
                                    </div>

                                    {/* Floating Vertical Action Bar */}
                                    <div className="shrink-0 bg-[var(--surface)]/80 backdrop-blur-xl rounded-2xl border border-white/[0.06] p-2 md:p-3 flex flex-col items-center gap-2 md:gap-3">
                                        {/* Download */}
                                        <Tooltip content="Download" position="left">
                                            <button
                                                onClick={handleDownload}
                                                className="p-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all hover:scale-110"
                                            >
                                                <Download size={20} />
                                            </button>
                                        </Tooltip>

                                        {/* Save */}
                                        <Tooltip content={isSaved ? 'Saved' : 'Save to Library'} position="left">
                                            <button
                                                onClick={handleSave}
                                                className={`p-2.5 rounded-xl transition-all hover:scale-110 ${isSaved ? 'bg-emerald-500/15 text-emerald-400' : 'hover:bg-white/[0.06] text-[var(--text-secondary)] hover:text-white'}`}
                                            >
                                                {isSaved ? (
                                                    <Check size={20} />
                                                ) : (
                                                    <Heart size={20} />
                                                )}
                                            </button>
                                        </Tooltip>

                                        <div className="w-6 h-px bg-white/[0.08]" />

                                        {/* Like */}
                                        <Tooltip content="Like result" position="left">
                                            <button
                                                onClick={() => handleFeedback('like')}
                                                className={`p-2.5 rounded-xl transition-all hover:scale-110 ${feedback === 'like' ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'hover:bg-white/[0.06] text-[var(--text-secondary)] hover:text-white'}`}
                                            >
                                                <ThumbsUp size={20} />
                                            </button>
                                        </Tooltip>

                                        {/* Dislike */}
                                        <Tooltip content="Dislike result" position="left">
                                            <button
                                                onClick={() => handleFeedback('dislike')}
                                                className={`p-2.5 rounded-xl transition-all hover:scale-110 ${feedback === 'dislike' ? 'bg-orange-500/15 text-orange-400' : 'hover:bg-white/[0.06] text-[var(--text-secondary)] hover:text-white'}`}
                                            >
                                                <ThumbsDown size={20} />
                                            </button>
                                        </Tooltip>

                                        <div className="w-6 h-px bg-white/[0.08]" />

                                        {/* Retry */}
                                        {(credits > 0 || isUnlimited) ? (
                                            <Tooltip content="Retry generation" position="left">
                                                <button
                                                    onClick={() => generateImage(true)}
                                                    className="p-2.5 rounded-xl hover:bg-white/[0.06] text-[var(--text-secondary)] hover:text-white transition-all hover:scale-110"
                                                >
                                                    <RefreshCw size={20} />
                                                </button>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip content="Buy credits" position="left">
                                                <button
                                                    onClick={buyCredits}
                                                    className="p-2.5 rounded-xl hover:bg-white/[0.06] text-[var(--text-muted)] transition-all"
                                                >
                                                    <Coins size={20} />
                                                </button>
                                            </Tooltip>
                                        )}

                                        {/* Discard */}
                                        <Tooltip content="Discard & Back" position="left">
                                            <button
                                                onClick={handleDiscard}
                                                className="p-2.5 rounded-xl hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 transition-all hover:scale-110"
                                            >
                                                <X size={20} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Suggestions Section */}
                    {generatedImage && !error && !waitingForKey && (
                        <section className="w-full bg-[var(--bg)] border-t border-white/[0.06] py-12 px-6 md:px-12 z-10 relative">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Try Another Look</h2>
                                    </div>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors flex items-center gap-1 group"
                                    >
                                        View All <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
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
