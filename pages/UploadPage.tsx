import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { PERSONAS, getFallbackCoverUrl } from '../constants';
import Navigation from '../components/Navigation';

const MarqueeImage: React.FC<{ persona: typeof PERSONAS[0] }> = ({ persona }) => {
    const [imgSrc, setImgSrc] = useState(persona.cover);
    
    return (
        <img 
            src={imgSrc} 
            alt={persona.name} 
            className="w-full h-full object-cover opacity-80" 
            loading="lazy"
            onError={() => setImgSrc(getFallbackCoverUrl(persona.name, "cinematic style"))} 
        />
    );
}

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUploadedImage } = useImageContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        navigate('/personas');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-[#09090b]">
      <Navigation title="PersonaGen" showBack={false} />

      <div className="flex-1 flex flex-col justify-center w-full max-w-4xl px-4 py-8">
        
        {/* Compact Upload Area */}
        <div className="w-full mb-12">
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 sm:h-56 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-500 transition-all cursor-pointer flex flex-col items-center justify-center group"
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                </div>
                <p className="text-lg font-medium text-zinc-200">Upload Portrait</p>
                <p className="text-sm text-zinc-500 mt-1">Imagine yourself as anyone, anywhere.</p>
            </div>
        </div>

        {/* Compact Persona Marquee */}
        <div className="w-full">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-1">
                Popular Styles
            </h3>
            <div className="w-full overflow-x-auto pb-4 scrollbar-hide no-scrollbar mask-gradient">
                <div className="flex gap-3">
                    {PERSONAS.map((p) => (
                        <div key={p.id} className="flex-shrink-0 w-24 flex flex-col items-center gap-2">
                            <div className="w-24 h-32 rounded-lg overflow-hidden border border-zinc-800">
                                <MarqueeImage persona={p} />
                            </div>
                            <span className="text-[10px] text-zinc-400 text-center leading-tight truncate w-full">{p.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default UploadPage;