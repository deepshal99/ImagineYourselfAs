import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';

import { Persona } from '../types';
import Navigation from '../components/Navigation';
import PersonaCard from '../components/PersonaCard';
import MetaHead from '../components/MetaHead';
import CreditsModal from '../components/CreditsModal';

// Generate a fallback placeholder for personas without covers


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
    const { user, signOut } = useAuth();
    const {
        uploadedImage, setUploadedImage,
        selectedPersona, setSelectedPersona,
        personas, setGeneratedImage,
        credits, isUnlimited, buyCredits
    } = useImageContext();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [isDragging, setIsDragging] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
            // CRITICAL FIX: Preserve guest state before auth
            // Save to localStorage (not sessionStorage) so it survives OAuth page redirect
            localStorage.setItem('posterme_pending_generation', JSON.stringify({
                uploadedImage,
                personaId: selectedPersona.id,
                timestamp: Date.now()
            }));

            setShowAuthModal(true);
            return;
        }

        setIsNavigating(true);
        navigate('/result');
    };

    return (
        <div className="flex flex-col w-full bg-[#09090b] min-h-screen md:h-screen md:overflow-hidden">
            <MetaHead />

            {/* Floating Top-Left: Logo/Brand */}
            <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
                <h1 className="text-lg font-bold text-white bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800/50 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    PosterMe
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
                                    {/* User Info Header */}
                                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                                        <p className="text-white font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                                        <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                navigate('/library');
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-left"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            My Library
                                        </button>

                                        {isAdmin && (
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    navigate('/admin');
                                                }}
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
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                signOut();
                                            }}
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

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
            {showCreditsModal && <CreditsModal onClose={() => setShowCreditsModal(false)} />}

            <div className="flex-1 flex flex-col md:flex-row relative md:overflow-hidden pt-16 md:pt-0">

                {/* LEFT PANE: Hero + Upload */}
                <div className="w-full md:w-[420px] lg:w-[480px] flex-shrink-0 bg-gradient-to-b from-zinc-900/50 to-transparent md:bg-zinc-900/30 border-b md:border-b-0 md:border-r border-zinc-800/50 flex flex-col relative z-10 md:h-full md:overflow-y-auto">
                    <div className="p-6 pt-4 md:p-8 md:pt-20 lg:p-10 lg:pt-20 flex flex-col h-full justify-center">

                        {/* Hero Text */}
                        <div className="mb-8 md:mb-10 text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
                                Star in Your<br />
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Favorite Movie
                                </span>
                            </h2>
                            <p className="text-zinc-400 text-base md:text-lg">
                                Upload a selfie, pick a poster, become the star.
                            </p>
                        </div>

                        {/* Upload Area */}
                        <div className="flex-1 flex flex-col items-center max-w-sm mx-auto md:mx-0 md:max-w-full">
                            {!uploadedImage ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`w-full aspect-[3/4] max-h-[50vh] md:max-h-[55vh] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden
                                ${isDragging
                                            ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-xl shadow-blue-500/10'
                                            : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800/50 hover:border-zinc-500'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${isDragging ? 'bg-blue-500 scale-110' : 'bg-zinc-700/50 group-hover:scale-110 group-hover:bg-zinc-700'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-colors ${isDragging ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <p className={`text-lg font-semibold transition-colors ${isDragging ? 'text-blue-400' : 'text-zinc-200'}`}>
                                        {isDragging ? 'Drop Image Here' : 'Upload Your Photo'}
                                    </p>
                                    <p className="text-sm text-zinc-500 mt-2">Click or drag to start</p>
                                </div>
                            ) : (
                                <div className="relative w-full aspect-[3/4] max-h-[50vh] md:max-h-[55vh] rounded-2xl overflow-hidden group shadow-2xl border border-zinc-700/50">
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                        <button
                                            onClick={handleClearImage}
                                            className="px-5 py-2.5 bg-red-500/90 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 backdrop-blur-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Remove
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg"
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

                                    {/* Success indicator */}
                                    <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Step indicator */}
                            <div className="mt-6 flex items-center gap-3 text-sm">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${uploadedImage ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                    <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">1</span>
                                    Photo
                                </div>
                                <div className="w-6 h-px bg-zinc-700"></div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${selectedPersona ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                    <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">2</span>
                                    Poster
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE: Persona Selection (Grid) */}
                <div className="flex-1 bg-[#09090b] relative md:h-full md:overflow-y-auto">
                    <div className="p-6 md:p-8 pb-32 md:pt-20">
                        {/* Sticky Header */}
                        <div className="mb-6 sticky top-0 bg-[#09090b]/95 backdrop-blur-xl z-20 -mx-6 md:-mx-8 px-6 md:px-8 border-b border-zinc-800/50">
                            <div className="flex flex-col gap-4 py-4">
                                {/* Title + View All */}
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-white">Pick Your Poster</h2>
                                    <span className="text-sm text-zinc-500">{filteredPersonas.length} posters</span>
                                </div>

                                {/* Category Chips */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${activeCategory === category
                                                ? 'bg-white text-black shadow-lg'
                                                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                            {filteredPersonas.length > 0 ? (
                                filteredPersonas.map((persona) => (
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
                                ))
                            ) : (
                                // Skeleton loaders (fallback, should rarely show)
                                [...Array(10)].map((_, i) => (
                                    <div key={i} className="rounded-xl overflow-hidden bg-zinc-900 animate-pulse">
                                        <div className="aspect-[2/3] w-full bg-zinc-800 relative">
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <div className="h-2 w-12 bg-zinc-700 rounded mb-2"></div>
                                                <div className="h-4 w-24 bg-zinc-700 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* FLOATING ACTION BUTTON */}
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${uploadedImage && selectedPersona ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={handleImagine}
                        disabled={isNavigating}
                        className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-lg transition-all duration-200 bg-blue-600 text-white rounded-full hover:scale-105 hover:bg-blue-500 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] shadow-2xl ring-2 ring-white/10 disabled:opacity-80 disabled:scale-100 disabled:cursor-wait whitespace-nowrap"
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
            {/* Test Trigger Removed */}
        </div>
    );
};



export default UploadPage;
