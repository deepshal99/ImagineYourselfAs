import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';

import { Persona } from '../types';
import Navigation from '../components/Navigation';
import PersonaCard from '../components/PersonaCard';
import MetaHead from '../components/MetaHead';
import CreditsModal from '../components/CreditsModal';
import AuthModal from '../components/AuthModal';

import Postey from '../components/Postey';
import { Upload, Trash2, RefreshCw, Check, Zap, Infinity, Images, Settings, LogOut } from 'lucide-react';

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
            console.warn("Invalid file type dropped");
        }
    };

    const handleImagine = () => {
        if (!uploadedImage || !selectedPersona) return;

        if (!user) {
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
        <div className="flex flex-col w-full bg-[var(--bg)] min-h-screen md:h-screen md:overflow-hidden">
            <MetaHead />

            {/* Floating Top-Left: Logo/Brand */}
            <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[var(--surface)]/80 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/[0.06] group cursor-pointer" onClick={() => navigate('/')}>
                    <Postey size={24} mood="idle" className="group-hover:scale-110 transition-transform" />
                    <h1 className="text-lg font-bold text-white">PosterMe</h1>
                </div>
            </div>

            {/* Floating Top-Right: Credits + User */}
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                {user ? (
                    <>
                        {/* Credits Button */}
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

                        {/* User Avatar with Dropdown */}
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

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 z-50 animate-scale-up origin-top-right">
                                    <div className="bg-[var(--surface)] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
                                        <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
                                            <p className="text-white font-medium truncate">{user.user_metadata?.full_name || 'User'}</p>
                                            <p className="text-[var(--text-muted)] text-xs truncate">{user.email}</p>
                                        </div>

                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    navigate('/library');
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left"
                                            >
                                                <Images size={16} />
                                                My Library
                                            </button>

                                            {isAdmin && (
                                                <button
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        navigate('/admin');
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors text-left"
                                                >
                                                    <Settings size={16} />
                                                    Admin Dashboard
                                                </button>
                                            )}

                                            <div className="h-px bg-white/[0.06] my-2"></div>

                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    signOut();
                                                }}
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
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
            {showCreditsModal && <CreditsModal onClose={() => setShowCreditsModal(false)} />}

            <div className="flex-1 flex flex-col md:flex-row relative md:overflow-hidden pt-16 md:pt-0">

                {/* LEFT PANE: Hero + Upload */}
                <div className="w-full md:w-[420px] lg:w-[480px] flex-shrink-0 bg-white/[0.02] border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col relative z-10 md:h-full md:overflow-y-auto">
                    <div className="p-6 pt-4 md:p-8 md:pt-20 lg:p-10 lg:pt-20 flex flex-col h-full justify-center">

                        {/* Hero Text */}
                        <div className="mt-12 mb-4 md:mb-8 text-center md:text-left">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                                Star in Your Favorite Movie or Show
                            </h2>
                            <p className="text-[var(--text-secondary)] text-sm md:text-md leading-relaxed">
                                Upload a selfie, pick a poster, become the star.
                            </p>
                        </div>

                        {/* Upload Area */}
                        <div className="flex-1 flex flex-col items-center max-w-sm mx-auto md:mx-0 md:max-w-full">
                            {!uploadedImage ? (
                                <div className="relative w-full">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`w-full aspect-[3/4] max-h-[50vh] md:max-h-[55vh] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden
                                    ${isDragging
                                                ? 'border-[var(--accent)] bg-[var(--accent-soft)] scale-[1.02] shadow-xl'
                                                : 'border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.15]'
                                            }`}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${isDragging ? 'bg-[var(--accent)] scale-110' : 'bg-white/[0.06] group-hover:scale-110 group-hover:bg-white/[0.08]'}`}>
                                            <Upload size={28} className={`transition-colors ${isDragging ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-zinc-200'}`} />
                                        </div>
                                        <p className={`text-lg font-semibold transition-colors ${isDragging ? 'text-[var(--accent)]' : 'text-zinc-200'}`}>
                                            {isDragging ? 'Drop Image Here' : 'Upload Your Photo'}
                                        </p>
                                        <p className="text-sm text-[var(--text-muted)] mt-2">Click or drag to start</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full aspect-[3/4] max-h-[50vh] md:max-h-[55vh] rounded-2xl overflow-hidden group shadow-2xl border border-white/[0.08]">
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
                                            <Trash2 size={16} />
                                            Remove
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg"
                                        >
                                            <RefreshCw size={16} />
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
                                    <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                        <Check size={18} className="text-[var(--accent)]" strokeWidth={3} />
                                    </div>
                                </div>
                            )}

                            {/* Step indicator */}
                            <div className="mt-6 flex items-center gap-3 text-sm">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${uploadedImage ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-white/[0.04] text-[var(--text-secondary)]'}`}>
                                    <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">1</span>
                                    Photo
                                </div>
                                <div className="w-6 h-px bg-white/[0.1]"></div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${selectedPersona ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-white/[0.04] text-[var(--text-secondary)]'}`}>
                                    <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">2</span>
                                    Poster
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANE: Persona Selection (Grid) */}
                <div className="flex-1 bg-[var(--bg)] relative md:h-full md:overflow-y-auto">
                    <div className="p-6 md:p-8 pb-32 md:pt-20">
                        {/* Sticky Header */}
                        <div className="mb-6 sticky top-0 bg-[var(--bg)]/95 backdrop-blur-xl z-20 -mx-6 md:-mx-8 px-6 md:px-8 border-b border-white/[0.06]">
                            <div className="flex flex-col gap-4 py-4">
                                {/* Title + View All */}
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-white">Pick Your Poster</h2>
                                    <span className="text-sm text-[var(--text-muted)]">{filteredPersonas.length} posters</span>
                                </div>

                                {/* Category Chips */}
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setActiveCategory(category)}
                                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${activeCategory === category
                                                ? 'bg-white text-black shadow-lg'
                                                : 'bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.08] hover:text-white'
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
                                <>
                                    <div className="col-span-full flex flex-col items-center justify-center py-8">
                                        <Postey size={56} mood="directing" />
                                        <p className="text-[var(--text-muted)] text-sm font-medium mt-3">Finding your perfect posters...</p>
                                    </div>
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className="rounded-2xl overflow-hidden bg-[var(--surface)] animate-pulse">
                                            <div className="aspect-[2/3] w-full bg-zinc-800/50 relative">
                                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                                    <div className="h-2 w-12 bg-zinc-700 rounded mb-2"></div>
                                                    <div className="h-4 w-24 bg-zinc-700 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* FLOATING ACTION BUTTON */}
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${uploadedImage && selectedPersona ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={handleImagine}
                        disabled={isNavigating}
                        className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-lg transition-all duration-300 rounded-full hover:scale-105 shadow-2xl disabled:opacity-80 disabled:scale-100 disabled:cursor-wait whitespace-nowrap fab-gradient"
                    >
                        {isNavigating ? (
                            <span className="flex items-center gap-3">
                                <Postey size={26} mood="directing" dark />
                                Starting...
                            </span>
                        ) : (
                            <span className="flex items-center gap-3">
                                <Postey size={26} mood="idle" dark />
                                Create Poster
                            </span>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};



export default UploadPage;
