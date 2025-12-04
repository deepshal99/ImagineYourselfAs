import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';

import { Persona } from '../types';
import Navigation from '../components/Navigation';

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
                    <p className="text-zinc-400">Join PosterMe to generate unlimited AI posters with your own face.</p>
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

const UploadPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { uploadedImage, setUploadedImage, selectedPersona, setSelectedPersona, personas, setGeneratedImage } = useImageContext();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [isDragging, setIsDragging] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter personas based on category
    const filteredPersonas = activeCategory === 'All'
        ? personas
        : personas.filter(p => p.category === activeCategory);

    // Categories for the chips
    const categories = ['All', 'Movie', 'Series', 'YouTube', 'Other'];

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
        } else if (file) {
            // Optional: Toast error for invalid file type
            console.warn("Invalid file type dropped");
        }
    };

    const handleImagine = () => {
        if (!uploadedImage || !selectedPersona) return;

        if (!user) {
            setShowAuthModal(true);
            return;
        }

        setIsNavigating(true);
        navigate('/result');
    };

    return (
        <div className="flex flex-col w-full bg-[#09090b] min-h-screen md:h-screen md:overflow-hidden">
            <Navigation title="PosterMe" showBack={false} />

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

            <div className="flex-1 flex flex-col md:flex-row relative md:overflow-hidden">

                {/* LEFT PANE: Upload & Preview */}
                <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 bg-zinc-900/30 border-b md:border-b-0 md:border-r border-zinc-800/50 flex flex-col relative z-10 md:h-full md:overflow-y-auto">
                    <div className="p-6 md:p-8 flex flex-col h-full">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-white mb-2">1. Upload Headshot</h2>
                            <p className="text-zinc-400 text-sm">Choose a clear photo to star in your poster.</p>
                        </div>

                        <div className="flex-1 flex flex-col items-center">
                            {!uploadedImage ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`w-full aspect-[3/4] md:aspect-[3/4] max-w-[350px] md:max-w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden
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
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${isDragging ? 'bg-blue-500 scale-110' : 'bg-zinc-700 group-hover:scale-110'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${isDragging ? 'text-white' : 'text-zinc-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <p className={`text-lg font-medium ${isDragging ? 'text-blue-400' : 'text-zinc-200'}`}>
                                        {isDragging ? 'Drop Image Here' : 'Click or Drag to Upload'}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-2">Start your cinematic transformation</p>
                                </div>
                            ) : (
                                <div className="relative w-full aspect-[3/4] md:aspect-[3/4] max-w-[350px] md:max-w-full rounded-2xl overflow-hidden group shadow-2xl border border-zinc-700">
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
                    </div>
                </div>

                {/* RIGHT PANE: Persona Selection (Grid) */}
                <div className="flex-1 bg-[#09090b] relative md:h-full md:overflow-y-auto">
                    <div className="p-6 md:p-8 pb-32">
                        <div className="mb-6 sticky top-0 bg-[#09090b]/95 backdrop-blur-sm z-20 pt-2 border-b border-zinc-800/50">
                            <div className="flex flex-col gap-4 pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">2. Pick Your Poster</h2>
                                    <p className="text-zinc-400 text-sm">Select a movie, series, or style to star in.</p>
                                </div>

                                {/* Category Chips */}
                                <div className="flex gap-2 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide -mx-1">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${activeCategory === category
                                                ? 'bg-white text-black border-white shadow-lg shadow-white/10 scale-105 z-10'
                                                : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 hover:text-zinc-200'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                            {filteredPersonas.map((persona) => (
                                <PersonaCard
                                    key={persona.id}
                                    persona={persona}
                                    isSelected={selectedPersona?.id === persona.id}
                                    onClick={() => {
                                        if (selectedPersona?.id !== persona.id) {
                                            setSelectedPersona(persona);
                                            setGeneratedImage(null);
                                        }
                                    }}
                                />
                            ))}

                            {filteredPersonas.length === 0 && (
                                <div className="col-span-full py-12 text-center text-zinc-500">
                                    <p>No posters found in this category.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FLOATING ACTION BUTTON */}
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${uploadedImage && selectedPersona ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={handleImagine}
                        disabled={isNavigating}
                        className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-lg transition-all duration-200 bg-blue-600 text-white rounded-full hover:scale-105 hover:bg-blue-500 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] shadow-2xl ring-2 ring-white/10 disabled:opacity-80 disabled:scale-100 disabled:cursor-wait"
                    >
                        {isNavigating ? (
                            <span className="flex items-center gap-3">
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Starting...
                            </span>
                        ) : (
                            <span className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                                Create Poster
                            </span>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

const PersonaCard: React.FC<{
    persona: Persona,
    isSelected: boolean,
    onClick: () => void
}> = ({ persona, isSelected, onClick }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [imgSrc, setImgSrc] = useState(persona.cover);

    useEffect(() => {
        setImgSrc(persona.cover);
        setIsLoaded(false);
    }, [persona.cover]);

    return (
        <div
            onClick={onClick}
            className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300 bg-zinc-900
              ${isSelected
                    ? 'ring-4 ring-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.02] z-10'
                    : 'hover:ring-1 hover:ring-zinc-600 hover:scale-[1.02] hover:shadow-xl opacity-85 hover:opacity-100'
                }`}
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-800">
                {/* Improved Skeleton */}
                <div className={`absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-500 rounded-full animate-spin"></div>
                </div>

                <img
                    src={imgSrc}
                    alt={persona.name}
                    onLoad={() => setIsLoaded(true)}
                    onError={(e) => {
                        // Just hide the image or show a generic placeholder if needed
                        // For now, we just let it be broken or handle it via CSS/state if desired
                        // But user explicitly asked to REMOVE generation logic.
                        // We can set it to a transparent pixel or a static placeholder if we had one.
                        // Let's just log it and maybe set isLoaded to true so the spinner stops?
                        console.warn("Failed to load cover for", persona.name);
                        setIsLoaded(true);
                    }}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out
                        ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} 
                        group-hover:scale-110 saturate-[0.8] group-hover:saturate-100`}
                    loading="lazy"
                    decoding="async"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex flex-col justify-end p-4">
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest mb-1 opacity-100">
                        {persona.category}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight shadow-sm">
                        {persona.name}
                    </h3>
                </div>

                {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-short">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadPage;
