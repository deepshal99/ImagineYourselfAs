import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { getFallbackCoverUrl } from '../constants';
import { Persona } from '../types';
import Navigation from '../components/Navigation';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { uploadedImage, setUploadedImage, selectedPersona, setSelectedPersona, personas } = useImageContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImagine = () => {
    if (uploadedImage && selectedPersona) {
      navigate('/result');
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#09090b] min-h-screen md:h-screen md:overflow-hidden">
      <Navigation title="PosterMe" showBack={false} />

      <div className="flex-1 flex flex-col md:flex-row relative md:overflow-hidden">
        
        {/* LEFT PANE: Upload & Preview */}
        <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 bg-zinc-900/30 border-b md:border-b-0 md:border-r border-zinc-800/50 flex flex-col relative z-10 md:h-full md:overflow-y-auto">
            <div className="p-6 md:p-8 flex flex-col h-full">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">1. Upload Headshot</h2>
                    <p className="text-zinc-400 text-sm">Choose a clear photo to star in your poster.</p>
                </div>

                <div className="flex-1 flex flex-col items-center">
                    {!uploadedImage ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[3/4] md:aspect-[3/4] max-w-[350px] md:max-w-full rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-500 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-zinc-200">Click to Upload</p>
                            <p className="text-xs text-zinc-500 mt-2">Start your cinematic transformation</p>
                        </div>
                    ) : (
                        <div className="relative w-full aspect-[3/4] md:aspect-[3/4] max-w-[350px] md:max-w-full rounded-2xl overflow-hidden group shadow-2xl border border-zinc-700">
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
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Remove
                                </button>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg"
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
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* RIGHT PANE: Persona Selection (Grid) */}
        <div className="flex-1 bg-[#09090b] relative md:h-full md:overflow-y-auto">
            <div className="p-6 md:p-8 pb-32">
                <div className="mb-6 sticky top-0 bg-[#09090b]/95 backdrop-blur-sm z-20 py-2 border-b border-zinc-800/50">
                    <h2 className="text-xl font-bold text-white mb-2">2. Pick Your Poster</h2>
                    <p className="text-zinc-400 text-sm">Select a movie, series, or style to star in.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                    {personas.map((persona) => (
                        <PersonaCard 
                            key={persona.id} 
                            persona={persona} 
                            isSelected={selectedPersona?.id === persona.id}
                            onClick={() => setSelectedPersona(persona)}
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* FLOATING ACTION BUTTON */}
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${uploadedImage && selectedPersona ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
             <button
                onClick={handleImagine}
                className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-lg transition-all duration-200 bg-blue-600 text-white rounded-full hover:scale-105 hover:bg-blue-500 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] shadow-2xl ring-2 ring-white/10"
            >
                <span className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Create Poster
                </span>
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

    useEffect(() => {
        setImgSrc(persona.cover);
        setIsLoaded(false);
    }, [persona.cover]);

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
                    onError={() => setImgSrc(getFallbackCoverUrl(persona.prompt))}
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

export default UploadPage;
