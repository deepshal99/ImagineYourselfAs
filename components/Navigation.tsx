import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthButton from './AuthButton';
import { useImageContext } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC<{ title?: string, showBack?: boolean }> = ({ title, showBack = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { credits, isUnlimited, buyCredits } = useImageContext();
  const { user, loading } = useAuth();

  const isHome = location.pathname === '/';

  return (
    <nav className="w-full flex justify-between items-center px-6 py-4 sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/50">
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
        <h1 className="text-xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent cursor-pointer" onClick={() => navigate('/')}>
          {title || "PosterMe"}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Credits Display */}
        {!loading && user ? (
            <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isUnlimited || credits > 0 ? 'bg-zinc-800/50 border-zinc-700 text-zinc-300' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {isUnlimited ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 12c-2-2.67-6-2.67-8 0a4 4 0 1 0 0 8c2 2.67 6 2.67 8 0a4 4 0 1 0 0-8Z"/>
                            <path d="M12 12c2-2.67 6-2.67 8 0a4 4 0 1 1 0 8c-2 2.67-6 2.67-8 0a4 4 0 1 1 0-8Z"/>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                        </svg>
                    )}
                    <span className="text-sm font-medium">
                        {isUnlimited ? 'Unlimited' : `${credits} Credit${credits !== 1 ? 's' : ''}`}
                    </span>
                </div>
                
                {!isUnlimited && (
                    {/* Temporarily hidden as per request */}
                    /* <button
                        onClick={buyCredits}
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-600/10 border border-green-600/20 text-green-400 hover:bg-green-600/20 transition-colors text-sm font-medium"
                    >
                        <span>Buy 5 for ₹49</span>
                    </button> */
                )}
            </div>
        ) : !loading && (
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <span className="text-xs font-bold">1 Free Credit</span>
            </div>
        )}

        <Link 
            to="/library" 
            className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 hidden sm:block
            ${location.pathname === '/library' 
                ? 'bg-zinc-800 text-white' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
        >
            My Library
        </Link>
        <AuthButton />
      </div>
    </nav>
  );
};

export default Navigation;