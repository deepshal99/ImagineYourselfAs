import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { generatePersonaImage } from '../services/geminiService';
import Navigation from '../components/Navigation';

const ActionButton: React.FC<{ 
    icon: React.ReactNode, 
    label: string, 
    onClick?: () => void,
    variant?: 'default' | 'primary'
}> = ({ icon, label, onClick, variant = 'default' }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center gap-2 group"
    >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border border-transparent
            ${variant === 'primary' 
                ? 'bg-white text-black hover:bg-zinc-200 hover:scale-110 hover:shadow-white/20' 
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
    // Face description caching
    cachedFaceDescription,
    setCachedFaceDescription
  } = useImageContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitingForKey, setWaitingForKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [creditsExhausted, setCreditsExhausted] = useState(false);
  
  const hasAttemptedRef = useRef(false);
  // Request deduplication lock - prevents multiple simultaneous API calls
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    if (!uploadedImage || !selectedPersona) {
      navigate('/');
    }
  }, [uploadedImage, selectedPersona, navigate]);

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

    // Check credits before generating (except for retries if we want to allow retry logic without double charge? 
    // Usually one generation = one credit. If they retry, it consumes another.
    // BUT user said "1 poster ONLY thats it", so retries should also be blocked or included in the 1 attempt?
    // "Logged in user gets 1 credit and they can use that 1 credit to generate 1 poster ONLY thats it"
    // This implies 1 successful generation.
    // We should check credits first.
    
    // Note: If we already generated successfully, we shouldn't charge again for viewing, 
    // but "Retry" generates a NEW image, so it should cost credit.
    // However, since they have 1 credit total, they can't retry.
    
    const hasCredits = await checkCredits();
    if (!hasCredits && !generatedImage) { // If already generated, we might be just viewing, but if generating new...
        // Wait, if we are here, we are trying to generate.
        setCreditsExhausted(true);
        return;
    }
    
    // Double check just in case state update lags
    if (!hasCredits) {
        setCreditsExhausted(true);
        return;
    }

    // Set deduplication lock
    isGeneratingRef.current = true;
    setLoading(true);
    setError(null);
    setIsSaved(false);

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
        // This saves one API call (vision model) when user tries multiple personas with the same photo
        console.log(cachedFaceDescription 
          ? "Using cached face description (saving 1 API call!)" 
          : "No cached face description, will generate new one"
        );
        
        const result = await generatePersonaImage(
          uploadedImage, 
          selectedPersona.prompt,
          cachedFaceDescription // Pass cached description if available
        );
        
        // Success! Deduct credit now.
        await deductCredit();
        
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
        } else {
            setError(errorMessage);
        }
        setLoading(false);
    } finally {
        // Always release the deduplication lock
        isGeneratingRef.current = false;
    }
  }, [uploadedImage, selectedPersona, checkCredits, deductCredit, cachedFaceDescription, setCachedFaceDescription]);

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
                    <p className="text-zinc-400 mb-8">You've used your free generation credit. We hope you enjoyed your poster!</p>
                    
                    <button 
                        onClick={handleCreditsExhaustedClose}
                        className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-zinc-200 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        )}

        {/* Full Screen Loading Overlay */}
        {loading && !waitingForKey && (
            <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center animate-fade-in">
                <div className="relative mb-12">
                    <div className="absolute inset-0 rounded-full blur-3xl bg-blue-600/20 animate-pulse"></div>
                    <div className="w-24 h-24 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin relative z-10"></div>
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white mb-3 animate-pulse">Creating Poster...</h2>
                <p className="text-zinc-500 font-medium">Casting you as {selectedPersona.name}</p>
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
            <div className="fixed bottom-0 left-0 right-0 md:static h-auto md:h-full w-full md:w-32 bg-[#09090b]/95 backdrop-blur-md border-t md:border-t-0 md:border-l border-zinc-800/50 flex flex-row md:flex-col items-center justify-evenly md:justify-center gap-2 md:gap-10 py-4 md:py-6 px-6 md:px-4 z-50 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] md:shadow-none safe-area-bottom">
                    <ActionButton 
                        label="Download" 
                        variant="primary"
                        onClick={handleDownload}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>}
                    />

                    <ActionButton 
                        label={isSaved ? "Saved" : "Save"} 
                        onClick={handleSave}
                        icon={isSaved 
                            ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        }
                    />

                    {/* Divider only on desktop */}
                    <div className="hidden md:block w-8 h-px bg-zinc-800 md:w-px md:h-8 my-2"></div>

                    <ActionButton 
                        label="Retry" 
                        onClick={() => generateImage(true)}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                    />

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
