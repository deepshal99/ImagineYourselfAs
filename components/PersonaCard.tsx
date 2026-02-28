import React, { useState, useEffect } from 'react';
import { Persona } from '../types';
import { ExternalLink, Check } from 'lucide-react';

// Generate a fallback placeholder for personas without covers
const getFallbackCoverUrl = (personaId: string): string => {
    const colors = [
        ['#1e3a5f', '#0f172a'],
        ['#3f1e5f', '#1a0f2a'],
        ['#1e5f3a', '#0a2f1a'],
        ['#5f3a1e', '#2a1a0f'],
        ['#5f1e3a', '#2a0f1a'],
    ];
    const colorIndex = personaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const [color1, color2] = colors[colorIndex];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1}"/>
            <stop offset="100%" style="stop-color:${color2}"/>
        </linearGradient></defs>
        <rect fill="url(#g)" width="200" height="300"/>
    </svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

interface PersonaCardProps {
    persona: Persona;
    isSelected?: boolean;
    onClick: () => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, isSelected = false, onClick }) => {
    const [imgSrc, setImgSrc] = useState<string>(
        persona.cover || getFallbackCoverUrl(persona.id)
    );
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        setImgSrc(persona.cover || getFallbackCoverUrl(persona.id));
        setIsLoaded(false);
    }, [persona.cover, persona.id]);

    return (
        <div
            onClick={onClick}
            className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 bg-[var(--surface)]
              ${isSelected
                    ? 'ring-[3px] ring-[var(--accent)] shadow-2xl shadow-[var(--accent)]/10 scale-[1.02] z-10'
                    : 'hover:ring-1 hover:ring-white/[0.1] hover:scale-[1.02] hover:shadow-xl opacity-90 hover:opacity-100'
                }`}
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-800/50">
                {/* Skeleton */}
                <div className={`absolute inset-0 bg-zinc-800/50 animate-pulse flex items-center justify-center transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="w-8 h-8 border-2 border-white/[0.08] border-t-white/[0.2] rounded-full animate-spin"></div>
                </div>

                <img
                    src={imgSrc}
                    alt={persona.name}
                    onLoad={() => setIsLoaded(true)}
                    onError={(e) => {
                        console.warn("Failed to load cover for", persona.name);
                        setIsLoaded(true);
                    }}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out
                        ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                        group-hover:scale-110 saturate-[0.85] group-hover:saturate-100`}
                    loading="lazy"
                    decoding="async"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex flex-col justify-end p-4">
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-widest mb-1 opacity-100">
                        {persona.category}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight">
                        {persona.name}
                    </h3>
                </div>

                {/* Open in New Tab Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/persona/${persona.id}`, '_blank');
                    }}
                    className="absolute top-3 left-3 w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 z-20 bg-black/50 backdrop-blur-sm hover:bg-black/70 opacity-0 group-hover:opacity-100 hover:scale-110 border border-white/[0.1]"
                    title="Open in new tab"
                >
                    <ExternalLink size={14} className="text-white" />
                </button>

                {/* Selected checkmark */}
                {isSelected && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/30 animate-bounce-short">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <defs>
                                <linearGradient id="check-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#e8834a" />
                                    <stop offset="50%" stopColor="#c45a9a" />
                                    <stop offset="100%" stopColor="#8b6cc7" />
                                </linearGradient>
                            </defs>
                            <polyline points="20 6 9 17 4 12" stroke="url(#check-grad)" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonaCard;
