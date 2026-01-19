import React, { useState, useEffect } from 'react';
import { Persona } from '../types';

// Generate a fallback placeholder for personas without covers
const getFallbackCoverUrl = (personaId: string): string => {
    // Use a data URI with a gradient placeholder
    const colors = [
        ['#1e3a5f', '#0f172a'], // blue
        ['#3f1e5f', '#1a0f2a'], // purple
        ['#1e5f3a', '#0a2f1a'], // green
        ['#5f3a1e', '#2a1a0f'], // brown
        ['#5f1e3a', '#2a0f1a'], // red
    ];
    const colorIndex = personaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const [color1, color2] = colors[colorIndex];

    // Create SVG placeholder
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1}"/>
            <stop offset="100%" style="stop-color:${color2}"/>
        </linearGradient></defs>
        <rect fill="url(#g)" width="200" height="300"/>
        <text x="100" y="150" text-anchor="middle" fill="#ffffff40" font-size="40">🎬</text>
    </svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

interface PersonaCardProps {
    persona: Persona;
    isSelected?: boolean;
    onClick: () => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, isSelected = false, onClick }) => {
    // Use gradient fallback as default to avoid 404 on deleted static covers
    // Database covers will load via onLoad, static covers are gone
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

                {/* Open in New Tab Button - appears on hover */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/persona/${persona.id}`, '_blank');
                    }}
                    className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-300 z-20 bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100 hover:scale-110"
                    title="Open in new tab"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                </button>

                {/* Selected checkmark */}
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

export default PersonaCard;
