import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';

import PersonaCard from '../components/PersonaCard';
import MetaHead from '../components/MetaHead';
import CreditsModal from '../components/CreditsModal';
import AuthModal from '../components/AuthModal';

import Postey from '../components/Postey';
import { ArrowLeft, Upload, Trash2, RefreshCw, Check, Zap, Share2, Infinity, Images, Settings, LogOut } from 'lucide-react';

const PersonaPage: React.FC = () => {
    const { personaId } = useParams<{ personaId: string }>();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const {
        uploadedImage, setUploadedImage,
        setSelectedPersona,
        personas, setGeneratedImage,
        personasLoaded,
        credits, isUnlimited, buyCredits
    } = useImageContext();

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCreditsModal, setShowCreditsModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const handleShare = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (err) {
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

    const persona = personas.find(p => p.id === personaId);

    useEffect(() => {
        if (personasLoaded && !persona) {
            navigate('/', { replace: true });
        }
    }, [persona, personasLoaded, navigate]);

    useEffect(() => {
        const handleRestore = (e: CustomEvent) => {
            const { uploadedImage: restoredImage, personaId: restoredId } = e.detail;
            if (restoredId === personaId && restoredImage) {
                setUploadedImage(restoredImage);
            }
        };

        window.addEventListener('restore-generation-state', handleRestore as EventListener);
        return () => window.removeEventListener('restore-generation-state', handleRestore as EventListener);
    }, [personaId, setUploadedImage]);

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
            localStorage.setItem('posterme_pending_generation', JSON.stringify({
                uploadedImage,
                personaId: persona.id,
                timestamp: Date.now()
            }));
            setShowAuthModal(true);
            return;
        }

        setSelectedPersona(persona);
        setIsNavigating(true);
        navigate('/result');
    };

    if (!personasLoaded) {
        return (
            <div className="min-h-screen w-full bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
                <Postey size={56} mood="directing" />
                <p className="text-[var(--text-muted)] text-sm font-medium">Loading...</p>
            </div>
        );
    }

    if (!persona) {
        return null;
    }

    const isValorant = persona.name.toLowerCase().includes('valorant');
    const headerTitle = isValorant ? "Become a Valorant Agent" : `Star in ${persona.name}`;
    const headerDescription = "Upload a clear selfie to generate your unique poster.";

    return (
        <div className="flex flex-col w-full bg-[var(--bg)] min-h-screen">
            <MetaHead
                title={`${persona.name} Movie Poster - Starring You | PosterMe`}
                description={`See yourself cast as ${persona.name}. Create this official-style movie poster instantly with PosterMe AI.`}
                image={persona.cover}
                url={`https://posterme.app/persona/${persona.id}`}
            />
            {/* Floating Top-Left: Back + Title */}
            <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
                <button
                    onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
                    className="p-2.5 rounded-xl bg-[var(--surface)]/80 backdrop-blur-xl hover:bg-white/[0.08] text-[var(--text-secondary)] hover:text-white transition-colors border border-white/[0.06]"
                    aria-label="Go back"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-white bg-[var(--surface)]/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/[0.06] truncate max-w-[200px] md:max-w-xs">
                    {persona.name}
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

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
            {showCreditsModal && <CreditsModal onClose={() => setShowCreditsModal(false)} />}

            <div className="flex-1 flex flex-col md:flex-row-reverse relative md:min-h-screen pt-16 md:pt-0">

                {/* PANE 1: Upload Area & Header */}
                <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 md:p-6 md:pt-20 border-b border-white/[0.06] md:border-b-0">

                    <div className="mb-6 md:mb-8 text-center px-4 animate-fade-in w-full max-w-md mx-auto mt-4 md:mt-0">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-white mb-2 md:mb-3 leading-snug md:leading-tight">
                            {headerTitle}
                        </h1>
                        <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed text-balance">
                            {headerDescription}
                        </p>
                    </div>

                    <div className="w-full max-w-sm">
                        {!uploadedImage ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`w-full aspect-[3/4] max-h-[50vh] md:max-h-[55vh] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden
                                    ${isDragging
                                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] scale-105 shadow-xl'
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
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform ${isDragging ? 'bg-[var(--accent)] scale-110' : 'bg-white/[0.06] group-hover:scale-110'}`}>
                                    <Upload size={24} className={`${isDragging ? 'text-white' : 'text-zinc-300'}`} />
                                </div>
                                <p className={`text-base font-medium ${isDragging ? 'text-[var(--accent)]' : 'text-zinc-200'}`}>
                                    {isDragging ? 'Drop Image Here' : 'Click or Drag to Upload'}
                                </p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Start your creation</p>
                            </div>
                        ) : (
                            <div className="relative w-full aspect-[3/4] max-h-[50vh] md:max-h-[55vh] rounded-2xl overflow-hidden group shadow-2xl border border-white/[0.08]">
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
                                        <Trash2 size={16} />
                                        Remove
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg"
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
                            </div>
                        )}
                    </div>

                </div>

                {/* FLOATING ACTION BUTTON */}
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${uploadedImage ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={handleCreate}
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

                {/* PANE 2: Visuals (Poster & Share) */}
                <div className="w-full md:w-1/2 flex-shrink-0 bg-white/[0.02] md:border-r border-white/[0.06] flex flex-col justify-center">
                    <div className="p-4 md:p-6 flex flex-col items-center justify-center">

                        <div className="relative w-full max-w-sm md:max-h-full md:flex md:flex-col md:justify-center">
                            {/* Persona Cover */}
                            <div className="relative aspect-[2/3] w-full max-h-[45vh] md:max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08] mx-auto">
                                <img
                                    src={persona.cover}
                                    alt={persona.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                                    <span className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-widest mb-1 block">
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
                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06] hover:border-white/[0.1] hover:text-white'
                                    }`}
                            >
                                {linkCopied ? (
                                    <>
                                        <Check size={16} />
                                        Link Copied!
                                    </>
                                ) : (
                                    <>
                                        <Share2 size={16} />
                                        Share This Poster
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trending Personas Section */}
            <div className="w-full bg-[var(--bg)] border-t border-white/[0.06] py-12 px-6 md:px-12 z-10 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Trending Now</h2>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors flex items-center gap-1 group"
                        >
                            View All <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {personas
                            .filter(p => p.id !== persona.id)
                            .sort(() => 0.5 - Math.random())
                            .slice(0, 5)
                            .map(p => (
                                <PersonaCard
                                    key={p.id}
                                    persona={p}
                                    onClick={() => {
                                        navigate(`/persona/${p.id}`);
                                        window.scrollTo(0, 0);
                                    }}
                                />
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonaPage;
