import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { getFallbackCoverUrl } from '../constants';
import { PersonaCategory, Persona } from '../types';
import Navigation from '../components/Navigation';
import { fetchTrendingPersonas } from '../services/agentService';

const CATEGORIES: ("All" | PersonaCategory)[] = ["All", "Modern", "Futuristic", "Fantasy", "Historical", "Artistic", "Aesthetic"];

const PersonasPage: React.FC = () => {
  const navigate = useNavigate();
  // Use the dynamic personas list from context instead of static constant
  const { uploadedImage, selectedPersona, setSelectedPersona, personas, addPersonas } = useImageContext();
  const [selectedCategory, setSelectedCategory] = useState<"All" | PersonaCategory>("All");
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  useEffect(() => {
    if (!uploadedImage) {
      navigate('/');
    }
  }, [uploadedImage, navigate]);

  const handleAgentDiscover = async () => {
    setIsAgentLoading(true);
    const newTrends = await fetchTrendingPersonas(personas.length);
    if (newTrends.length > 0) {
      addPersonas(newTrends);
    }
    setIsAgentLoading(false);
  };

  if (!uploadedImage) return null;

  const filteredPersonas = selectedCategory === "All" 
    ? personas 
    : personas.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navigation title="Imagine Yourself As..." />
      
      <div className="w-full max-w-[1600px] mx-auto px-4 pb-20 pt-4">
         
         {/* Category Filter */}
         <div className="flex flex-col mb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap border
                            ${selectedCategory === cat 
                                ? 'bg-white text-zinc-900 border-white shadow-lg shadow-white/10' 
                                : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200 backdrop-blur-sm'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
          {filteredPersonas.map((persona) => (
            <PersonaCard 
              key={persona.id} 
              persona={persona} 
              isSelected={selectedPersona?.id === persona.id}
              onClick={() => {
                  setSelectedPersona(persona);
                  navigate('/result');
              }}
            />
          ))}
        </div>

        {/* AI Agent Trigger */}
        <div className="flex justify-center pb-12">
            <button 
                onClick={handleAgentDiscover}
                disabled={isAgentLoading}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-zinc-800 rounded-full hover:bg-zinc-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-600 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden shadow-2xl shadow-purple-500/20"
            >
                {isAgentLoading ? (
                    <span className="flex items-center gap-3">
                         <div className="w-5 h-5 border-2 border-zinc-400 border-t-white rounded-full animate-spin"></div>
                         AI Agent Searching Trends...
                    </span>
                ) : (
                    <span className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400 group-hover:animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Discover New Styles (AI)
                    </span>
                )}
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
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

    return (
        <div
            onClick={onClick}
            className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300 bg-zinc-900
              ${isSelected
                ? 'ring-2 ring-white scale-[0.98] shadow-2xl shadow-white/10'
                : 'hover:ring-1 hover:ring-zinc-600 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/50'
            }`}
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-800">
                <img
                    src={imgSrc}
                    alt={persona.name}
                    onLoad={() => setIsLoaded(true)}
                    // Fallback to generated URL if local asset missing (Crucial for AI-discovered personas)
                    onError={() => setImgSrc(getFallbackCoverUrl(persona.name, "cinematic style"))}
                    className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-110`}
                    loading="lazy"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-4">
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                        {persona.category}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight shadow-sm group-hover:text-zinc-100">
                        {persona.name}
                    </h3>
                </div>
            </div>
          </div>
    );
};

export default PersonasPage;