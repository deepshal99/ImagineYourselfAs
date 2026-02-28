import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';
import Postey from './Postey';
import { ArrowLeft, Images, Settings, LogOut, Zap, Infinity } from 'lucide-react';

const Navigation: React.FC<{ title?: string, showBack?: boolean }> = ({ title, showBack = true }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { credits, isUnlimited, buyCredits } = useImageContext();
    const { user, loading, signInWithGoogle, signOut } = useAuth();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCreditMenuOpen, setIsCreditMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const creditMenuRef = useRef<HTMLDivElement>(null);

    const isHome = location.pathname === '/';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (creditMenuRef.current && !creditMenuRef.current.contains(event.target as Node)) {
                setIsCreditMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isAdmin = user?.email && (
        (import.meta.env.VITE_ADMIN_EMAILS || 'deepshal99@gmail.com')
            .split(',')
            .map((e: string) => e.trim().toLowerCase())
    ).includes(user.email.toLowerCase());

    return (
        <nav className="w-full px-6 py-4 sticky top-0 z-[100] bg-[var(--bg)]/80 backdrop-blur-xl border-b border-white/[0.06]">
            <div className="w-full flex justify-between items-center">

                {/* Left: Back Button & Title */}
                <div className="flex items-center gap-4">
                    {showBack && !isHome && (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl hover:bg-white/[0.06] text-[var(--text-secondary)] hover:text-white transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => navigate('/')}
                    >
                        <Postey size={24} mood="idle" className="group-hover:scale-110 transition-transform" />
                        <h1 className="text-xl font-bold text-white">
                            {title || "PosterMe"}
                        </h1>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 sm:gap-4">

                    {loading ? (
                        <div className="w-8 h-8 rounded-full border-2 border-white/[0.08] border-t-white/[0.2] animate-spin"></div>
                    ) : user ? (
                        <>
                            {/* Credits Dropdown */}
                            <div className="relative" ref={creditMenuRef}>
                                <button
                                    onClick={() => !isUnlimited && setIsCreditMenuOpen(!isCreditMenuOpen)}
                                    disabled={isUnlimited}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-95 ${isUnlimited || credits > 0
                                        ? 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.08] cursor-pointer'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 cursor-pointer animate-pulse'
                                        } ${isUnlimited ? 'cursor-default hover:bg-white/[0.04]' : ''}`}
                                    title={isUnlimited ? "Unlimited Plan" : "Buy Credits"}
                                >
                                    {isUnlimited ? (
                                        <Infinity size={14} className="text-amber-400" />
                                    ) : (
                                        <Zap size={14} />
                                    )}
                                    <span className="text-xs font-bold">
                                        {isUnlimited ? 'PRO' : credits}
                                    </span>
                                    {!isUnlimited && (
                                        <span className="text-[10px] ml-1 bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                                            Buy
                                        </span>
                                    )}
                                </button>

                                {/* Credit Dropdown Menu */}
                                {isCreditMenuOpen && !isUnlimited && (
                                    <div className="absolute right-0 top-full mt-3 w-72 z-50 animate-scale-up origin-top-right">
                                        <div className="bg-[var(--surface)] border border-white/[0.08] rounded-2xl shadow-2xl p-1 overflow-hidden">
                                            <div className="p-4 bg-white/[0.02] border-b border-white/[0.06] rounded-t-xl">
                                                <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider mb-1">Current Balance</p>
                                                <p className="text-2xl font-bold text-white flex items-center gap-2">
                                                    {credits} <span className="text-sm font-normal text-[var(--text-muted)]">Credits</span>
                                                </p>
                                            </div>

                                            <div className="p-4">
                                                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 relative overflow-hidden group hover:border-white/[0.1] transition-colors">
                                                    {/* Badge */}
                                                    <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-xl">
                                                        50% OFF
                                                    </div>

                                                    <div className="flex items-start gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                                                            <Zap size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-white text-sm">Starter Pack</h3>
                                                            <p className="text-xs text-[var(--text-secondary)]">5 High Quality Generations</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-end gap-2 mb-4">
                                                        <span className="text-2xl font-bold text-white">₹49</span>
                                                        <span className="text-sm text-[var(--text-muted)] line-through mb-1">₹99</span>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setIsCreditMenuOpen(false);
                                                            buyCredits();
                                                        }}
                                                        className="w-full bg-[var(--accent)] text-white font-bold py-2 rounded-xl text-sm hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Zap size={16} />
                                                        Buy Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile Dropdown Container */}
                            <div
                                className="relative h-full flex items-center"
                                ref={menuRef}
                            >
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 focus:outline-none py-2"
                                >
                                    <div className="relative">
                                        {user.user_metadata.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt="Avatar"
                                                className="w-9 h-9 rounded-full border-2 border-white/[0.08] hover:border-white/[0.15] transition-colors"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold border-2 border-white/[0.08]">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 z-50 animate-scale-up origin-top-right">
                                        <div className="bg-[var(--surface)] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
                                            <div className="p-4 border-b border-white/[0.06] bg-white/[0.02]">
                                                <p className="text-white font-medium truncate">{user.user_metadata.full_name || 'User'}</p>
                                                <p className="text-[var(--text-muted)] text-xs truncate">{user.email}</p>
                                            </div>

                                            <div className="p-2">
                                                <Link
                                                    to="/library"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
                                                >
                                                    <Images size={16} />
                                                    My Library
                                                </Link>

                                                {isAdmin && (
                                                    <Link
                                                        to="/admin"
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
                                                    >
                                                        <Settings size={16} />
                                                        Admin Dashboard
                                                    </Link>
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
                            onClick={() => signInWithGoogle()}
                            className="relative z-50 flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-zinc-200 transition-colors cursor-pointer active:scale-95"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
