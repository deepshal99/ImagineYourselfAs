import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC<{ title?: string, showBack?: boolean }> = ({ title, showBack = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { credits, isUnlimited } = useImageContext();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHome = location.pathname === '/';
  
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

  // Check if user is admin
  const isAdmin = user?.email && (
    (import.meta.env.VITE_ADMIN_EMAILS || 'deepshal99@gmail.com')
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
  ).includes(user.email.toLowerCase());

  return (
    <nav className="w-full px-6 py-4 sticky top-0 z-[100] bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/50">
      <div className="w-full flex justify-between items-center">
        
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-4">
          {showBack && !isHome && (
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <h1 
            className="text-xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent cursor-pointer" 
            onClick={() => navigate('/')}
          >
            {title || "PosterMe"}
          </h1>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {loading ? (
             <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-zinc-500 animate-spin"></div>
          ) : user ? (
            <>
                {/* Credits Display */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                    isUnlimited || credits > 0 
                        ? 'bg-zinc-800/50 border-zinc-700 text-zinc-300' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                    {isUnlimited ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 12c-2-2.67-6-2.67-8 0a4 4 0 1 0 0 8c2 2.67 6 2.67 8 0a4 4 0 1 0 0-8Z"/>
                            <path d="M12 12c2-2.67 6-2.67 8 0a4 4 0 1 1 0 8c-2 2.67-6 2.67-8 0a4 4 0 1 1 0-8Z"/>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                        </svg>
                    )}
                    <span className="text-xs font-bold">
                        {isUnlimited ? 'PRO' : credits}
                    </span>
                </div>

                {/* Profile Dropdown Container */}
                <div 
                  className="relative h-full flex items-center"
                  ref={menuRef}
                >
                  {/* Profile Trigger Button (Click Only) */}
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 focus:outline-none py-2"
                  >
                    <div className="relative">
                        {user.user_metadata.avatar_url ? (
                            <img 
                                src={user.user_metadata.avatar_url} 
                                alt="Avatar" 
                                className="w-9 h-9 rounded-full border border-zinc-700 hover:border-zinc-500 transition-colors"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border border-zinc-700">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 z-50 animate-scale-up origin-top-right">
                        <div className="bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                            {/* User Info Header */}
                            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                                <p className="text-white font-medium truncate">{user.user_metadata.full_name || 'User'}</p>
                                <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2">
                                <Link 
                                    to="/library" 
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    My Library
                                </Link>
                                
                                {isAdmin && (
                                    <Link 
                                        to="/admin" 
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Admin Dashboard
                                    </Link>
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