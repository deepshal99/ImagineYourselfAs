import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext'; // Import Auth
import { supabase } from '../lib/supabase'; // Correct import path
import { generatePersonaImage } from '../services/geminiService';
import Navigation from '../components/Navigation';
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
    const { user } = useAuth(); // Get user
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
        setCachedFaceDescription
    } = useImageContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [waitingForKey, setWaitingForKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [creditsExhausted, setCreditsExhausted] = useState(false);
    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null); // Feedback state

    const [progress, setProgress] = useState(0); // Simulated progress

    const hasAttemptedRef = useRef(false);
    // Request deduplication lock - prevents multiple simultaneous API calls
    const isGeneratingRef = useRef(false);

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

        // REQUEST DEDUPLICATION: Prevent multiple simultaneous API calls
        if (isGeneratingRef.current) {
            console.log("Generation already in progress, ignoring duplicate request");
            return;
        }

        // Set deduplication lock
        isGeneratingRef.current = true;
        setLoading(true); // INSTANT FEEDBACK: Start loading immediately
        setError(null);
        setIsSaved(false);
        setFeedback(null); // Reset feedback on new generation

        // STRICT ENFORCEMENT: Check credits before EVERY generation (including retry)
        const hasCredits = await checkCredits();

        // If not logged in, they technically have 0 credits so this will block them, which is correct.
        if (!hasCredits) {
            setCreditsExhausted(true);
            setLoading(false); // Ensure loading stops
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

            // COST OPTIMIZATION: Pass cached face description if available
            console.log(cachedFaceDescription
                ? "Using cached face description (saving 1 API call!)"
                : "No cached face description, will generate new one"
            );

            // Deduct credit *before* starting generation (optimistic)
            // Or if we want to be strict: Reserve credit?
            // Current requirement: "every generation = 1 credit STRICTLY"
            // If we fail, we could refund, but standard practice for AI gen is usually deduction on initiation or success.
            // User asked "try again should count as credit and users should not be allowed to try again if they don't have credits"

            // We will deduct AFTER success to be fair, but we MUST ensure they can't start if 0.
            // We already checked 'hasCredits' above.

            const result = await generatePersonaImage(
                uploadedImage,
                selectedPersona.prompt,
                cachedFaceDescription // Pass cached description if available
            );

            // Success! Credit was deducted server-side.
            // Refresh local credits to sync UI
            await checkCredits();

            // Cache the face description for future generations with the same photo
            if (result.faceDescription && !cachedFaceDescription) {
                setCachedFaceDescription(result.faceDescription);
                console.log("Cached new face description for future use");
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
                // Don't show error for duplicate requests, just silently ignore
                console.log("Duplicate request detected, ignoring");
            } else if (errorMessage.includes("Insufficient credits")) {
                setCreditsExhausted(true);
                setError(null);
            } else {
                setError(errorMessage);
            }
            setLoading(false);
        } finally {
            // Always release the deduplication lock
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
        generateImage();
    }, [generateImage, uploadedImage, selectedPersona, generatedImage]);

    const handleCreditsExhaustedClose = () => {
        // Maybe redirect to library or home?
        navigate('/');
    };

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
        <div className="flex flex-col h-screen w-full bg-[#09090b]">
            {!loading && <Navigation title={selectedPersona.name} />}

            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">

                {/* Credits Exhausted Modal */}
                {creditsExhausted && !loading && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative text-center">
                            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Credits Exhausted</h2>
                            <p className="text-zinc-400 mb-6">You've used your free generation credit. We hope you enjoyed your poster!</p>

                            <button
                                onClick={() => buyCredits()}
                                className="w-full bg-green-600 text-white font-bold py-3 rounded-full hover:bg-green-500 transition-colors mb-3 flex items-center justify-center gap-2"
                            >
                                <span>Get 5 Credits for ₹49</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </button>

                            <button
                                onClick={handleCreditsExhaustedClose}
                                className="w-full bg-zinc-800 text-zinc-300 font-bold py-3 rounded-full hover:bg-zinc-700 transition-colors"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                )}

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

                {/* Left: Image Area */}
                <div className="flex-1 relative flex items-center justify-center bg-zinc-950 p-6 md:p-12">

                    {/* Waiting for Key */}
                    {waitingForKey && (
                        <div className="text-center p-8 bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md animate-fade-in shadow-2xl">
                            <h2 className="text-xl font-bold mb-4 text-white">API Key Required</h2>
                            <p className="text-zinc-400 mb-8 leading-relaxed">To access the Gemini 3 Pro model for high-quality generation, please select a billing-enabled API key.</p>
                            <button onClick={handleKeySelection} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors w-full">
                                Select Key
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
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
                    )}

                    {/* Image Display */}
                    {generatedImage && !loading && (
                        <div className="relative group max-w-full max-h-[70vh] md:max-h-[85vh]">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            <img
                                src={generatedImage}
                                alt="Result"
                                className="relative w-auto h-auto max-w-full max-h-[70vh] md:max-h-[85vh] object-contain rounded-xl shadow-2xl animate-scale-up"
                            />
                        </div>
                    )}
                </div>

                {/* Right: Controls Area */}
                {!loading && !waitingForKey && !error && generatedImage && (
                    <div className="fixed bottom-0 left-0 right-0 md:static h-auto md:h-full w-full md:w-32 bg-[#09090b]/95 backdrop-blur-md border-t md:border-t-0 md:border-l border-zinc-800/50 flex flex-row md:flex-col items-center justify-evenly md:justify-center gap-2 md:gap-6 py-4 md:py-6 px-6 md:px-4 z-50 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] md:shadow-none safe-area-bottom">
                        <ActionButton
                            label="Download"
                            variant="primary"
                            onClick={handleDownload}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /></svg>}
                        />

                        <ActionButton
                            label={isSaved ? "Saved" : "Save"}
                            onClick={handleSave}
                            icon={isSaved
                                ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            }
                        />

                        <ActionButton
                            label="Like"
                            variant={feedback === 'like' ? 'active' : 'default'}
                            onClick={() => handleFeedback('like')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>}
                        />

                        <ActionButton
                            label="Dislike"
                            variant={feedback === 'dislike' ? 'active' : 'default'}
                            onClick={() => handleFeedback('dislike')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>}
                        />

                        {/* Only show retry if user has credits OR is unlimited */}
                        {(credits > 0 || isUnlimited) ? (
                            <ActionButton
                                label="Retry"
                                onClick={() => generateImage(true)}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                            />
                        ) : (
                            <ActionButton
                                label="No Credits"
                                onClick={() => toast.info("You need credits to retry. Each generation costs 1 credit.")}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                            />
                        )}

                        <ActionButton
                            label="Discard"
                            onClick={handleDiscard}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultPage;
