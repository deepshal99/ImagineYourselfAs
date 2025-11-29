import React from 'react';
import { useImageContext } from '../context/ImageContext';
import { PERSONAS } from '../constants';
import Navigation from '../components/Navigation';

const LibraryPage: React.FC = () => {
  const { library, removeFromLibrary } = useImageContext();

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navigation title="My Library" />

      <div className="max-w-7xl mx-auto p-6">
        
        {library.length === 0 ? (
            <div className="text-center py-20">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-zinc-400 text-lg font-medium">No saved images yet</h3>
                <p className="text-zinc-600 mt-2">Generate and save your transformations to see them here.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {library.map((item) => {
                    const persona = PERSONAS.find(p => p.id === item.personaId);
                    return (
                        <div key={item.id} className="group relative aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                            <img src={item.imageUrl} alt="Saved" className="w-full h-full object-cover" />
                            
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                <a 
                                    href={item.imageUrl} 
                                    download={`saved_persona_${item.timestamp}.png`}
                                    className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                                    title="Download"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download-icon lucide-download"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>
                                </a>
                                <button 
                                    onClick={() => removeFromLibrary(item.id)}
                                    className="p-3 bg-zinc-800 text-red-400 rounded-full hover:bg-zinc-700 hover:scale-110 transition-transform"
                                    title="Delete"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                            
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                <p className="text-xs font-medium text-zinc-300">{persona?.name || 'Unknown Style'}</p>
                                <p className="text-[10px] text-zinc-500">{new Date(item.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;