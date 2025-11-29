import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const Navigation: React.FC<{ title?: string, showBack?: boolean }> = ({ title, showBack = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
        <h1 className="text-xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          {title || "PersonaGen"}
        </h1>
      </div>
      
      <Link 
        to="/library" 
        className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200
          ${location.pathname === '/library' 
            ? 'bg-zinc-800 text-white' 
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
      >
        My Library
      </Link>
    </nav>
  );
};

export default Navigation;