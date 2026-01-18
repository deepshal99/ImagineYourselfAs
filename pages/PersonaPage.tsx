import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';

// AuthModal component for sign-in prompt
const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Sign in to Create</h2>
                    <p className="text-zinc-400">Join PosterMe to generate AI posters with your own face.</p>
                </div>

                <button
                    onClick={() => signInWithGoogle()}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>
            </div>
        </div>
    );
};

const PersonaPage: React.FC = () => {
    const { personaId } = useParams<{ personaId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        uploadedImage, setUploadedImage,
        setSelectedPersona,
        personas, setGeneratedImage,
        personasLoaded
    } = useImageContext();

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle share link copy
    const handleShare = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    // Find the persona from the URL param
    const persona = personas.find(p => p.id === personaId);

    // Handle 404 - persona not found (only check after personas finished loading)
    useEffect(() => {
        if (personasLoaded && !persona) {
            // Personas loaded but this one doesn't exist
            navigate('/', { replace: true });
        }
    }, [persona, personasLoaded, navigate]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setGeneratedImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setUploadedImage(null);
        setGeneratedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setGeneratedImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = () => {
        if (!uploadedImage || !persona) return;

        if (!user) {
            // Save state for after sign-in
            localStorage.setItem('posterme_pending_generation', JSON.stringify({
                uploadedImage,
                personaId: persona.id,
                timestamp: Date.now()
            }));
            setShowAuthModal(true);
            return;
        }

        // Set persona in context and navigate to result
        setSelectedPersona(persona);
        setIsNavigating(true);
        navigate('/result');
    };

    // Loading state while personas are being fetched
    if (!personasLoaded) {
        return (
            <div className="min-h-screen w-full bg-[#09090b] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Persona not found (will redirect via useEffect)
    if (!persona) {
        return null;
    }

    return (
        <div className="flex flex-col w-full bg-[#09090b] min-h-screen md:h-screen md:overflow-hidden">
            <Navigation title={persona.name} />

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

            <div className="flex-1 flex flex-col md:flex-row relative md:overflow-hidden">

                {/* LEFT PANE: Persona Cover */}
                <div className="w-full md:w-1/2 flex-shrink-0 bg-zinc-900/30 border-b md:border-b-0 md:border-r border-zinc-800/50 flex flex-col md:h-full md:overflow-hidden">
                    <div className="p-4 md:p-6 flex flex-col flex-1 items-center justify-center md:overflow-hidden">
                        <div className="relative w-full max-w-sm md:max-h-full md:flex md:flex-col md:justify-center">
                            {/* Persona Cover - constrained height on desktop */}
                            <div className="relative aspect-[2/3] w-full max-h-[60vh] rounded-2xl overflow-hidden shadow-2xl border border-zinc-700/50">
                                <img
                                    src={persona.cover}
                                    alt={persona.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mb-1 block">
                                        {persona.category}
                                    </span>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                        {persona.name}
                                    </h1>
                                </div>
                            </div>

                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition-all duration-200 text-sm
                                    ${linkCopied
                                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white'
                                    }`}
                            >
                                {linkCopied ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Link Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                        </svg>
                                        Share This Poster
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE: Upload Area */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 md:p-6 md:h-full md:overflow-hidden">
                    <div className="mb-4 text-center">
                        <h2 className="text-lg md:text-xl font-bold text-white mb-1">Upload Your Photo</h2>
                        <p className="text-zinc-400 text-sm">Choose a clear headshot to star in this poster</p>
                    </div>

                    <div className="w-full max-w-sm">
                        {!uploadedImage ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`w-full aspect-[3/4] max-h-[55vh] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden
                                    ${isDragging
                                        ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-xl'
                                        : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-500'
                                    }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform ${isDragging ? 'bg-blue-500 scale-110' : 'bg-zinc-700 group-hover:scale-110'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 ${isDragging ? 'text-white' : 'text-zinc-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                                <p className={`text-base font-medium ${isDragging ? 'text-blue-400' : 'text-zinc-200'}`}>
                                    {isDragging ? 'Drop Image Here' : 'Click or Drag to Upload'}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">Start your transformation</p>
                            </div>
                        ) : (
                            <div className="relative w-full aspect-[3/4] max-h-[55vh] rounded-2xl overflow-hidden group shadow-2xl border border-zinc-700">
                                <img
                                    src={uploadedImage}
                                    alt="Uploaded"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                    <button
                                        onClick={handleClearImage}
                                        className="px-4 py-2 bg-red-500/90 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 backdrop-blur-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Remove
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                        </svg>
                                        Change Photo
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Create Button - appears after photo upload */}
                    <div className={`mt-6 transition-all duration-500 ${uploadedImage ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
                        <button
                            onClick={handleCreate}
                            disabled={isNavigating}
                            className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-base transition-all duration-200 bg-blue-600 text-white rounded-full hover:scale-105 hover:bg-blue-500 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] shadow-2xl ring-2 ring-white/10 disabled:opacity-80 disabled:scale-100 disabled:cursor-wait"
                        >
                            {isNavigating ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Starting...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                    </svg>
                                    Create Poster
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonaPage;
